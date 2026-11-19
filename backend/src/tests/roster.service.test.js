require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const {
  getMonthDates,
  //   getEmployeesAvailableForDate,
  //   getEligibleEmployeesForBrandProcess,
  generateDailyAssignments,
} = require("../utils/rosterHelpers");

const connectDB = require("../config/db");
const { getRosterGenerationData } = require("../services/roster.service");

const testRosterData = async () => {
  try {
    await connectDB();

    const data = await getRosterGenerationData(11, 2026);

    // Generate dates for November 2026
    const dates = getMonthDates(11, 2026);

    // Test November 3, 2026
    const testDates = dates.find((item) => item.date.getUTCDate() === 3);

    const dailyResult = generateDailyAssignments({
      dateInfo: testDates,
      employees: data.employees,
      allocations: data.allocations,
      workPatterns: data.workingPatterns,
      availabilityRecords: data.availabilityRecords,
      workingRules: data.workingRules,
      publicHolidays: data.publicHolidays,
      brands: data.brands,
      processes: data.process,
    });

    console.log("\nDaily Roster Generation");
    console.log("Date:", dailyResult.date);
    console.log("Day:", dailyResult.dayName);
    console.log("Assignments:", dailyResult.assignments.length);

    console.log(
      "\n Conflict Details:",
      JSON.stringify(dailyResult.conflicts, null, 2),
    );

    console.log("\nAssignment Details:");
    console.log(
      dailyResult.assignments.map((item) => ({
        employeeId: item.employeeId,
        brandId: item.brandId,
        processId: item.processId,
      })),
    );

    console.log(dailyResult.conflicts);

    // // Test employee eligibility for November 1
    // const result = getEmployeesAvailableForDate({
    //   dateInfo: dates[0],
    //   employees: data.employees,
    //   workPatterns: data.workingPatterns,
    //   availabilityRecords: data.availabilityRecords,
    // });

    // console.log("\nEligibility for:", dates[0].date.toISOString());
    // console.log("Available Employees:", result.availableEmployees.length);
    // console.log("Unavailable Employees:", result.unavailableEmployees.length);

    // console.log(
    //   "Unavailable Details:",
    //   result.unavailableEmployees.map((item) => ({
    //     employeeCode: item.employee.employeeCode,
    //     reason: item.reason,
    //   })),
    // );

    // // Get the first allocation as our test combination
    // const sampleAllocation = data.allocations[0];

    // const sampleWorkingRule = data.workingRules.find(
    //   (rule) =>
    //     rule.brandId.toString() === sampleAllocation.brandId.toString() &&
    //     rule.processId.toString() === sampleAllocation.processId.toString(),
    // );

    // // Find the employee assigned to this allocation
    // const sampleEmployee = data.employees.find(
    //   (employee) =>
    //     employee._id.toString() === sampleAllocation.employeeId.toString(),
    // );

    // const employeePattern = data.workingPatterns.find(
    //   (pattern) =>
    //     pattern.employeeId.toString() === sampleEmployee._id.toString(),
    // );

    // // Find a date when employee can work and process operates
    // const testDate = dates.find(
    //   (dateInfo) =>
    //     employeePattern.workingDays.includes(dateInfo.dayName) &&
    //     sampleWorkingRule.operatingDays.includes(dateInfo.dayName),
    // );

    // // Calculate general employee availability for the selected date
    // const availabilityResult = getEmployeesAvailableForDate({
    //   dateInfo: testDate,
    //   employees: data.employees,
    //   workPatterns: data.workingPatterns,
    //   availabilityRecords: data.availabilityRecords,
    // });

    // // Calculate Brand + Process eligibility
    // const eligibilityResult = getEligibleEmployeesForBrandProcess({
    //   dateInfo: testDate,
    //   workingRule: sampleWorkingRule,
    //   allocations: data.allocations,
    //   employees: data.employees,
    //   availableEmployees: availabilityResult.availableEmployees,
    //   unavailableEmployees: availabilityResult.unavailableEmployees,
    // });

    // console.log("\nBrand + Process Eligibility");
    // console.log("Date:", testDate.date.toISOString());
    // console.log("Day:", testDate.dayName);
    // console.log("Brand ID:", sampleWorkingRule.brandId);
    // console.log("Process ID:", sampleWorkingRule.processId);
    // console.log("Operational:", eligibilityResult.isOperational);
    // console.log("Minimum Staffing:", eligibilityResult.requiredEmployees);

    // console.log(
    //   "Eligible Employees:",
    //   eligibilityResult.eligibleEmployees.map(
    //     (employee) => employee.employeeCode,
    //   ),
    // );

    // console.log(
    //   "Unavailable Allocated Employees:",
    //   eligibilityResult.unavailableAllocatedEmployees,
    // );

    // // Roster generation data summary
    // console.log("\nRoster generation data fetched successfully");
    // console.log("Active Employees:", data.employees.length);
    // console.log("Active Allocations:", data.allocations.length);
    // console.log("Active Working Rules:", data.workingRules.length);
    // console.log("Work Patterns:", data.workingPatterns.length);
    // console.log("Approved Availability:", data.availabilityRecords.length);
    // console.log("Public Holidays:", data.publicHolidays.length);

    // console.log(
    //   "Employee Work Patterns:",
    //   JSON.stringify(data.workingPatterns.slice(0, 3), null, 2),
    // );
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    const mongoose = require("mongoose");
    await mongoose.disconnect();
  }
};

testRosterData();
