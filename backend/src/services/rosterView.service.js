const Roster = require("../models/roster");
const RosterEntry = require("../models/rosterEntry");
const Employee = require("../models/employee");
const Pod = require("../models/pod");
const Brand = require("../models/brand");
const Process = require("../models/process");
const WorkingRule = require("../models/workingRule");
const EmployeeWorkPattern = require("../models/employeeWorkPattern");
const Availability = require("../models/availability");
const PublicHoliday = require("../models/publicHoliday");

// --------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------

const getDayName = (date) => {
  return date
    .toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC",
    })
    .toUpperCase();
};

const getDateKey = (date) => {
  return new Date(date).toISOString().slice(0, 10);
};

const getRosterDates = (roster) => {
  const dates = [];

  const currentDate = new Date(roster.periodStart);
  const endDate = new Date(roster.periodEnd);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));

    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return dates;
};

const getRoster = async (rosterId) => {
  const roster = await Roster.findById(rosterId).lean();

  if (!roster) {
    throw new Error("Roster not found.");
  }

  return roster;
};

// --------------------------------------------------
// 1. POD-WISE ROSTER
// --------------------------------------------------

const getPodRoster = async (rosterId, podId, page = 1, limit = 5) => {
  const roster = await getRoster(rosterId);

  const pod = await Pod.findById(podId)
    .populate("leadEmployeeId", "firstName lastName employeeCode")
    .lean();

  if (!pod) {
    throw new Error("Pod not found.");
  }

  // Find active employees belonging to this Pod
  const employees = await Employee.find({
    podId,
    status: "ACTIVE",
  })
    .select("_id")
    .lean();

  const employeeIds = employees.map((employee) => employee._id);

  // Count all assignments belonging to this Pod
  const assignmentQuery = {
    rosterId,
    employeeId: { $in: employeeIds },
  };

  const totalRecords = await RosterEntry.countDocuments(assignmentQuery);

  const totalPages = Math.ceil(totalRecords / limit);
  const skip = (page - 1) * limit;

  // Fetch only assignments for the requested page
  const assignments = await RosterEntry.find(assignmentQuery)
    .populate("employeeId", "firstName lastName employeeCode")
    .populate("brandId", "name")
    .populate("processId", "name")
    .sort({ date: 1, _id: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    rosterId: roster._id,
    periodStart: roster.periodStart,
    periodEnd: roster.periodEnd,
    pod,
    totalEmployees: employees.length,
    totalAssignments: totalRecords,
    assignments,
    pagination: {
      currentPage: page,
      limit,
      totalRecords,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

// --------------------------------------------------
// 2. BRAND-WISE ROSTER
// --------------------------------------------------

const getBrandRoster = async (rosterId, brandId, page = 1, limit = 5) => {
  const roster = await getRoster(rosterId);

  const brand = await Brand.findById(brandId).lean();

  if (!brand) {
    throw new Error("Brand not found.");
  }

  const assignmentQuery = {
    rosterId: roster._id,
    brandId: brand._id,
  };

  // Total assignment count
  const totalRecords = await RosterEntry.countDocuments(assignmentQuery);

  const totalPages = Math.ceil(totalRecords / limit);
  const skip = (page - 1) * limit;

  // Fetch only assignments for the current page
  const assignments = await RosterEntry.find(assignmentQuery)
    .populate("employeeId", "firstName lastName employeeCode podId")
    .populate("processId", "name")
    .sort({ date: 1, _id: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Fetch working rules for the brand
  const workingRules = await WorkingRule.find({
    brandId: brand._id,
    status: "ACTIVE",
  })
    .populate("processId", "name")
    .lean();

  const rosterDates = getRosterDates(roster);

  /*
   * Aggregate all assignments for daily coverage.
   * We do not fetch all assignment documents into memory.
   * MongoDB calculates assignment counts and unique employees.
   */
  const coverageAggregation = await RosterEntry.aggregate([
    {
      $match: assignmentQuery,
    },
    {
      $group: {
        _id: {
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
            },
          },
          processId: "$processId",
        },
        totalAssignments: {
          $sum: 1,
        },
        employeeIds: {
          $addToSet: "$employeeId",
        },
      },
    },
    {
      $project: {
        date: "$_id.date",
        processId: "$_id.processId",
        totalAssignments: 1,
        scheduledEmployees: {
          $size: "$employeeIds",
        },
      },
    },
  ]);

  // Map aggregated coverage data
  const coverageMap = new Map();

  coverageAggregation.forEach((item) => {
    const key = `${item.date}_${String(item.processId)}`;

    coverageMap.set(key, {
      totalAssignments: item.totalAssignments,
      scheduledEmployees: item.scheduledEmployees,
    });
  });

  // Build daily coverage
  const dailyCoverage = rosterDates.map((date) => {
    const dateKey = getDateKey(date);
    const dayName = getDayName(date);

    const processes = workingRules.map((rule) => {
      const processId = String(rule.processId._id);

      const coverageKey = `${dateKey}_${processId}`;

      const coverageData = coverageMap.get(coverageKey) || {
        totalAssignments: 0,
        scheduledEmployees: 0,
      };

      const staffingRule = rule.minimumStaffing.find(
        (staffing) => staffing.day === dayName,
      );

      const requiredEmployees = staffingRule
        ? staffingRule.requiredEmployees
        : 0;

      const scheduledEmployees = coverageData.scheduledEmployees;

      const shortage = Math.max(0, requiredEmployees - scheduledEmployees);

      const operatingDay = rule.operatingDays.includes(dayName);

      return {
        processId: rule.processId._id,
        processName: rule.processId.name,

        operatingDay,

        requiredEmployees,
        scheduledEmployees,
        totalAssignments: coverageData.totalAssignments,
        shortage,

        coverageStatus: !operatingDay
          ? "NON_OPERATING_DAY"
          : shortage > 0
            ? "UNDERSTAFFED"
            : "COVERED",
      };
    });

    const totalDailyAssignments = processes.reduce(
      (total, process) => total + process.totalAssignments,
      0,
    );

    return {
      date: dateKey,
      day: dayName,
      totalAssignments: totalDailyAssignments,
      processes,
    };
  });

  return {
    rosterId: roster._id,

    brand,

    periodStart: roster.periodStart,
    periodEnd: roster.periodEnd,

    totalAssignments: totalRecords,

    assignments,

    dailyCoverage,

    pagination: {
      currentPage: page,
      limit,
      totalRecords,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

// --------------------------------------------------
// 3. PROCESS-WISE ROSTER
// --------------------------------------------------

const getProcessRoster = async (rosterId, processId, page = 1, limit = 5) => {
  const roster = await getRoster(rosterId);

  const process = await Process.findById(processId).lean();

  if (!process) {
    throw new Error("Process not found.");
  }

  const assignmentQuery = {
    rosterId: roster._id,
    processId: process._id,
  };

  // Total assignments for this process
  const totalRecords = await RosterEntry.countDocuments(assignmentQuery);

  const totalPages = Math.ceil(totalRecords / limit);
  const skip = (page - 1) * limit;

  // Fetch assignments for the current page only
  const assignments = await RosterEntry.find(assignmentQuery)
    .populate("employeeId", "firstName lastName employeeCode podId")
    .populate("brandId", "name")
    .sort({ date: 1, _id: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Fetch active working rules for this process
  const workingRules = await WorkingRule.find({
    processId: process._id,
    status: "ACTIVE",
  })
    .populate("brandId", "name")
    .lean();

  const rosterDates = getRosterDates(roster);

  /*
   * Calculate daily staffing using MongoDB aggregation.
   * This avoids fetching every assignment into memory.
   */
  const staffingAggregation = await RosterEntry.aggregate([
    {
      $match: assignmentQuery,
    },
    {
      $group: {
        _id: {
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
            },
          },
          brandId: "$brandId",
        },
        totalAssignments: {
          $sum: 1,
        },
        employeeIds: {
          $addToSet: "$employeeId",
        },
      },
    },
    {
      $project: {
        date: "$_id.date",
        brandId: "$_id.brandId",
        totalAssignments: 1,
        scheduledEmployees: {
          $size: "$employeeIds",
        },
      },
    },
  ]);

  // Map staffing aggregation results
  const staffingMap = new Map();

  staffingAggregation.forEach((item) => {
    const key = `${item.date}_${String(item.brandId)}`;

    staffingMap.set(key, {
      totalAssignments: item.totalAssignments,
      scheduledEmployees: item.scheduledEmployees,
    });
  });

  // Build daily staffing for the entire roster period
  const dailyStaffing = rosterDates.map((date) => {
    const dateKey = getDateKey(date);
    const dayName = getDayName(date);

    const brands = workingRules.map((rule) => {
      const brandId = String(rule.brandId._id);

      const staffingKey = `${dateKey}_${brandId}`;

      const staffingData = staffingMap.get(staffingKey) || {
        totalAssignments: 0,
        scheduledEmployees: 0,
      };

      const staffingRule = rule.minimumStaffing.find(
        (staffing) => staffing.day === dayName,
      );

      const requiredEmployees = staffingRule
        ? staffingRule.requiredEmployees
        : 0;

      const scheduledEmployees = staffingData.scheduledEmployees;

      const shortage = Math.max(0, requiredEmployees - scheduledEmployees);

      const operatingDay = rule.operatingDays.includes(dayName);

      return {
        brandId: rule.brandId._id,
        brandName: rule.brandId.name,

        operatingDay,

        requiredEmployees,
        scheduledEmployees,
        totalAssignments: staffingData.totalAssignments,
        shortage,

        coverageStatus: !operatingDay
          ? "NON_OPERATING_DAY"
          : shortage > 0
            ? "UNDERSTAFFED"
            : "COVERED",
      };
    });

    const totalDailyAssignments = brands.reduce(
      (total, brand) => total + brand.totalAssignments,
      0,
    );

    return {
      date: dateKey,
      day: dayName,
      totalAssignments: totalDailyAssignments,
      brands,
    };
  });

  return {
    rosterId: roster._id,

    process,

    periodStart: roster.periodStart,
    periodEnd: roster.periodEnd,

    totalAssignments: totalRecords,

    assignments,

    dailyStaffing,

    pagination: {
      currentPage: page,
      limit,
      totalRecords,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

// --------------------------------------------------
// 4. EMPLOYEE-WISE ROSTER
// --------------------------------------------------

const getEmployeeRoster = async (rosterId, employeeId, page = 1, limit = 5) => {
  const roster = await getRoster(rosterId);

  const employee = await Employee.findById(employeeId)
    .populate("podId", "name")
    .lean();

  if (!employee) {
    throw new Error("Employee not found.");
  }

  const assignmentQuery = {
    rosterId: roster._id,
    employeeId: employee._id,
  };

  // Total assignments for this employee
  const totalRecords = await RosterEntry.countDocuments(assignmentQuery);

  const totalPages = Math.ceil(totalRecords / limit);
  const skip = (page - 1) * limit;

  // Fetch assignments for the current page only
  const assignments = await RosterEntry.find(assignmentQuery)
    .populate("brandId", "name")
    .populate("processId", "name")
    .sort({ date: 1, _id: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Fetch employee work pattern
  const workPattern = await EmployeeWorkPattern.findOne({
    employeeId: employee._id,
    status: "ACTIVE",
    effectiveFrom: { $lte: roster.periodEnd },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gte: roster.periodStart } }],
  }).lean();

  // Fetch approved availability
  const availability = await Availability.find({
    employeeId: employee._id,
    status: "APPROVED",
    startDate: { $lte: roster.periodEnd },
    endDate: { $gte: roster.periodStart },
  }).lean();

  // Fetch public holidays
  const publicHolidays = await PublicHoliday.find({
    date: {
      $gte: roster.periodStart,
      $lte: roster.periodEnd,
    },
  }).lean();

  /*
   * Aggregate assignment counts by date.
   * This avoids fetching all assignment documents
   * just to build the daily schedule.
   */
  const dailyAssignmentAggregation = await RosterEntry.aggregate([
    {
      $match: assignmentQuery,
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$date",
          },
        },
        totalAssignments: {
          $sum: 1,
        },
      },
    },
  ]);

  // Map daily assignment counts
  const dailyAssignmentMap = new Map();

  dailyAssignmentAggregation.forEach((item) => {
    dailyAssignmentMap.set(item._id, item.totalAssignments);
  });

  const rosterDates = getRosterDates(roster);

  const dailySchedule = rosterDates.map((date) => {
    const dateKey = getDateKey(date);
    const dayName = getDayName(date);

    const dailyAssignmentCount = dailyAssignmentMap.get(dateKey) || 0;

    const dailyAvailability = availability.filter(
      (item) =>
        date >= new Date(item.startDate) && date <= new Date(item.endDate),
    );

    const holiday = publicHolidays.find(
      (item) => getDateKey(item.date) === dateKey,
    );

    const mandatoryWeeklyOff =
      workPattern?.mandatoryWeeklyOffDays?.includes(dayName) || false;

    const preferredWeeklyOff =
      workPattern?.preferredWeeklyOffDays?.includes(dayName) || false;

    const isWorkingDay = workPattern?.workingDays?.includes(dayName) || false;

    return {
      date: dateKey,
      day: dayName,

      totalAssignments: dailyAssignmentCount,

      isWorkingDay,

      mandatoryWeeklyOff,
      preferredWeeklyOff,

      isPublicHoliday: Boolean(holiday),
      publicHoliday: holiday || null,

      approvedAvailability: dailyAvailability,

      dayStatus:
        dailyAssignmentCount > 0
          ? "SCHEDULED"
          : mandatoryWeeklyOff
            ? "MANDATORY_WEEKLY_OFF"
            : dailyAvailability.length > 0
              ? "APPROVED_LEAVE"
              : holiday
                ? "PUBLIC_HOLIDAY"
                : preferredWeeklyOff
                  ? "PREFERRED_WEEKLY_OFF"
                  : isWorkingDay
                    ? "UNASSIGNED"
                    : "NON_WORKING_DAY",
    };
  });

  return {
    rosterId: roster._id,

    employee,

    periodStart: roster.periodStart,
    periodEnd: roster.periodEnd,

    workPattern,

    totalAssignments: totalRecords,

    assignments,

    dailySchedule,

    pagination: {
      currentPage: page,
      limit,
      totalRecords,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

// --------------------------------------------------
// EXPORT SERVICES
// --------------------------------------------------

module.exports = {
  getPodRoster,
  getBrandRoster,
  getProcessRoster,
  getEmployeeRoster,
};
