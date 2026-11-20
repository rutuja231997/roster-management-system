const days = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const employeeWorkPatternSeed = Array.from({ length: 30 }, (_, index) => {
  const weeklyOffDay = days[index % days.length];

  return {
    employeeCode: `EMP${String(index + 1).padStart(3, "0")}`,

    mandatoryWeeklyOffDays: [weeklyOffDay],
    preferredWeeklyOffDays: [],

    // Keep this temporarily for compatibility with older code.
    weeklyOffDays: [weeklyOffDay],

    workingDays: days.filter((day) => day !== weeklyOffDay),

    effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
    effectiveTo: null,
    status: "ACTIVE",
  };
});

module.exports = employeeWorkPatternSeed;
