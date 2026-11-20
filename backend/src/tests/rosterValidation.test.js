require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const mongoose = require("mongoose");
const assert = require("assert");

const Employee = require("../models/employee");
const Allocation = require("../models/allocation");
const EmployeeWorkPattern = require("../models/employeeWorkPattern");
const Availability = require("../models/availability");
const WorkingRule = require("../models/workingRule");
const PublicHoliday = require("../models/publicHoliday");
const RosterEntry = require("../models/rosterEntry");
const Roster = require("../models/roster");
const Brand = require("../models/brand");
const Process = require("../models/process");

const { validateRoster } = require("../services/rosterValidation.service");

// --------------------------------------------------
// TEST CONFIGURATION
// --------------------------------------------------

const TEST_DATE = new Date("2026-11-23T00:00:00.000Z");
const DAY = "MONDAY";

let roster;
let counter = 0;
let failures = 0;

const createdRecords = new Map();

// Track records so only temporary test data is deleted.
const track = (Model, document) => {
  if (!createdRecords.has(Model)) {
    createdRecords.set(Model, []);
  }

  createdRecords.get(Model).push(document._id);

  return document;
};

// --------------------------------------------------
// DATABASE SAFETY
// --------------------------------------------------

const validateTestDatabase = () => {
  const uri = process.env.TEST_DATABASE_URL;

  if (!uri) {
    throw new Error("TEST_DATABASE_URL is missing from your .env file.");
  }

  if (uri === process.env.DATABASE_URL) {
    throw new Error("Test database URL cannot be the same as DATABASE_URL.");
  }

  const databaseName = decodeURIComponent(
    new URL(uri).pathname.replace(/^\/+/, ""),
  );

  if (!/(?:_test|-test|test)$/i.test(databaseName)) {
    throw new Error(
      `Unsafe database name: ${databaseName}. ` +
        "Use a dedicated database ending in _test.",
    );
  }

  return uri;
};

// --------------------------------------------------
// TEST DATA HELPERS
// --------------------------------------------------

const createEmployee = async ({
  mandatoryWeeklyOffDays = [],
  preferredWeeklyOffDays = [],
  workingDays = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ],
} = {}) => {
  counter++;

  const employee = track(
    Employee,
    await Employee.create({
      firstName: "Test",
      lastName: `Employee${counter}`,
      email: `validation.test.${counter}@example.com`,
      employeeCode: `VAL${counter}`,
      status: "ACTIVE",
    }),
  );

  track(
    EmployeeWorkPattern,
    await EmployeeWorkPattern.create({
      employeeId: employee._id,
      mandatoryWeeklyOffDays,
      preferredWeeklyOffDays,
      weeklyOffDays: mandatoryWeeklyOffDays,
      workingDays,
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      effectiveTo: null,
      status: "ACTIVE",
    }),
  );

  return employee;
};

const createWorkingRule = async ({
  operatingDays = [DAY],
  minimumStaffing = [
    {
      day: DAY,
      requiredEmployees: 0,
    },
  ],
  operatesOnPublicHolidays = false,
} = {}) => {
  counter++;

  const brand = track(
    Brand,
    await Brand.create({
      name: `Validation Test Brand ${counter}`,
      status: "ACTIVE",
    }),
  );

  const process = track(
    Process,
    await Process.create({
      name: `Validation Test Process ${counter}`,
      status: "ACTIVE",
    }),
  );

  const rule = track(
    WorkingRule,
    await WorkingRule.create({
      brandId: brand._id,
      processId: process._id,
      operatingDays,
      minimumStaffing,
      operatesOnPublicHolidays,
      status: "ACTIVE",
    }),
  );

  return { brand, process, rule };
};

const createAllocation = async (employee, rule) => {
  track(
    Allocation,
    await Allocation.create({
      employeeId: employee._id,
      brandId: rule.brand._id,
      processId: rule.process._id,
      isActive: true,
    }),
  );
};

const createEntry = async (
  employee,
  rule,
  shiftStart = "09:00",
  shiftEnd = "17:00",
) => {
  return track(
    RosterEntry,
    await RosterEntry.create({
      rosterId: roster._id,
      employeeId: employee._id,
      brandId: rule.brand._id,
      processId: rule.process._id,
      date: TEST_DATE,
      shiftStart,
      shiftEnd,
      status: "SCHEDULED",
      source: "AUTO",
    }),
  );
};

