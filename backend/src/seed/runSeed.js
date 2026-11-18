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

const employeeSeed = require("./data/employeeSeed");
const podSeed = require("./data/podSeed");
const processSeed = require("./data/processSeed");
const brandSeed = require("./data/brandSeed");
const allocationSeed = require("./data/allocationSeed");

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
