const getWeeklyOffDays = (workPattern) => {
  const mandatoryWeeklyOffDays =
    workPattern.mandatoryWeeklyOffDays?.length > 0
      ? workPattern.mandatoryWeeklyOffDays
      : workPattern.weeklyOffDays || [];

  const preferredWeeklyOffDays = workPattern.preferredWeeklyOffDays || [];

  return {
    mandatoryWeeklyOffDays,
    preferredWeeklyOffDays,
  };
};

const evaluateWeeklyOff = (workPattern, dayName) => {
  const { mandatoryWeeklyOffDays, preferredWeeklyOffDays } =
    getWeeklyOffDays(workPattern);

  // Mandatory weekly off cannot be overridden.
  if (mandatoryWeeklyOffDays.includes(dayName)) {
    return {
      allowed: false,
      type: "WEEKLY_OFF",
      severity: "HIGH",
      message: `Employee has a mandatory weekly off on ${dayName}.`,
    };
  }

  // Preferred weekly off can be overridden for client coverage.
  if (preferredWeeklyOffDays.includes(dayName)) {
    return {
      allowed: true,
      type: "PREFERENCE_OVERRIDDEN",
      severity: "LOW",
      message: `Employee is scheduled on their preferred weekly off (${dayName}).`,
    };
  }

  return {
    allowed: true,
    type: null,
    severity: null,
    message: null,
  };
};

module.exports = {
  getWeeklyOffDays,
  evaluateWeeklyOff,
};
