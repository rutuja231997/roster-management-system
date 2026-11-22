const Employee = require("../models/employee");
const Allocation = require("../models/allocation");
const EmployeeWorkPattern = require("../models/employeeWorkPattern");
const Availability = require("../models/availability");
const WorkingRule = require("../models/workingRule");
const PublicHoliday = require("../models/publicHoliday");
const RosterEntry = require("../models/rosterEntry");
const Roster = require("../models/roster");

const { checkShiftOverlap } = require("../utils/shiftHelpers");

const {
  evaluateWeeklyOff,
  getWeeklyOffDays,
} = require("../utils/weeklyOffHelpers");

const validateEmployeeAssignment = async ({
  employeeId,
  brandId,
  processId,
  date,
  rosterId,
}) => {
  const errors = [];

  // Normalize the date to UTC
  const assignmentDate = new Date(date);

  if (Number.isNaN(assignmentDate.getTime())) {
    return {
      isValid: false,
      errors: ["Invalid assignment date."],
    };
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

  // --------------------------------------------------
  // 1. Check whether employee exists and is active
  // --------------------------------------------------

  const employee = await Employee.findById(employeeId).lean();

  if (!employee) {
    errors.push("Employee does not exist.");
  } else if (employee.status !== "ACTIVE") {
    errors.push("Employee is not active.");
  }

  // --------------------------------------------------
  // 2. Check employee allocation
  // --------------------------------------------------

  const allocation = await Allocation.findOne({
    employeeId,
    brandId,
    processId,
  }).lean();

  if (!allocation) {
    errors.push("Employee is not allocated to this brand and process.");
  }

  // --------------------------------------------------
  // 3. Check employee work pattern
  // --------------------------------------------------

  const workPattern = await EmployeeWorkPattern.findOne({
    employeeId,
    status: "ACTIVE",
    effectiveFrom: { $lte: endOfDay },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gte: startOfDay } }],
  }).lean();

  if (!workPattern) {
    errors.push("No active working pattern found for employee.");
  } else {
    // Check weekly off
    if (workPattern.weeklyOffDays.includes(dayName)) {
      errors.push(`Employee has a weekly off on ${dayName}.`);
    }

    // Check working days
    if (!workPattern.workingDays.includes(dayName)) {
      errors.push(`Employee is not scheduled to work on ${dayName}.`);
    }
  }

  // --------------------------------------------------
  // 4. Check approved availability / leave
  // --------------------------------------------------

  const availability = await Availability.findOne({
    employeeId,
    status: "APPROVED",
    startDate: { $lte: endOfDay },
    endDate: { $gte: startOfDay },
  }).lean();

  if (availability) {
    errors.push(`Employee is unavailable due to ${availability.type}.`);
  }

  // --------------------------------------------------
  // 5. Check brand/process working rule
  // --------------------------------------------------

  const workingRule = await WorkingRule.findOne({
    brandId,
    processId,
    status: "ACTIVE",
  }).lean();

  if (!workingRule) {
    errors.push("No active working rule exists for this brand and process.");
  } else if (!workingRule.operatingDays.includes(dayName)) {
    errors.push(
      `${dayName} is not an operating day for this brand and process.`,
    );
  }

  // --------------------------------------------------
  // 6. Check public holiday
  // --------------------------------------------------

  const publicHoliday = await PublicHoliday.findOne({
    date: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  }).lean();

  if (publicHoliday && workingRule) {
    if (!workingRule.operatesOnPublicHolidays) {
      errors.push(
        `${publicHoliday.name}: brand/process does not operate on public holidays.`,
      );
    }
  }

  // --------------------------------------------------
  // 7. Check duplicate assignment
  // --------------------------------------------------

  const existingAssignment = await RosterEntry.findOne({
    employeeId,
    brandId,
    processId,
    date: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
    status: "SCHEDULED",
    ...(rosterId ? { rosterId } : {}),
  }).lean();

  if (existingAssignment) {
    errors.push(
      "Employee is already assigned to this brand and process on this date.",
    );
  }

  // --------------------------------------------------
  // 8. Return validation result
  // --------------------------------------------------

  return {
    isValid: errors.length === 0,
    errors,
    employeeId,
    brandId,
    processId,
    date: startOfDay,
  };
};

const getDayName = (date) => {
  return new Date(date)
    .toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC",
    })
    .toUpperCase();
};

const getDayRange = (date) => {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
};

