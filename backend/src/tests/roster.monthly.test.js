require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const mongoose = require("mongoose");
const connectDB = require("../config/db");

const { generateMonthlyRoster } = require("../services/roster.service");

const testMonthlyRoster = async () => {
  try {
    await connectDB();

    const result = await generateMonthlyRoster(11, 2026);

    console.log("\nMonthly Roster Generation");

    console.log("Month:", result.month);
    console.log("Year:", result.year);
    console.log("Total Days:", result.totalDays);
    console.log("Total Assignments:", result.totalAssignments);
    console.log("Total Conflicts:", result.totalConflicts);

    console.log(
      "\nDaily Summary:",
      JSON.stringify(result.dailySummary, null, 2),
    );
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

testMonthlyRoster();
