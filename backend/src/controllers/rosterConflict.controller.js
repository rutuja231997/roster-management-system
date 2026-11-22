const mongoose = require("mongoose");

const RosterConflict = require("../models/rosterConflict");
const RosterEntry = require("../models/rosterEntry");
const Employee = require("../models/employee");
const Allocation = require("../models/allocation");
const Availability = require("../models/availability");
const EmployeeWorkPattern = require("../models/employeeWorkPattern");

const {
  validateEmployeeAssignment,
  validateRoster,
} = require("../services/rosterValidation.service");

const {
  syncRosterConflicts,
} = require("../services/rosterConflictSync.service");

//get all roster conflicts
const getRosterConflictsController = async (req, res) => {
  try {
    const { rosterId } = req.params;
    const { status, date, type } = req.query;

    const query = { rosterId };

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (date) {
      const startDate = new Date(`${date}T00:00:00.000Z`);
      const endDate = new Date(`${date}T23:59:59.999Z`);

      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime())
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Use YYYY-MM-DD.",
        });
      }

      query.date = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const [conflicts, statusCounts] = await Promise.all([
      RosterConflict.find(query)
        .populate("brandId", "name")
        .populate("processId", "name")
        .populate("employeeId", "employeeCode firstName lastName")
        .sort({ date: 1, createdAt: 1 })
        .lean(),

      RosterConflict.aggregate([
        { $match: { rosterId: new mongoose.Types.ObjectId(rosterId) } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const counts = {
      OPEN: 0,
      RESOLVED: 0,
      IGNORED: 0,
    };

    statusCounts.forEach(({ _id, count }) => {
      counts[_id] = count;
    });

    return res.status(200).json({
      success: true,
      totalConflicts: counts.OPEN,
      totalRecords: conflicts.length,
      statusCounts: counts,
      conflicts,
    });
  } catch (error) {
    console.error("Get roster conflicts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch roster conflicts.",
      error: error.message,
    });
  }
};

// resolve roster conflict
const resolveRosterConflictController = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { conflictId } = req.params;
    const { employeeId, resolutionNotes } = req.body;

    // 1. Validate request
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required.",
      });
    }

    // 2. Fetch conflict
    const conflict = await RosterConflict.findById(conflictId);

    if (!conflict) {
      return res.status(404).json({
        success: false,
        message: "Roster conflict not found.",
      });
    }

    // 3. Check conflict status
    if (conflict.status !== "OPEN") {
      return res.status(400).json({
        success: false,
        message: `Conflict is already ${conflict.status}.`,
      });
    }

    // 4. Only handle staffing conflicts for now
    if (conflict.type !== "INSUFFICIENT_STAFFING") {
      return res.status(400).json({
        success: false,
        message:
          "This conflict type cannot be resolved through employee assignment.",
      });
    }

    // 5. Validate employee assignment
    const validationResult = await validateEmployeeAssignment({
      employeeId,
      brandId: conflict.brandId,
      processId: conflict.processId,
      date: conflict.date,
      rosterId: conflict.rosterId,
    });

    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: "Employee cannot be assigned to this roster.",
        errors: validationResult.errors,
      });
    }

    // 6. Fetch employee details
    const employee = await Employee.findById(employeeId).lean();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    // 7. Start transaction
    session.startTransaction();

    // 8. Create manual roster assignment
    const rosterEntry = new RosterEntry({
      rosterId: conflict.rosterId,
      employeeId,
      brandId: conflict.brandId,
      processId: conflict.processId,
      date: conflict.date,
      status: "SCHEDULED",
      source: "MANUAL",
      notes:
        resolutionNotes || "Assignment created to resolve staffing conflict.",
    });

    await rosterEntry.save({ session });

    // 9. Recalculate actual staffing
    const startOfDay = new Date(conflict.date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(conflict.date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const scheduledEmployees = await RosterEntry.countDocuments({
      rosterId: conflict.rosterId,
      brandId: conflict.brandId,
      processId: conflict.processId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: "SCHEDULED",
    }).session(session);

    // 10. Calculate remaining shortage
    const remainingShortage = Math.max(
      0,
      conflict.requiredEmployees - scheduledEmployees,
    );

    // 11. Update conflict record
    conflict.availableEmployees = scheduledEmployees;
    conflict.shortage = remainingShortage;

    if (
      employee.employeeCode &&
      !conflict.allocatedEmployeeCodes.includes(employee.employeeCode)
    ) {
      conflict.allocatedEmployeeCodes.push(employee.employeeCode);
    }

    conflict.resolutionNotes = resolutionNotes || "";

    if (remainingShortage === 0) {
      conflict.status = "RESOLVED";
      conflict.resolvedAt = new Date();
    }

    await conflict.save({ session });

    // 12. Commit transaction
    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message:
        remainingShortage === 0
          ? "Conflict resolved successfully."
          : "Employee assigned successfully, but the conflict remains open because staffing is still insufficient.",
      conflict: {
        conflictId: conflict._id,
        status: conflict.status,
        requiredEmployees: conflict.requiredEmployees,
        availableEmployees: conflict.availableEmployees,
        shortage: conflict.shortage,
      },
      rosterEntry,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    // Handle duplicate assignment
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This employee is already assigned to this brand, process, and date.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to resolve roster conflict.",
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
};

// get eligible employees for a resolve conflict
const getEligibleEmployeesController = async (req, res) => {
  try {
    const { conflictId } = req.params;

    // 1. Validate conflict ID
    if (!mongoose.Types.ObjectId.isValid(conflictId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conflict ID.",
      });
    }

    // 2. Find the conflict
    const conflict = await RosterConflict.findById(conflictId)
      .populate("brandId", "name")
      .populate("processId", "name")
      .lean();

    if (!conflict) {
      return res.status(404).json({
        success: false,
        message: "Roster conflict not found.",
      });
    }

    // 3. Only handle insufficient staffing conflicts
    if (conflict.type !== "INSUFFICIENT_STAFFING") {
      return res.status(400).json({
        success: false,
        message:
          "Eligible employees can only be retrieved for insufficient staffing conflicts.",
      });
    }

    if (conflict.status !== "OPEN") {
      return res.status(400).json({
        success: false,
        message: "This conflict is no longer open.",
      });
    }

    // 4. Prepare conflict date
    const assignmentDate = new Date(conflict.date);

    if (Number.isNaN(assignmentDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid conflict date.",
      });
    }

    const startOfDay = new Date(assignmentDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(assignmentDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const dayName = assignmentDate
      .toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "UTC",
      })
      .toUpperCase();

    // 5. Find ALL active employees
    const employees = await Employee.find({
      status: "ACTIVE",
    }).lean();

    if (employees.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No active employees found.",
        eligibleEmployees: [],
        ineligibleEmployees: [],
      });
    }

    const employeeIds = employees.map((employee) => employee._id);

    // 6. Fetch relevant data
    const [
      workPatterns,
      availabilityRecords,
      existingAssignments,
      allocations,
    ] = await Promise.all([
      EmployeeWorkPattern.find({
        employeeId: { $in: employeeIds },
        status: "ACTIVE",
        effectiveFrom: { $lte: startOfDay },
        $or: [{ effectiveTo: null }, { effectiveTo: { $gte: startOfDay } }],
      }).lean(),

      Availability.find({
        employeeId: { $in: employeeIds },
        status: "APPROVED",
        startDate: { $lte: endOfDay },
        endDate: { $gte: startOfDay },
      }).lean(),

      RosterEntry.find({
        rosterId: conflict.rosterId,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: "SCHEDULED",
      }).lean(),

      Allocation.find({
        employeeId: { $in: employeeIds },
        brandId: conflict.brandId._id,
        processId: conflict.processId._id,
      }).lean(),
    ]);

    // 7. Create lookup maps
    const workPatternMap = new Map(
      workPatterns.map((pattern) => [pattern.employeeId.toString(), pattern]),
    );

    const availabilityMap = new Map();

    availabilityRecords.forEach((record) => {
      const employeeId = record.employeeId.toString();

      if (!availabilityMap.has(employeeId)) {
        availabilityMap.set(employeeId, []);
      }

      availabilityMap.get(employeeId).push(record);
    });

    const allocatedEmployeeIds = new Set(
      allocations.map((allocation) => allocation.employeeId.toString()),
    );

    // Existing assignment to this same brand/process/date
    const assignedEmployeeIds = new Set(
      existingAssignments
        .filter(
          (entry) =>
            entry.brandId.toString() === conflict.brandId._id.toString() &&
            entry.processId.toString() === conflict.processId._id.toString(),
        )
        .map((entry) => entry.employeeId.toString()),
    );

    // 8. Check each employee's availability
    const results = employees.map((employee) => {
      const employeeId = employee._id.toString();
      const reasons = [];

      const workPattern = workPatternMap.get(employeeId);
      const employeeAvailability = availabilityMap.get(employeeId) || [];

      // Check working pattern
      if (!workPattern) {
        reasons.push("No active working pattern found.");
      } else {
        if (workPattern.weeklyOffDays.includes(dayName)) {
          reasons.push(`Employee has a weekly off on ${dayName}.`);
        }

        if (!workPattern.workingDays.includes(dayName)) {
          reasons.push(`Employee is not scheduled to work on ${dayName}.`);
        }
      }

      // Check approved leave/unavailability
      employeeAvailability.forEach((record) => {
        reasons.push(`Employee is unavailable due to ${record.type}.`);
      });

      // Check existing assignment for the same brand/process
      if (assignedEmployeeIds.has(employeeId)) {
        reasons.push(
          "Employee is already assigned to this brand and process on this date.",
        );
      }

      const isEligible = reasons.length === 0;
      const isAllocated = allocatedEmployeeIds.has(employeeId);

      return {
        employeeId: employee._id,
        employeeCode: employee.employeeCode,
        name: `${employee.firstName || ""} ${employee.lastName || ""}`.trim(),

        isEligible,

        // Whether an Allocation record already exists
        isAllocated,

        // New allocation must be created before resolving
        requiresAllocation: !isAllocated,

        reasons,
      };
    });

    // 9. Separate eligible and ineligible employees
    const eligibleEmployees = results.filter((employee) => employee.isEligible);

    const ineligibleEmployees = results.filter(
      (employee) => !employee.isEligible,
    );

    // 10. Return response
    return res.status(200).json({
      success: true,
      message: "Eligible employees retrieved successfully.",

      conflict: {
        conflictId: conflict._id,
        brand: conflict.brandId.name,
        process: conflict.processId.name,
        date: conflict.date,
        day: dayName,
        requiredEmployees: conflict.requiredEmployees,
        currentAvailableEmployees: conflict.availableEmployees,
        shortage: conflict.shortage,
      },

      summary: {
        totalActiveEmployees: employees.length,
        eligibleCount: eligibleEmployees.length,
        ineligibleCount: ineligibleEmployees.length,
        alreadyAllocatedCount: eligibleEmployees.filter(
          (employee) => employee.isAllocated,
        ).length,
        requiresAllocationCount: eligibleEmployees.filter(
          (employee) => employee.requiresAllocation,
        ).length,
      },

      eligibleEmployees,
      ineligibleEmployees,
    });
  } catch (error) {
    console.error("Get eligible employees error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve eligible employees.",
      error: error.message,
    });
  }
};

// Validate roster and synchronize conflicts
const validateRosterController = async (req, res) => {
  try {
    const { rosterId } = req.params;

    // 1. Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(rosterId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid roster ID.",
      });
    }

    // 2. Validate roster
    const validationResult = await validateRoster(rosterId);

    // 3. Synchronize detected conflicts with database
    const syncResult = await syncRosterConflicts(
      rosterId,
      validationResult.conflicts,
    );

    // 4. Return validation and synchronization results
    return res.status(200).json({
      success: true,
      message: "Roster validation and conflict synchronization completed.",

      data: {
        validation: {
          rosterId: validationResult.rosterId,
          isValid: validationResult.isValid,
          totalAssignments: validationResult.totalAssignments,
          totalConflicts: validationResult.totalConflicts,
          conflicts: validationResult.conflicts,
        },

        synchronization: syncResult,
      },
    });
  } catch (error) {
    console.error("Validate roster error:", error);

    if (error.message === "Roster not found.") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to validate and synchronize roster conflicts.",
      error: error.message,
    });
  }
};

module.exports = {
  getRosterConflictsController,
  resolveRosterConflictController,
  getEligibleEmployeesController,
  validateRosterController,
};
