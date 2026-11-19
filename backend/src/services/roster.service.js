const Employee = require("../models/employee");
const Allocation = require("../models/allocation");
const WorkingRule = require("../models/workingRule");
const Availability = require("../models/availability");
const EmployeeWorkPattern = require("../models/employeeWorkPattern");
const PublicHoliday = require("../models/publicHoliday");
const Brand = require("../models/brand");
const Process = require("../models/process");

const {
  generateDailyAssignments,
  getMonthDates,
} = require("../utils/rosterHelpers");

const getRosterGenerationData = async (month, year) => {
  // start and end dates of the requested moth
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const [
    employees,
    allocations,
    workingPatterns,
    availabilityRecords,
    workingRules,
    publicHolidays,
    brands,
    processes,
  ] = await Promise.all([
    //fetch active employees
    Employee.find({ status: "ACTIVE" }).lean(),

    // fetch active allocations
    Allocation.find({ isActive: true }).lean(),

    //fetch active work patterns applicable to this month
    EmployeeWorkPattern.find({
      status: "ACTIVE",
      effectiveFrom: { $lte: monthEnd },
      $or: [{ effectiveTo: null }, { effectiveTo: { $gte: monthStart } }],
    }).lean(),

    //fetch approved availability records overlapping this month
    Availability.find({
      status: "APPROVED",
      startDate: { $lte: monthEnd },
      endDate: { $gte: monthStart },
    }).lean(),

    // fetch active working rules
    WorkingRule.find({ status: "ACTIVE" }).lean(),

    //fetch public holidays within this month
    PublicHoliday.find({
      date: {
        $gte: monthStart,
        $lte: monthEnd,
      },
    }).lean(),

    Brand.find({ status: "ACTIVE" }).lean(),
    Process.find({ status: "ACTIVE" }).lean(),
  ]);

  return {
    monthStart,
    monthEnd,
    employees,
    allocations,
    workingPatterns,
    availabilityRecords,
    workingRules,
    publicHolidays,
    brands,
    processes,
  };
};

const generateMonthlyRoster = async (month, year) => {
  // 1. Fetch all required data once
  const data = await getRosterGenerationData(month, year);

  // 2. Get all dates of the requested month
  const dates = getMonthDates(month, year);

  // Store daily generation results
  const dailyResults = [];

  // 3. Generate assignments for every date
  for (const dateInfo of dates) {
    const dailyResult = generateDailyAssignments({
      dateInfo,
      employees: data.employees,
      allocations: data.allocations,
      workPatterns: data.workingPatterns,
      availabilityRecords: data.availabilityRecords,
      workingRules: data.workingRules,
      publicHolidays: data.publicHolidays,
      brands: data.brands,
      processes: data.processes,
    });

    dailyResults.push(dailyResult);
  }

  // 4. Aggregate assignments and conflicts
  const allAssignments = dailyResults.flatMap((day) => day.assignments);

  const allConflicts = dailyResults.flatMap((day) =>
    day.conflicts.map((conflict) => ({
      ...conflict,
      date: day.date,
    })),
  );

  // 5. Create a summary for each day
  const dailySummary = dailyResults.map((day) => ({
    date: day.date,
    dayName: day.dayName,
    assignmentCount: day.assignments.length,
    conflictCount: day.conflicts.length,
    availableEmployeeCount: day.availableEmployeeCount,
    unavailableEmployeeCount: day.unavailableEmployeeCount,
  }));

  // Return monthly generation result
  return {
    month,
    year,
    totalDays: dates.length,
    totalAssignments: allAssignments.length,
    totalConflicts: allConflicts.length,
    dailySummary,
    assignments: allAssignments,
    conflicts: allConflicts,
  };
};

module.exports = {
  getRosterGenerationData,
  generateMonthlyRoster,
};
