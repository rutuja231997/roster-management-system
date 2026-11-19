const { getMonthDates } = require("../utils/rosterHelpers");

const testMonthDates = () => {
  try {
    const dates = getMonthDates(11, 2026);

    console.log("Total dates:", dates.length);

    console.log("First date:", dates[0]);

    console.log("Last date:", dates[dates.length - 1]);

    console.log("All dates:");

    console.table(
      dates.map(({ date, dayName }) => ({
        date: date.toISOString().split("T")[0],
        dayName,
      })),
    );
  } catch (error) {
    console.error("Error:", error.message);
  }
};

testMonthDates();