const validateRoster = async (rosterId) => {
  // 1. Find roster
  const roster = await Roster.findById(rosterId).lean();

  if (!roster) {
    throw new Error("Roster not found.");
  }

  // 2. Fetch roster data
  const [
    entries,
    employees,
    workingRules,
    workPatterns,
    availabilityRecords,
    allocations,
    publicHolidays,
  ] = await Promise.all([
    RosterEntry.find({
      rosterId,
      status: "SCHEDULED",
    }).lean(),

    Employee.find({}).lean(),

    WorkingRule.find({ status: "ACTIVE" })
      .populate("brandId", "name")
      .populate("processId", "name")
      .lean(),

    EmployeeWorkPattern.find({
      status: "ACTIVE",
      effectiveFrom: { $lte: roster.periodEnd },
      $or: [
        { effectiveTo: null },
        { effectiveTo: { $gte: roster.periodStart } },
      ],
    }).lean(),

    Availability.find({
      status: "APPROVED",
      startDate: { $lte: roster.periodEnd },
      endDate: { $gte: roster.periodStart },
    }).lean(),

    Allocation.find({}).lean(),

    PublicHoliday.find({
      date: {
        $gte: roster.periodStart,
        $lte: roster.periodEnd,
      },
    }).lean(),
  ]);

  // 3. Create lookup maps
  const employeeMap = new Map(
    employees.map((employee) => [employee._id.toString(), employee]),
  );

  const workPatternMap = new Map();

  workPatterns.forEach((pattern) => {
    const employeeId = pattern.employeeId.toString();

    if (!workPatternMap.has(employeeId)) {
      workPatternMap.set(employeeId, []);
    }

    workPatternMap.get(employeeId).push(pattern);
  });

  const allocationSet = new Set(
    allocations.map(
      (allocation) =>
        `${allocation.employeeId}_${allocation.brandId}_${allocation.processId}`,
    ),
  );

  const holidaySet = new Set(
    publicHolidays.map((holiday) =>
      new Date(holiday.date).toISOString().slice(0, 10),
    ),
  );

  // Find the employee's applicable work pattern for a date
  const getApplicableWorkPattern = (employeeId, date) => {
    const patterns = workPatternMap.get(employeeId.toString()) || [];

    const { start } = getDayRange(date);

    return patterns.find((pattern) => {
      const from = new Date(pattern.effectiveFrom);
      const to = pattern.effectiveTo ? new Date(pattern.effectiveTo) : null;

      return from <= start && (!to || to >= start);
    });
  };

  // 4. Store validation results
  const conflicts = [];
  const invalidEntryIds = new Set();

  const addConflict = (conflict) => {
    conflicts.push(conflict);

    if (conflict.entryId && conflict.severity === "HIGH") {
      invalidEntryIds.add(conflict.entryId.toString());
    }
  };

  // 5. Validate individual roster entries
  for (const entry of entries) {
    const employeeId = entry.employeeId.toString();
    const brandId = entry.brandId.toString();
    const processId = entry.processId.toString();

    const employee = employeeMap.get(employeeId);

    const { start, end } = getDayRange(entry.date);
    const dayName = getDayName(entry.date);
    const dateKey = start.toISOString().slice(0, 10);

    const baseConflict = {
      employeeId: entry.employeeId,
      brandId: entry.brandId,
      processId: entry.processId,
      date: start,
      entryId: entry._id,
    };

    // Employee existence and status
    if (!employee || employee.status !== "ACTIVE") {
      addConflict({
        ...baseConflict,
        type: "EMPLOYEE_UNAVAILABLE",
        severity: "HIGH",
        message: "Employee does not exist or is not active.",
      });

      continue;
    }

    // Allocation validation
    const allocationKey = `${employeeId}_${brandId}_${processId}`;

    if (!allocationSet.has(allocationKey)) {
      addConflict({
        ...baseConflict,
        type: "WORKING_RULE_VIOLATION",
        severity: "HIGH",
        message: "Employee is not allocated to this brand and process.",
      });
    }

    // Working pattern validation
    const workPattern = getApplicableWorkPattern(employeeId, start);

    if (!workPattern) {
      addConflict({
        ...baseConflict,
        type: "EMPLOYEE_UNAVAILABLE",
        severity: "HIGH",
        message: "No active working pattern found for employee.",
      });
    } else {
      const weeklyOffResult = evaluateWeeklyOff(workPattern, dayName);

      // Mandatory weekly off cannot be overridden
      if (!weeklyOffResult.allowed) {
        addConflict({
          ...baseConflict,
          type: "WEEKLY_OFF",
          severity: "HIGH",
          message: weeklyOffResult.message,
        });
      } else if (!workPattern.workingDays.includes(dayName)) {
        // A preferred weekly off can be overridden.
        // Other non-working days remain unavailable.
        const isPreferredOff = weeklyOffResult.type === "PREFERENCE_OVERRIDDEN";

        if (!isPreferredOff) {
          addConflict({
            ...baseConflict,
            type: "EMPLOYEE_UNAVAILABLE",
            severity: "HIGH",
            message: `Employee is not scheduled to work on ${dayName}.`,
          });
        }
      }
    }

    // Approved leave/unavailability validation
    const employeeAvailability = availabilityRecords.filter(
      (record) =>
        record.employeeId.toString() === employeeId &&
        new Date(record.startDate) <= end &&
        new Date(record.endDate) >= start,
    );

    employeeAvailability.forEach((record) => {
      addConflict({
        ...baseConflict,
        type: "EMPLOYEE_UNAVAILABLE",
        severity: "HIGH",
        message: `Employee is unavailable due to ${record.type}.`,
      });
    });

    // Working rule validation
    const workingRule = workingRules.find(
      (rule) =>
        rule.brandId._id.toString() === brandId &&
        rule.processId._id.toString() === processId,
    );

    if (!workingRule) {
      addConflict({
        ...baseConflict,
        type: "MISSING_STAFFING_RULE",
        severity: "HIGH",
        message: "No active working rule exists for this assignment.",
      });

      continue;
    }

    if (!workingRule.operatingDays.includes(dayName)) {
      addConflict({
        ...baseConflict,
        type: "WORKING_RULE_VIOLATION",
        severity: "HIGH",
        message: `${dayName} is not an operating day.`,
      });
    }

    if (holidaySet.has(dateKey) && !workingRule.operatesOnPublicHolidays) {
      addConflict({
        ...baseConflict,
        type: "PUBLIC_HOLIDAY",
        severity: "HIGH",
        message: "Brand/process does not operate on this public holiday.",
      });
    }
  }

  // 5.5. Validate overlapping assignments
  const entriesByEmployeeAndDate = new Map();

  for (const entry of entries) {
    const employeeId = entry.employeeId.toString();
    const dateKey = new Date(entry.date).toISOString().slice(0, 10);

    const key = `${employeeId}_${dateKey}`;

    if (!entriesByEmployeeAndDate.has(key)) {
      entriesByEmployeeAndDate.set(key, []);
    }

    entriesByEmployeeAndDate.get(key).push(entry);
  }

  for (const employeeEntries of entriesByEmployeeAndDate.values()) {
    // Compare assignments of the same employee on the same date
    for (let i = 0; i < employeeEntries.length; i++) {
      for (let j = i + 1; j < employeeEntries.length; j++) {
        const entryA = employeeEntries[i];
        const entryB = employeeEntries[j];

        // Check whether the shifts overlap
        const isOverlapping = checkShiftOverlap(entryA, entryB);

        if (!isOverlapping) {
          continue;
        }

        const { start } = getDayRange(entryA.date);

        // Both assignments are invalid due to overlapping shifts
        const overlappingConflict = {
          type: "OVERLAPPING_ASSIGNMENT",
          severity: "HIGH",
          message:
            `Employee is assigned to overlapping shifts. ` +
            `Assignment 1: ${entryA.shiftStart}-${entryA.shiftEnd}, ` +
            `Assignment 2: ${entryB.shiftStart}-${entryB.shiftEnd}.`,
        };

        // Register conflict for the first assignment
        addConflict({
          ...overlappingConflict,
          employeeId: entryA.employeeId,
          brandId: entryA.brandId,
          processId: entryA.processId,
          date: start,
          entryId: entryA._id,
        });

        // Register conflict for the second assignment
        addConflict({
          ...overlappingConflict,
          employeeId: entryB.employeeId,
          brandId: entryB.brandId,
          processId: entryB.processId,
          date: start,
          entryId: entryB._id,
        });
      }
    }
  }

  // 6. Validate required staffing for every operating day
  const rulesById = new Map(
    workingRules.map((rule) => [
      `${rule.brandId._id}_${rule.processId._id}`,
      rule,
    ]),
  );

  const dates = [];

  const currentDate = new Date(roster.periodStart);
  currentDate.setUTCHours(0, 0, 0, 0);

  const lastDate = new Date(roster.periodEnd);
  lastDate.setUTCHours(0, 0, 0, 0);

  while (currentDate <= lastDate) {
    dates.push(new Date(currentDate));
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  for (const rule of workingRules) {
    for (const date of dates) {
      const dayName = getDayName(date);
      const dateKey = date.toISOString().slice(0, 10);

      if (!rule.operatingDays.includes(dayName)) {
        continue;
      }

      if (holidaySet.has(dateKey) && !rule.operatesOnPublicHolidays) {
        continue;
      }

      const staffingRule = rule.minimumStaffing.find(
        (item) => item.day === dayName,
      );

      if (!staffingRule) {
        addConflict({
          employeeId: null,
          brandId: rule.brandId._id,
          processId: rule.processId._id,
          date,
          type: "MISSING_STAFFING_RULE",
          severity: "HIGH",
          message:
            `${rule.brandId.name} - ${rule.processId.name}: ` +
            `No minimum staffing configured for ${dayName}.`,
        });

        continue;
      }

      const requiredEmployees = staffingRule.requiredEmployees;

      const scheduledEntries = entries.filter(
        (entry) =>
          entry.brandId.toString() === rule.brandId._id.toString() &&
          entry.processId.toString() === rule.processId._id.toString() &&
          new Date(entry.date).toISOString().slice(0, 10) === dateKey &&
          !invalidEntryIds.has(entry._id.toString()),
      );

      // Count unique scheduled employees
      const scheduledEmployeeIds = new Set(
        scheduledEntries.map((entry) => entry.employeeId.toString()),
      );

      const scheduledCount = scheduledEmployeeIds.size;

      // Separate preferred-off employees from other employees
      const preferredOffAssignments = new Map();
      const regularEmployeeIds = new Set();

      for (const entry of scheduledEntries) {
        const employeeId = entry.employeeId.toString();

        const workPattern = getApplicableWorkPattern(employeeId, date);

        if (!workPattern) {
          continue;
        }

        const weeklyOffResult = evaluateWeeklyOff(workPattern, dayName);

        if (weeklyOffResult.type === "PREFERENCE_OVERRIDDEN") {
          // One employee should count only once for staffing
          if (!preferredOffAssignments.has(employeeId)) {
            preferredOffAssignments.set(employeeId, entry);
          }
        } else {
          regularEmployeeIds.add(employeeId);
        }
      }

      // Determine whether preferred-off employees are actually needed
      const requiredPreferredAssignments = Math.max(
        0,
        requiredEmployees - regularEmployeeIds.size,
      );

      const overriddenAssignments = [...preferredOffAssignments.values()].slice(
        0,
        requiredPreferredAssignments,
      );

      // Create a LOW severity warning only for necessary overrides
      for (const entry of overriddenAssignments) {
        addConflict({
          employeeId: entry.employeeId,
          brandId: entry.brandId,
          processId: entry.processId,
          date,
          type: "PREFERENCE_OVERRIDDEN",
          severity: "LOW",
          message:
            `Employee is scheduled on their preferred weekly off ` +
            `(${dayName}) because client coverage requires it.`,
        });
      }

      // Check actual staffing shortage
      if (scheduledCount < requiredEmployees) {
        const shortage = requiredEmployees - scheduledCount;

        addConflict({
          employeeId: null,
          brandId: rule.brandId._id,
          processId: rule.processId._id,
          date,
          type: "INSUFFICIENT_STAFFING",
          severity: "HIGH",
          requiredEmployees,
          availableEmployees: scheduledCount,
          shortage,
          message:
            `${rule.brandId.name} - ${rule.processId.name}: ` +
            `Required ${requiredEmployees} employees, but only ` +
            `${scheduledCount} valid employees are scheduled.`,
        });
      }
    }
  }

  console.log("========== VALIDATION RESULTS ==========");

  console.log("Total detected conflicts:", conflicts.length);

  const conflictBreakdown = conflicts.reduce((acc, conflict) => {
    acc[conflict.type] = (acc[conflict.type] || 0) + 1;
    return acc;
  }, {});

  console.log("Conflict breakdown:", conflictBreakdown);

  // Check for duplicate conflicts generated during validation
  const conflictKeys = conflicts.map((conflict) =>
    [
      conflict.brandId?.toString() || "null",
      conflict.processId?.toString() || "null",
      new Date(conflict.date).toISOString().slice(0, 10),
      conflict.type,
      conflict.employeeId?.toString() || "null",
    ].join("|"),
  );

  const duplicateKeys = conflictKeys.filter(
    (key, index) => conflictKeys.indexOf(key) !== index,
  );

  console.log("Duplicate conflict keys:", duplicateKeys);
  console.log("Duplicate conflict count:", duplicateKeys.length);

  console.log("=======================================");

  // 7. Return validation report
  return {
    rosterId,
    isValid: conflicts.length === 0,
    totalAssignments: entries.length,
    totalConflicts: conflicts.length,
    conflicts,
  };
};

module.exports = {
  validateEmployeeAssignment,
  validateRoster,
};
