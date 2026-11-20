const mongoose = require("mongoose");

const RosterEntry = require("../models/rosterEntry");
const Roster = require("../models/roster");
const Employee = require("../models/employee");
const Allocation = require("../models/allocation");
const Brand = require("../models/brand");
const Process = require("../models/process");

const {
  syncRosterConflicts,
} = require("../services/rosterConflictSync.service");

const {
  crossBrandImpactAnalysis,
} = require("../services/crossBrandImpact.service");

const { validateRoster } = require("../services/rosterValidation.service");

// create roster entry
const createRosterEntryController = async (req, res) => {
  try {
    const {
      rosterId,
      employeeId,
      brandId,
      processId,
      date,
      status,
      source,
      notes,
    } = req.body;

    if (!rosterId || !employeeId || !brandId || !processId || !date) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided.",
      });
    }

    const roster = await Roster.findById(rosterId);

    if (!roster) {
      return res.status(404).json({
        success: false,
        message: "Roster not found.",
      });
    }

    const entryDate = new Date(`${date}T00:00:00.000Z`);

    if (
      Number.isNaN(entryDate.getTime()) ||
      entryDate.toISOString().slice(0, 10) !== date
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date. Use YYYY-MM-DD.",
      });
    }

    if (entryDate < roster.periodStart || entryDate > roster.periodEnd) {
      return res.status(400).json({
        success: false,
        message: "Date is outside the roster period.",
      });
    }

    const [employee, brand, process] = await Promise.all([
      Employee.findById(employeeId),
      Brand.findById(brandId),
      Process.findById(processId),
    ]);

    if (!employee || !brand || !process) {
      return res.status(404).json({
        success: false,
        message: "Employee, brand, or process not found.",
      });
    }

    const rosterEntry = await RosterEntry.create({
      rosterId,
      employeeId,
      brandId,
      processId,
      date: entryDate,
      status: status || "SCHEDULED",
      source: source || "MANUAL",
      notes: notes || "Manually created roster entry.",
    });

    return res.status(201).json({
      success: true,
      message: "Roster entry created successfully.",
      rosterEntry,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create roster entry.",
      error: error.message,
    });
  }
};

