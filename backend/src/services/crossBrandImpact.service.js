// Use the same model import paths as rosterValidation.service.js
const Roster = require("../models/roster");
const RosterEntry = require("../models/rosterEntry");
const WorkingRule = require("../models/workingRule");
const PublicHoliday = require("../models/publicHoliday");

const { validateRoster } = require("./rosterValidation.service");

const getDateKey = (date) => {
  return new Date(date).toISOString().slice(0, 10);
};

const getDayName = (date) => {
  const days = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];

  return days[new Date(date).getUTCDay()];
};

const crossBrandImpactAnalysis = async ({
  rosterId,
  employeeId,
  startDate,
  endDate,
  validationReport: existingValidationReport,
  additionalAffectedCombinations = [],
}) => {
  // 1. Find roster
  const roster = await Roster.findById(rosterId).lean();

  if (!roster) {
    throw new Error("Roster not found.");
  }

  // 2. Determine the affected date range
  const fromDate = startDate
    ? new Date(startDate)
    : new Date(roster.periodStart);

  const toDate = endDate ? new Date(endDate) : new Date(roster.periodEnd);

  if (
    Number.isNaN(fromDate.getTime()) ||
    Number.isNaN(toDate.getTime()) ||
    fromDate > toDate
  ) {
    throw new Error("Invalid date range.");
  }

  fromDate.setUTCHours(0, 0, 0, 0);
  toDate.setUTCHours(23, 59, 59, 999);

  // Restrict analysis to the roster period
  const rosterStart = new Date(roster.periodStart);
  rosterStart.setUTCHours(0, 0, 0, 0);

  const rosterEnd = new Date(roster.periodEnd);
  rosterEnd.setUTCHours(23, 59, 59, 999);

  const analysisStart = new Date(
    Math.max(fromDate.getTime(), rosterStart.getTime()),
  );

  const analysisEnd = new Date(Math.min(toDate.getTime(), rosterEnd.getTime()));

  if (analysisStart > analysisEnd) {
    return {
      rosterId,
      employeeId,
      totalAffectedAssignments: 0,
      totalCoverageGaps: 0,
      impacts: [],
      message: "The requested date range is outside the roster period.",
    };
  }

  // 3. Find assignments belonging to the affected employee
  const affectedEntries = await RosterEntry.find({
    rosterId,
    employeeId,
    date: {
      $gte: analysisStart,
      $lte: analysisEnd,
    },
  }).lean();

  // 4. Identify unique Brand + Process + Date combinations
  const affectedCombinations = new Map();

  // Add combinations from the employee's existing assignments
  for (const entry of affectedEntries) {
    const brandId = entry.brandId.toString();
    const processId = entry.processId.toString();
    const dateKey = getDateKey(entry.date);

    const key = `${brandId}_${processId}_${dateKey}`;

    if (!affectedCombinations.has(key)) {
      affectedCombinations.set(key, {
        brandId: entry.brandId,
        processId: entry.processId,
        date: new Date(entry.date),
      });
    }
  }

  // NEW: Include combinations affected by the roster entry update.
  // These may no longer belong to the original employee after the update.
  for (const combination of additionalAffectedCombinations) {
    const brandId = combination.brandId.toString();
    const processId = combination.processId.toString();
    const date = new Date(combination.date);
    const dateKey = getDateKey(date);

    const key = `${brandId}_${processId}_${dateKey}`;

    if (!affectedCombinations.has(key)) {
      affectedCombinations.set(key, {
        brandId: combination.brandId,
        processId: combination.processId,
        date,
      });
    }
  }

  // Return only when neither source contains affected combinations
  if (affectedCombinations.size === 0) {
    return {
      rosterId,
      employeeId,
      totalAffectedAssignments: 0,
      totalCoverageGaps: 0,
      impacts: [],
      message: "No affected assignments found for this employee.",
    };
  }

  // 5. Fetch scheduled entries, working rules and public holidays
  const [scheduledEntries, workingRules, publicHolidays] = await Promise.all([
    RosterEntry.find({
      rosterId,
      status: "SCHEDULED",
      date: {
        $gte: analysisStart,
        $lte: analysisEnd,
      },
    }).lean(),

    WorkingRule.find({
      status: "ACTIVE",
    })
      .populate("brandId", "name")
      .populate("processId", "name")
      .lean(),

    PublicHoliday.find({
      date: {
        $gte: analysisStart,
        $lte: analysisEnd,
      },
    }).lean(),
  ]);

  // Create public holiday lookup
  const holidaySet = new Set(
    publicHolidays.map((holiday) => getDateKey(holiday.date)),
  );

  // 6. Run existing roster validation or reuse supplied report
  const validationReport =
    existingValidationReport || (await validateRoster(rosterId));

  const invalidEntryIds = new Set(
    validationReport.conflicts
      .filter((conflict) => conflict.entryId)
      .map((conflict) => conflict.entryId.toString()),
  );

  // 7. Analyse staffing for every affected combination
  const impacts = [];

  for (const combination of affectedCombinations.values()) {
    const { brandId, processId, date } = combination;

    const brandIdString = brandId.toString();
    const processIdString = processId.toString();

    const dayName = getDayName(date);
    const dateKey = getDateKey(date);

    // Find applicable working rule
    const workingRule = workingRules.find(
      (rule) =>
        rule.brandId &&
        rule.processId &&
        rule.brandId._id.toString() === brandIdString &&
        rule.processId._id.toString() === processIdString,
    );

    if (!workingRule) {
      impacts.push({
        brandId,
        processId,
        date,
        status: "MISSING_STAFFING_RULE",
        message: "No active working rule exists for this assignment.",
      });

      continue;
    }

    // Check operating day
    if (!workingRule.operatingDays.includes(dayName)) {
      impacts.push({
        brandId,
        brandName: workingRule.brandId.name,
        processId,
        processName: workingRule.processId.name,
        date,
        status: "NOT_OPERATING",
        message: `${dayName} is not an operating day.`,
      });

      continue;
    }

    // Handle public holidays
    if (holidaySet.has(dateKey) && !workingRule.operatesOnPublicHolidays) {
      impacts.push({
        brandId,
        brandName: workingRule.brandId.name,
        processId,
        processName: workingRule.processId.name,
        date,
        status: "NOT_OPERATING",
        message: "This brand/process does not operate on this public holiday.",
      });

      continue;
    }

    // Find minimum staffing requirement
    const staffingRule = workingRule.minimumStaffing.find(
      (item) => item.day === dayName,
    );

    if (!staffingRule) {
      impacts.push({
        brandId,
        brandName: workingRule.brandId.name,
        processId,
        processName: workingRule.processId.name,
        date,
        status: "MISSING_STAFFING_RULE",
        message: `No minimum staffing configured for ${dayName}.`,
      });

      continue;
    }

    const requiredEmployees = staffingRule.requiredEmployees;

    // Find valid scheduled assignments for this Brand + Process + Date
    const validEntries = scheduledEntries.filter(
      (entry) =>
        entry.brandId.toString() === brandIdString &&
        entry.processId.toString() === processIdString &&
        getDateKey(entry.date) === dateKey &&
        !invalidEntryIds.has(entry._id.toString()),
    );

    // Count unique valid employees
    const availableEmployeeIds = new Set(
      validEntries.map((entry) => entry.employeeId.toString()),
    );

    const availableEmployees = availableEmployeeIds.size;

    const shortage = Math.max(0, requiredEmployees - availableEmployees);

    const isCovered = shortage === 0;

    impacts.push({
      brandId,
      brandName: workingRule.brandId.name,
      processId,
      processName: workingRule.processId.name,
      date,
      requiredEmployees,
      availableEmployees,
      shortage,
      status: isCovered ? "COVERED" : "COVERAGE_GAP",
      message: isCovered
        ? "Minimum staffing requirement is fulfilled."
        : `Coverage gap detected. Required ${requiredEmployees}, but only ${availableEmployees} valid employees are available.`,
    });
  }

  // 8. Return cross-brand impact report
  const coverageGaps = impacts.filter(
    (impact) => impact.status === "COVERAGE_GAP",
  );

  return {
    rosterId,
    employeeId,
    totalAffectedAssignments: affectedCombinations.size,
    totalCoverageGaps: coverageGaps.length,
    impacts,
  };
};

module.exports = {
  crossBrandImpactAnalysis,
};
