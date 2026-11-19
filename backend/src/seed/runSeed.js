require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const mongoose = require("mongoose");
const connectDB = require("../config/db");

const Employee = require("../models/employee");
const Pod = require("../models/pod");
const Process = require("../models/process");
const Allocation = require("../models/allocation");
const Brand = require("../models/brand");
const EmployeeWorkPattern = require("../models/employeeWorkPattern");
const WorkingRule = require("../models/workingRule");

const employeeSeed = require("./data/employeeSeed");
const podSeed = require("./data/podSeed");
const processSeed = require("./data/processSeed");
const brandSeed = require("./data/brandSeed");
const allocationSeed = require("./data/allocationSeed");
const employeeWorkPatternSeed = require("./data/employeeWorkPatternSeed");

const runSeed = async () => {
  let session;
  try {
    // 1. Connect to MongoDB
    await connectDB();
    console.log("Database connected successfully.");

    // Confirm connection
    console.log("Connection state:", mongoose.connection.readyState);

    // 2. Create session after connecting
    session = await mongoose.startSession();

    // 3. Start transaction
    await session.withTransaction(async () => {
      // 2. Seed employees
      const employeeMap = {};

      for (const employeeData of employeeSeed) {
        const employee = await Employee.findOneAndUpdate(
          { employeeCode: employeeData.employeeCode },
          {
            $set: {
              ...employeeData,
              podId: null,
              status: "ACTIVE",
            },
          },
          {
            returnDocument: "after",
            upsert: true,
            runValidators: true,
          },
        );

        employeeMap[employee.employeeCode] = employee;
      }

      console.log(`${employeeSeed.length} employees seeded.`);

      // 3. Seed Pods and assign employees
      const podMap = {};

      for (const podData of podSeed) {
        const pod = await Pod.findOneAndUpdate(
          { name: podData.name },
          {
            $set: {
              name: podData.name,
              description: podData.description,
              status: "ACTIVE",
            },
          },
          {
            returnDocument: "after",
            upsert: true,
            runValidators: true,
          },
        );

        podMap[pod.name] = pod;

        for (const employeeCode of podData.employeeCodes) {
          const employee = employeeMap[employeeCode];

          if (!employee) {
            throw new Error(`Employee ${employeeCode} not found.`);
          }

          employee.podId = pod._id;
          await employee.save();
        }
      }

      // 4. Assign Pod Leads
      for (const podData of podSeed) {
        const pod = podMap[podData.name];
        const leadEmployee = employeeMap[podData.leadEmployeeCode];

        if (
          !leadEmployee ||
          !podData.employeeCodes.includes(podData.leadEmployeeCode)
        ) {
          throw new Error(`Invalid Pod Lead for ${podData.name}`);
        }

        pod.leadEmployeeId = leadEmployee._id;
        await pod.save();
      }

      console.log(`${podSeed.length} Pods seeded with leads.`);

      // 5. Seed Brands
      const brandMap = {};

      for (const brandData of brandSeed) {
        const brand = await Brand.findOneAndUpdate(
          { name: brandData.name },
          {
            $set: {
              ...brandData,
              status: "ACTIVE",
            },
          },
          {
            returnDocument: "after",
            upsert: true,
            runValidators: true,
          },
        );

        brandMap[brand.name] = brand;
      }

      console.log(`${brandSeed.length} Brands seeded.`);

      // 6. Seed Processes
      const processMap = {};

      for (const processData of processSeed) {
        const process = await Process.findOneAndUpdate(
          { name: processData.name },
          {
            $set: {
              ...processData,
              status: "ACTIVE",
            },
          },
          {
            returnDocument: "after",
            upsert: true,
            runValidators: true,
          },
        );

        processMap[process.name] = process;
      }

      console.log(`${processSeed.length} Processes seeded.`);

      // 7. Seed Allocations
      let allocationCount = 0;

      for (const allocationData of allocationSeed) {
        const employee = employeeMap[allocationData.employeeCode];
        const brand = brandMap[allocationData.brandName];

        if (!employee || !brand) {
          throw new Error(
            `Employee or Brand not found for ${allocationData.employeeCode}`,
          );
        }

        for (const processName of allocationData.processNames) {
          const process = processMap[processName];

          if (!process) {
            throw new Error(`Process ${processName} not found.`);
          }

          await Allocation.findOneAndUpdate(
            {
              employeeId: employee._id,
              brandId: brand._id,
              processId: process._id,
            },
            {
              $set: {
                isActive: true,
              },
            },
            {
              returnDocument: true,
              upsert: true,
              runValidators: true,
            },
          );

          allocationCount++;
        }
      }

      console.log(`${allocationCount} allocations seeded.`);

      // seed working rules

      // 8. Seed Working Rules

      const operatingDays = [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
      ];

      // Create unique Brand + Process combinations from allocations
      const workingRuleMap = new Map();

      for (const allocationData of allocationSeed) {
        const brand = brandMap[allocationData.brandName];

        if (!brand) {
          throw new Error(`Brand ${allocationData.brandName} not found.`);
        }

        for (const processName of allocationData.processNames) {
          const process = processMap[processName];

          if (!process) {
            throw new Error(`Process ${processName} not found.`);
          }

          const key = `${allocationData.brandName}_${processName}`;

          if (!workingRuleMap.has(key)) {
            workingRuleMap.set(key, {
              brandId: brand._id,
              processId: process._id,
              operatingDays,
              operatesOnPublicHolidays: false,
              minimumStaffing: operatingDays.map((day) => ({
                day,
                requiredEmployees: 1,
              })),
              status: "ACTIVE",
            });
          }
        }
      }

      // Upsert working rules
      for (const ruleData of workingRuleMap.values()) {
        await WorkingRule.findOneAndUpdate(
          {
            brandId: ruleData.brandId,
            processId: ruleData.processId,
          },
          {
            $set: ruleData,
          },
          {
            upsert: true,
            returnDocument: "after",
            runValidators: true,
            session,
          },
        );
      }

      console.log(`${workingRuleMap.size} working rules seeded.`);

      // 3. Seed Employee Work Patterns
      for (const patternData of employeeWorkPatternSeed) {
        const employee = employeeMap[patternData.employeeCode];

        if (!employee) {
          throw new Error(
            `Employee ${patternData.employeeCode} not found for work pattern.`,
          );
        }

        const { employeeCode, ...workPatternData } = patternData;

        await EmployeeWorkPattern.findOneAndUpdate(
          { employeeId: employee._id },
          {
            $set: workPatternData,
          },
          {
            upsert: true,
            returnDocument: "after",
            runValidators: true,
            session,
          },
        );
      }

      console.log(
        `${employeeWorkPatternSeed.length} employee work patterns seeded.`,
      );
    });

    console.log("Complete sample dataset seeded successfully.");
  } catch (error) {
    console.error("Seed Error:", error.message);
    process.exitCode = 1;
  } finally {
    await session.endSession();
    await mongoose.disconnect();
  }
};

runSeed();
