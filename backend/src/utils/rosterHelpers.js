const dayNames = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

// Generate all dates for the selected month
const getMonthDates = (month, year) => {
  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(year) ||
    year < 1
  ) {
    throw new Error("Please provide a valid month and year.");
  }

  const dates = [];
  const totalDays = new Date(Date.UTC(year, month, 0)).getUTCDate();

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(Date.UTC(year, month - 1, day));

    dates.push({
      date,
      dayName: dayNames[date.getUTCDay()],
    });
  }

  return dates;
};

const getDateTimestamp = (date) => {
  const parsedDate = new Date(date);

  return Date.UTC(
    parsedDate.getUTCFullYear(),
    parsedDate.getUTCMonth(),
    parsedDate.getUTCDate(),
  );
};

const isDateWithinRange = (date, startDate, endDate) => {
  const current = getDateTimestamp(date);
  const start = getDateTimestamp(startDate);
  const end = getDateTimestamp(endDate);

  return current >= start && current <= end;
};

// Identify employees available according to their work patterns
const getEmployeesAvailableForDate = ({
  dateInfo,
  employees,
  workPatterns,
  availabilityRecords,
}) => {
  const { date, dayName } = dateInfo;

  const availableEmployees = [];
  const unavailableEmployees = [];

  for (const employee of employees) {
    const employeeId = employee._id.toString();

    // Find employee's active work pattern
    const workPattern = workPatterns.find(
      (pattern) =>
        pattern.employeeId.toString() === employeeId &&
        pattern.status === "ACTIVE" &&
        new Date(pattern.effectiveFrom) <= date &&
        (!pattern.effectiveTo || new Date(pattern.effectiveTo) >= date),
    );

    // Employee without an applicable work pattern
    if (!workPattern) {
      unavailableEmployees.push({
        employee,
        reason: "NO_ACTIVE_WORK_PATTERN",
      });

      continue;
    }

    // Check weekly off
    if (workPattern.weeklyOffDays.includes(dayName)) {
      unavailableEmployees.push({
        employee,
        reason: "WEEKLY_OFF",
      });

      continue;
    }

    // Check working days
    if (!workPattern.workingDays.includes(dayName)) {
      unavailableEmployees.push({
        employee,
        reason: "NON_WORKING_DAY",
      });

      continue;
    }

    // Check approved leave or unavailability
    const approvedAvailability = availabilityRecords.find(
      (record) =>
        record.employeeId.toString() === employeeId &&
        record.status === "APPROVED" &&
        isDateWithinRange(date, record.startDate, record.endDate),
    );

    if (approvedAvailability) {
      unavailableEmployees.push({
        employee,
        reason: "APPROVED_UNAVAILABILITY",
      });

      continue;
    }

    availableEmployees.push(employee);
  }

  return {
    availableEmployees,
    unavailableEmployees,
  };
};

const getEligibleEmployeesForBrandProcess = ({
  dateInfo,
  workingRule,
  allocations,
  employees,
  availableEmployees,
  unavailableEmployees,
}) => {
  // 1. Check whether an active working rule exists
  if (!workingRule || workingRule.status !== "ACTIVE") {
    return {
      isOperational: false,
      reason: "NO_ACTIVE_WORKING_RULE",
      requiredEmployees: null,
      eligibleEmployees: [],
      unavailableAllocatedEmployees: [],
    };
  }

  const { dayName } = dateInfo;

  // 2. Check whether the brand-process operates on this day
  if (!workingRule.operatingDays.includes(dayName)) {
    return {
      isOperational: false,
      reason: "NON_OPERATING_DAY",
      requiredEmployees: null,
      eligibleEmployees: [],
      unavailableAllocatedEmployees: [],
    };
  }

  // 3. Get minimum staffing requirement for this day
  const staffingRule = workingRule.minimumStaffing.find(
    (item) => item.day === dayName,
  );

  // 4. Find employees allocated to this Brand + Process
  const matchingAllocations = allocations.filter(
    (allocation) =>
      allocation.brandId.toString() === workingRule.brandId.toString() &&
      allocation.processId.toString() === workingRule.processId.toString() &&
      allocation.isActive,
  );

  const employeeMap = new Map(
    employees.map((employee) => [employee._id.toString(), employee]),
  );

  const availableEmployeeIds = new Set(
    availableEmployees.map((employee) => employee._id.toString()),
  );

  const unavailableReasonMap = new Map(
    unavailableEmployees.map((item) => [
      item.employee._id.toString(),
      item.reason,
    ]),
  );

  const eligibleEmployees = [];
  const unavailableAllocatedEmployees = [];

  // 5. Check allocation and availability
  for (const allocation of matchingAllocations) {
    const employeeId = allocation.employeeId.toString();
    const employee = employeeMap.get(employeeId);

    if (!employee) {
      unavailableAllocatedEmployees.push({
        employeeId,
        employeeCode: null,
        reason: "EMPLOYEE_NOT_ACTIVE_OR_NOT_FOUND",
      });

      continue;
    }

    if (!availableEmployeeIds.has(employeeId)) {
      unavailableAllocatedEmployees.push({
        employeeId,
        employeeCode: employee.employeeCode,
        reason: unavailableReasonMap.get(employeeId) || "NOT_AVAILABLE_ON_DATE",
      });

      continue;
    }

    eligibleEmployees.push(employee);
  }

  return {
    isOperational: true,
    reason: null,
    requiredEmployees: staffingRule ? staffingRule.requiredEmployees : null,
    eligibleEmployees,
    unavailableAllocatedEmployees,
  };
};

// daily assignment function