const getEmployeeConflicts = (result, employeeId) => {
  return result.conflicts.filter(
    (conflict) => conflict.employeeId?.toString() === employeeId.toString(),
  );
};

const getConflict = (result, type, employeeId = null) => {
  return result.conflicts.find((conflict) => {
    if (conflict.type !== type) {
      return false;
    }

    if (employeeId) {
      return conflict.employeeId?.toString() === employeeId.toString();
    }

    return true;
  });
};

// --------------------------------------------------
// TEST RUNNER
// --------------------------------------------------

const runTest = async (name, callback) => {
  try {
    await callback();

    console.log(`PASSED: ${name}`);
  } catch (error) {
    failures++;

    console.error(`FAILED: ${name}`);
    console.error(error.message);
  }
};

// --------------------------------------------------
// MAIN TEST
// --------------------------------------------------

const runTests = async () => {
  const testDatabaseUrl = validateTestDatabase();

  await mongoose.connect(testDatabaseUrl);

  console.log(`Connected to test database: ${mongoose.connection.name}`);

  roster = track(
    Roster,
    await Roster.create({
      name: "Roster Validation Test",
      periodStart: TEST_DATE,
      periodEnd: new Date("2026-11-23T23:59:59.999Z"),
      status: "DRAFT",
    }),
  );

  console.log(`Temporary roster created: ${roster._id}`);

  // ------------------------------------------------
  // TEST 1: Mandatory weekly off
  // ------------------------------------------------

  await runTest("Mandatory weekly-off conflict", async () => {
    const employee = await createEmployee({
      mandatoryWeeklyOffDays: [DAY],
      workingDays: ["TUESDAY", "WEDNESDAY"],
    });

    const rule = await createWorkingRule();

    await createAllocation(employee, rule);
    await createEntry(employee, rule);

    const result = await validateRoster(roster._id);

    const conflict = getConflict(result, "WEEKLY_OFF", employee._id);

    assert.ok(conflict, "WEEKLY_OFF conflict was not detected.");
    assert.strictEqual(conflict.severity, "HIGH");
  });

  // ------------------------------------------------
  // TEST 2: Preferred weekly-off override
  // ------------------------------------------------

  await runTest("Preferred weekly-off override", async () => {
    const employee = await createEmployee({
      preferredWeeklyOffDays: [DAY],
      workingDays: ["TUESDAY", "WEDNESDAY"],
    });

    const rule = await createWorkingRule({
      minimumStaffing: [
        {
          day: DAY,
          requiredEmployees: 1,
        },
      ],
    });

    await createAllocation(employee, rule);
    await createEntry(employee, rule);

    const result = await validateRoster(roster._id);

    const conflict = getConflict(result, "PREFERENCE_OVERRIDDEN", employee._id);

    assert.ok(conflict, "PREFERENCE_OVERRIDDEN warning was not detected.");

    assert.strictEqual(conflict.severity, "LOW");
  });

  // ------------------------------------------------
  // TEST 3: Approved leave
  // ------------------------------------------------

  await runTest("Approved leave conflict", async () => {
    const employee = await createEmployee();
    const rule = await createWorkingRule();

    await createAllocation(employee, rule);
    await createEntry(employee, rule);

    track(
      Availability,
      await Availability.create({
        employeeId: employee._id,
        type: "LEAVE",
        startDate: TEST_DATE,
        endDate: TEST_DATE,
        status: "APPROVED",
      }),
    );

    const result = await validateRoster(roster._id);

    const conflict = getConflict(result, "EMPLOYEE_UNAVAILABLE", employee._id);

    assert.ok(conflict, "Approved leave conflict was not detected.");
    assert.ok(conflict.message.includes("LEAVE"));
  });

  // ------------------------------------------------
  // TEST 4: Overlapping assignments
  // ------------------------------------------------

  await runTest("Overlapping assignments", async () => {
    const employee = await createEmployee();

    const rule1 = await createWorkingRule();
    const rule2 = await createWorkingRule();

    await createAllocation(employee, rule1);
    await createAllocation(employee, rule2);

    await createEntry(employee, rule1, "09:00", "13:00");
    await createEntry(employee, rule2, "12:00", "16:00");

    const result = await validateRoster(roster._id);

    const conflicts = getEmployeeConflicts(result, employee._id).filter(
      (conflict) => conflict.type === "OVERLAPPING_ASSIGNMENT",
    );

    assert.strictEqual(
      conflicts.length,
      2,
      "Expected two overlapping-assignment conflicts.",
    );
  });

  // ------------------------------------------------
  // TEST 5: Employee without allocation
  // ------------------------------------------------

  await runTest("Missing employee allocation", async () => {
    const employee = await createEmployee();
    const rule = await createWorkingRule();

    // Deliberately do not create an allocation.
    await createEntry(employee, rule);

    const result = await validateRoster(roster._id);

    const conflict = getConflict(
      result,
      "WORKING_RULE_VIOLATION",
      employee._id,
    );

    assert.ok(conflict, "Missing allocation was not detected.");

    assert.ok(conflict.message.includes("not allocated"));
  });

  // ------------------------------------------------
  // TEST 6: Non-operating day
  // ------------------------------------------------

  await runTest("Non-operating day violation", async () => {
    const employee = await createEmployee();

    const rule = await createWorkingRule({
      operatingDays: ["TUESDAY"],
      minimumStaffing: [
        {
          day: "TUESDAY",
          requiredEmployees: 0,
        },
      ],
    });

    await createAllocation(employee, rule);
    await createEntry(employee, rule);

    const result = await validateRoster(roster._id);

    const conflict = getEmployeeConflicts(result, employee._id).find(
      (item) =>
        item.type === "WORKING_RULE_VIOLATION" &&
        item.message.includes("not an operating day"),
    );

    assert.ok(conflict, "Non-operating day violation was not detected.");
  });

  // ------------------------------------------------
  // TEST 7: Public holiday
  // ------------------------------------------------

  //   await runTest("Public holiday conflict", async () => {
  //     const employee = await createEmployee();

  //     const rule = await createWorkingRule({
  //       operatesOnPublicHolidays: false,
  //     });

  //     await createAllocation(employee, rule);
  //     await createEntry(employee, rule);

  //     track(
  //       PublicHoliday,
  //       await PublicHoliday.create({
  //         name: "Validation Test Holiday",
  //         date: TEST_DATE,
  //       }),
  //     );

  //     const result = await validateRoster(roster._id);

  //     const conflict = getConflict(result, "PUBLIC_HOLIDAY", employee._id);

  //     assert.ok(conflict, "Public holiday conflict was not detected.");
  //     assert.strictEqual(conflict.severity, "HIGH");
  //   });

  await runTest("Public holiday conflict", async () => {
    const employee = await createEmployee();
    const rule = await createWorkingRule({
      operatesOnPublicHolidays: false,
    });

    await createAllocation(employee, rule);
    await createEntry(employee, rule);

    const holiday = track(
      PublicHoliday,
      await PublicHoliday.create({
        name: "Validation Test Holiday",
        date: TEST_DATE,
      }),
    );

    try {
      const result = await validateRoster(roster._id);

      const conflict = getConflict(result, "PUBLIC_HOLIDAY", employee._id);

      assert.ok(conflict, "Public holiday conflict was not detected.");

      assert.strictEqual(conflict.severity, "HIGH");
    } finally {
      // Remove the holiday immediately so it cannot
      // affect the remaining validation scenarios.
      await PublicHoliday.deleteOne({
        _id: holiday._id,
      });

      createdRecords.set(
        PublicHoliday,
        (createdRecords.get(PublicHoliday) || []).filter(
          (id) => id.toString() !== holiday._id.toString(),
        ),
      );
    }
  });

  // ------------------------------------------------
  // TEST 8: Missing minimum staffing rule
  // ------------------------------------------------

  await runTest("Missing minimum staffing configuration", async () => {
    const employee = await createEmployee();

    const rule = await createWorkingRule({
      operatingDays: [DAY],
      minimumStaffing: [],
    });

    await createAllocation(employee, rule);
    await createEntry(employee, rule);

    const result = await validateRoster(roster._id);

    const conflict = result.conflicts.find(
      (item) =>
        item.type === "MISSING_STAFFING_RULE" &&
        item.brandId?.toString() === rule.brand._id.toString() &&
        item.employeeId === null,
    );

    assert.ok(conflict, "Missing minimum staffing rule was not detected.");
  });

  // ------------------------------------------------
  // TEST 9: Insufficient staffing
  // ------------------------------------------------

  await runTest("Insufficient staffing", async () => {
    const employee = await createEmployee();

    const rule = await createWorkingRule({
      minimumStaffing: [
        {
          day: DAY,
          requiredEmployees: 2,
        },
      ],
    });

    await createAllocation(employee, rule);
    await createEntry(employee, rule);

    const result = await validateRoster(roster._id);

    const conflict = result.conflicts.find(
      (item) =>
        item.type === "INSUFFICIENT_STAFFING" &&
        item.brandId?.toString() === rule.brand._id.toString() &&
        item.processId?.toString() === rule.process._id.toString(),
    );

    assert.ok(conflict, "Insufficient staffing was not detected.");

    assert.strictEqual(conflict.requiredEmployees, 2);
    assert.strictEqual(conflict.availableEmployees, 1);
    assert.strictEqual(conflict.shortage, 1);
    assert.strictEqual(conflict.severity, "HIGH");
  });

  // ------------------------------------------------
  // TEST 10: Invalid assignments excluded from staffing
  // ------------------------------------------------

  await runTest(
    "Invalid assignments excluded from staffing count",
    async () => {
      const employee = await createEmployee({
        mandatoryWeeklyOffDays: [DAY],
        workingDays: ["TUESDAY", "WEDNESDAY"],
      });

      const rule = await createWorkingRule({
        minimumStaffing: [
          {
            day: DAY,
            requiredEmployees: 1,
          },
        ],
      });

      await createAllocation(employee, rule);
      await createEntry(employee, rule);

      const result = await validateRoster(roster._id);

      const conflict = result.conflicts.find(
        (item) =>
          item.type === "INSUFFICIENT_STAFFING" &&
          item.brandId?.toString() === rule.brand._id.toString() &&
          item.processId?.toString() === rule.process._id.toString(),
      );

      assert.ok(
        conflict,
        "Invalid assignment was incorrectly counted toward staffing.",
      );

      assert.strictEqual(conflict.availableEmployees, 0);
      assert.strictEqual(conflict.shortage, 1);
    },
  );

  // ------------------------------------------------
  // TEST 11: Valid assignment
  // ------------------------------------------------

  await runTest("Valid assignment has no individual conflict", async () => {
    const employee = await createEmployee();
    const rule = await createWorkingRule();

    await createAllocation(employee, rule);
    const entry = await createEntry(employee, rule);

    const result = await validateRoster(roster._id);

    const entryConflicts = result.conflicts.filter(
      (conflict) => conflict.entryId?.toString() === entry._id.toString(),
    );

    assert.strictEqual(
      entryConflicts.length,
      0,
      "A valid assignment unexpectedly has an individual conflict.",
    );
  });
};

// --------------------------------------------------
// CLEANUP
// --------------------------------------------------

const cleanup = async () => {
  console.log("\nCleaning up temporary test data...");

  for (const [Model, ids] of createdRecords.entries()) {
    await Model.deleteMany({
      _id: { $in: ids },
    });
  }

  console.log("Temporary test data cleaned up.");
};

// --------------------------------------------------
// EXECUTION
// --------------------------------------------------

const main = async () => {
  try {
    await runTests();
  } catch (error) {
    failures++;

    console.error("\nTEST EXECUTION FAILED:");
    console.error(error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      try {
        await cleanup();
      } catch (cleanupError) {
        failures++;
        console.error("Cleanup failed:", cleanupError);
      }

      await mongoose.disconnect();
      console.log("MongoDB disconnected.");
    }
  }

  console.log("\n--------------------------------");
  console.log(`Total test cases: 11`);
  console.log(`Passed: ${11 - failures}`);
  console.log(`Failed: ${failures}`);
  console.log("--------------------------------");

  if (failures > 0) {
    process.exitCode = 1;
  } else {
    console.log("\nALL VALIDATION TESTS PASSED.");
  }
};

main();
