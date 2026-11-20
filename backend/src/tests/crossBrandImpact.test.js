require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const connectDB = require("../config/db");

const {
  crossBrandImpactAnalysis,
} = require("../services/crossBrandImpact.service");

const runTest = async () => {
  try {
    await connectDB();

    // Replace these with actual MongoDB IDs
    const rosterId = "YOUR_ROSTER_ID";
    const employeeId = "YOUR_EMPLOYEE_ID";

    const impactReport = await crossBrandImpactAnalysis({
      rosterId,
      employeeId,
      startDate: "2026-11-25",
      endDate: "2026-11-25",
    });

    console.log(
      "Cross-Brand Impact Report:",
      JSON.stringify(impactReport, null, 2),
    );
  } catch (error) {
    console.error("Test failed:", error.message);
  } finally {
    process.exit();
  }
};

runTest();