const generateDailyAssignments = ({
  dateInfo,
  employees,
  allocations,
  workPatterns,
  availabilityRecords,
  workingRules,
  publicHolidays,
  brands = [],
  processes = [],
}) => {
  const { availableEmployees, unavailableEmployees } =
    getEmployeesAvailableForDate({
      dateInfo,
      employees,
      workPatterns,
      availabilityRecords,
    });

  const assignments = [];
  const conflicts = [];
  const employeeAssignmentCount = new Map();

  // Create lookup maps for readable names.
  const brandMap = new Map(
    brands.map((brand) => [brand._id.toString(), brand.name]),
  );

  const processMap = new Map(
    processes.map((process) => [process._id.toString(), process.name]),
  );

  const employeeMap = new Map(
    employees.map((employee) => [employee._id.toString(), employee]),
  );

  const isPublicHoliday = publicHolidays.some((holiday) =>
    isDateWithinRange(dateInfo.date, holiday.date, holiday.date),
  );

  const rulesWithEligibility = workingRules.map((workingRule) => {
    const eligibility = getEligibleEmployeesForBrandProcess({
      dateInfo,
      workingRule,
      allocations,
      employees,
      availableEmployees,
      unavailableEmployees,
    });

    return { workingRule, eligibility };
  });

  rulesWithEligibility.sort(
    (a, b) =>
      a.eligibility.eligibleEmployees.length -
      b.eligibility.eligibleEmployees.length,
  );

  for (const { workingRule, eligibility } of rulesWithEligibility) {
    const brandId = workingRule.brandId;
    const processId = workingRule.processId;

    const brandKey = brandId.toString();
    const processKey = processId.toString();

    const brandName = brandMap.get(brandKey) || "Unknown Brand";
    const processName = processMap.get(processKey) || "Unknown Process";

    // Find employees allocated to this Brand + Process.
    const matchingAllocations = allocations.filter(
      (allocation) =>
        allocation.brandId.toString() === brandKey &&
        allocation.processId.toString() === processKey &&
        allocation.isActive,
    );

    const allocatedEmployeeCodes = [
      ...new Set(
        matchingAllocations
          .map((allocation) => {
            const employee = employeeMap.get(allocation.employeeId.toString());
            return employee?.employeeCode;
          })
          .filter(Boolean),
      ),
    ];

    const eligibleEmployeeCodes = eligibility.eligibleEmployees.map(
      (employee) => employee.employeeCode,
    );

    const conflictDetails = {
      brandId,
      brandName,
      processId,
      processName,
      allocatedEmployeeCodes,
      eligibleEmployeeCodes,
    };

    // Public holiday validation.
    if (isPublicHoliday && !workingRule.operatesOnPublicHolidays) {
      conflicts.push({
        ...conflictDetails,
        type: "PUBLIC_HOLIDAY",
        message: `${brandName} - ${processName} does not operate on public holidays.`,
      });
      continue;
    }

    // Skip non-operating days.
    if (!eligibility.isOperational) {
      continue;
    }

    const requiredEmployees = eligibility.requiredEmployees;

    // Missing staffing configuration.
    if (requiredEmployees === null || requiredEmployees === undefined) {
      conflicts.push({
        ...conflictDetails,
        type: "MISSING_STAFFING_RULE",
        message: `Minimum staffing is not configured for ${brandName} - ${processName} on ${dateInfo.dayName}.`,
      });
      continue;
    }

    const uniqueEmployees = [
      ...new Map(
        eligibility.eligibleEmployees.map((employee) => [
          employee._id.toString(),
          employee,
        ]),
      ).values(),
    ];

    // Prefer employees with fewer assignments.
    uniqueEmployees.sort((a, b) => {
      const countA = employeeAssignmentCount.get(a._id.toString()) || 0;

      const countB = employeeAssignmentCount.get(b._id.toString()) || 0;

      return countA - countB || a.employeeCode.localeCompare(b.employeeCode);
    });

    const selectedEmployees = uniqueEmployees.slice(0, requiredEmployees);

    // Create assignments.
    for (const employee of selectedEmployees) {
      assignments.push({
        employeeId: employee._id,
        brandId,
        processId,
        date: dateInfo.date,
        status: "SCHEDULED",
        source: "AUTO",
      });

      const employeeId = employee._id.toString();

      employeeAssignmentCount.set(
        employeeId,
        (employeeAssignmentCount.get(employeeId) || 0) + 1,
      );
    }

    // Insufficient staffing validation.
    if (selectedEmployees.length < requiredEmployees) {
      const unavailableEmployeeDetails =
        eligibility.unavailableAllocatedEmployees.map((item) => ({
          employeeCode: item.employeeCode,
          reason: item.reason,
        }));

      conflicts.push({
        ...conflictDetails,
        type: "INSUFFICIENT_STAFFING",
        requiredEmployees,
        availableEmployees: uniqueEmployees.length,
        shortage: requiredEmployees - uniqueEmployees.length,
        unavailableEmployeeDetails,
        message: `${brandName} - ${processName}: Required ${requiredEmployees} employees, but only ${uniqueEmployees.length} are available.`,
      });
    }
  }

  return {
    date: dateInfo.date,
    dayName: dateInfo.dayName,
    assignments,
    conflicts,
    availableEmployeeCount: availableEmployees.length,
    unavailableEmployeeCount: unavailableEmployees.length,
  };
};

module.exports = {
  getMonthDates,
  getMonthDates,
  getEmployeesAvailableForDate,
  getEligibleEmployeesForBrandProcess,
  generateDailyAssignments,
};