// Update a roster entry
const updateRosterEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      employeeId,
      brandId,
      processId,
      date,
      shiftStart,
      shiftEnd,
      notes,
    } = req.body;

    // 1. Validate roster entry ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid roster entry ID.",
      });
    }

    // 2. Find existing roster entry
    const rosterEntry = await RosterEntry.findById(id);

    if (!rosterEntry) {
      return res.status(404).json({
        success: false,
        message: "Roster entry not found.",
      });
    }

    if (rosterEntry.status !== "SCHEDULED") {
      return res.status(400).json({
        success: false,
        message: "Only scheduled roster entries can be updated.",
      });
    }

    // 3. Capture original assignment before updating
    const originalAssignment = {
      employeeId: rosterEntry.employeeId,
      brandId: rosterEntry.brandId,
      processId: rosterEntry.processId,
      date: new Date(rosterEntry.date),
    };

    // 4. Find associated roster
    const roster = await Roster.findById(rosterEntry.rosterId);

    if (!roster) {
      return res.status(404).json({
        success: false,
        message: "Associated roster not found.",
      });
    }

    // 5. Prepare updated values
    const updatedEmployeeId = employeeId || rosterEntry.employeeId;
    const updatedBrandId = brandId || rosterEntry.brandId;
    const updatedProcessId = processId || rosterEntry.processId;

    const updatedDate =
      date !== undefined ? new Date(date) : new Date(rosterEntry.date);

    const updatedShiftStart =
      shiftStart !== undefined ? shiftStart : rosterEntry.shiftStart;

    const updatedShiftEnd =
      shiftEnd !== undefined ? shiftEnd : rosterEntry.shiftEnd;

    // 6. Validate IDs
    const idsToValidate = [updatedEmployeeId, updatedBrandId, updatedProcessId];

    if (idsToValidate.some((value) => !mongoose.isValidObjectId(value))) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee, brand or process ID.",
      });
    }

    // 7. Validate date
    if (Number.isNaN(updatedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid assignment date.",
      });
    }

    // Normalize date to UTC midnight
    updatedDate.setUTCHours(0, 0, 0, 0);

    const periodStart = new Date(roster.periodStart);
    periodStart.setUTCHours(0, 0, 0, 0);

    const periodEnd = new Date(roster.periodEnd);
    periodEnd.setUTCHours(0, 0, 0, 0);

    if (updatedDate < periodStart || updatedDate > periodEnd) {
      return res.status(400).json({
        success: false,
        message: "Assignment date must be within the roster period.",
      });
    }

    // 8. Validate shift timings
    if (
      (updatedShiftStart && !updatedShiftEnd) ||
      (!updatedShiftStart && updatedShiftEnd)
    ) {
      return res.status(400).json({
        success: false,
        message: "Both shift start and end times must be provided.",
      });
    }

    if (updatedShiftStart && updatedShiftEnd) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

      if (
        !timeRegex.test(updatedShiftStart) ||
        !timeRegex.test(updatedShiftEnd)
      ) {
        return res.status(400).json({
          success: false,
          message: "Shift times must use HH:mm format.",
        });
      }

      const toMinutes = (time) => {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
      };

      if (toMinutes(updatedShiftEnd) <= toMinutes(updatedShiftStart)) {
        return res.status(400).json({
          success: false,
          message: "Shift end time must be later than shift start time.",
        });
      }
    }

    // 9. Check whether employee is active
    const employee = await Employee.findOne({
      _id: updatedEmployeeId,
      status: "ACTIVE",
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Active employee not found.",
      });
    }

    // 10. Check employee allocation to brand and process
    const allocation = await Allocation.findOne({
      employeeId: updatedEmployeeId,
      brandId: updatedBrandId,
      processId: updatedProcessId,
    });

    if (!allocation) {
      return res.status(400).json({
        success: false,
        message: "Employee is not allocated to this brand and process.",
      });
    }

    // 11. Prevent duplicate assignments
    const existingEntry = await RosterEntry.findOne({
      _id: { $ne: rosterEntry._id },
      rosterId: rosterEntry.rosterId,
      employeeId: updatedEmployeeId,
      brandId: updatedBrandId,
      processId: updatedProcessId,
      date: updatedDate,
    });

    if (existingEntry) {
      return res.status(409).json({
        success: false,
        message: "This employee assignment already exists in the roster.",
      });
    }

    // 12. Apply updates
    rosterEntry.employeeId = updatedEmployeeId;
    rosterEntry.brandId = updatedBrandId;
    rosterEntry.processId = updatedProcessId;
    rosterEntry.date = updatedDate;
    rosterEntry.shiftStart = updatedShiftStart || null;
    rosterEntry.shiftEnd = updatedShiftEnd || null;

    if (notes !== undefined) {
      rosterEntry.notes = notes;
    }

    rosterEntry.source = "MANUAL";

    await rosterEntry.save();

    // 13. Validate the updated roster
    const validationReport = await validateRoster(rosterEntry.rosterId);

    // 13.5. Synchronize detected conflicts
    const conflictSyncResult = await syncRosterConflicts(
      rosterEntry.rosterId,
      validationReport.conflicts,
    );
    // 14. Prepare affected Brand + Process + Date combinations
    const additionalAffectedCombinations = [
      {
        brandId: originalAssignment.brandId,
        processId: originalAssignment.processId,
        date: originalAssignment.date,
      },
      {
        brandId: rosterEntry.brandId,
        processId: rosterEntry.processId,
        date: rosterEntry.date,
      },
    ];

    // 15. Identify old and new employees
    const affectedEmployeeIds = [
      ...new Set([
        originalAssignment.employeeId.toString(),
        rosterEntry.employeeId.toString(),
      ]),
    ];

    // Include both original and updated dates
    const startDate = new Date(
      Math.min(originalAssignment.date.getTime(), rosterEntry.date.getTime()),
    );

    const endDate = new Date(
      Math.max(originalAssignment.date.getTime(), rosterEntry.date.getTime()),
    );

    // 16. Run cross-brand impact analysis
    const impactReports = await Promise.all(
      affectedEmployeeIds.map((affectedEmployeeId) =>
        crossBrandImpactAnalysis({
          rosterId: rosterEntry.rosterId,
          employeeId: affectedEmployeeId,
          startDate,
          endDate,
          validationReport,
          additionalAffectedCombinations,
        }),
      ),
    );

    // 17. Combine impact reports without duplicate combinations
    const uniqueImpacts = new Map();

    for (const report of impactReports) {
      for (const impact of report.impacts) {
        const key = [
          impact.brandId.toString(),
          impact.processId.toString(),
          new Date(impact.date).toISOString().slice(0, 10),
        ].join("_");

        uniqueImpacts.set(key, impact);
      }
    }

    const impacts = [...uniqueImpacts.values()];

    const totalCoverageGaps = impacts.filter(
      (impact) => impact.status === "COVERAGE_GAP",
    ).length;

    // 18. Return updated entry and impact report
    return res.status(200).json({
      success: true,
      message: "Roster entry updated and impact analysis completed.",
      data: {
        rosterEntry,
        conflictSyncResult,
        impactSummary: {
          totalAffectedAssignments: impacts.length,
          totalCoverageGaps,
        },
        impacts,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate roster assignment is not allowed.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  updateRosterEntry,
  createRosterEntryController,
};
