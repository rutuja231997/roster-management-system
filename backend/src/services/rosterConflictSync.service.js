const RosterConflict = require("../models/rosterConflict");
const Roster = require("../models/roster");

const getId = (value) => {
  if (!value) return "null";
  return String(value._id || value);
};

// Generate a unique identity for a conflict
const getConflictKey = (conflict) => {
  return [
    getId(conflict.brandId),
    getId(conflict.processId),
    new Date(conflict.date).toISOString().slice(0, 10),
    conflict.type,
    getId(conflict.employeeId),
  ].join("|");
};

const syncRosterConflicts = async (rosterId, detectedConflicts) => {
  const roster = await Roster.findById(rosterId);

  if (!roster) {
    throw new Error("Roster not found.");
  }

  const existingConflicts = await RosterConflict.find({
    rosterId,
  }).lean();

  const openConflicts = existingConflicts.filter(
    (conflict) => conflict.status === "OPEN",
  );

  const ignoredConflicts = existingConflicts.filter(
    (conflict) => conflict.status === "IGNORED",
  );

  const openConflictMap = new Map(
    openConflicts.map((conflict) => [getConflictKey(conflict), conflict]),
  );

  const ignoredConflictKeys = new Set(ignoredConflicts.map(getConflictKey));

  const detectedKeys = new Set(detectedConflicts.map(getConflictKey));

  let createdCount = 0;
  let resolvedCount = 0;
  let unchangedCount = 0;
  let ignoredCount = 0;
  let escalatedCount = 0;

  // 1. Create new conflicts or update existing OPEN conflicts
  for (const conflict of detectedConflicts) {
    const key = getConflictKey(conflict);

    const severity = conflict.severity || "HIGH";
    const requiresManagerReview = severity === "HIGH";

    const existingConflict = openConflictMap.get(key);

    // Conflict already exists: update its latest details
    if (existingConflict) {
      await RosterConflict.updateOne(
        { _id: existingConflict._id, status: "OPEN" },
        {
          $set: {
            severity,
            message: conflict.message,
            requiredEmployees: conflict.requiredEmployees || 0,
            availableEmployees: conflict.availableEmployees || 0,
            shortage: conflict.shortage || 0,
            allocatedEmployeeCodes: conflict.allocatedEmployeeCodes || [],
            eligibleEmployeeCodes: conflict.eligibleEmployeeCodes || [],
            unavailableEmployeeDetails:
              conflict.unavailableEmployeeDetails || [],
            requiresManagerReview,
            ...(requiresManagerReview && !existingConflict.escalatedAt
              ? { escalatedAt: new Date() }
              : {}),
          },
        },
      );

      if (requiresManagerReview && !existingConflict.requiresManagerReview) {
        escalatedCount++;
      }

      unchangedCount++;
      continue;
    }

    // Do not recreate intentionally ignored conflicts
    if (ignoredConflictKeys.has(key)) {
      ignoredCount++;
      continue;
    }

    // Create a new conflict
    await RosterConflict.create({
      rosterId,
      employeeId: conflict.employeeId || null,
      brandId: conflict.brandId,
      processId: conflict.processId,
      date: conflict.date,
      type: conflict.type,
      severity,
      message: conflict.message,
      requiredEmployees: conflict.requiredEmployees || 0,
      availableEmployees: conflict.availableEmployees || 0,
      shortage: conflict.shortage || 0,
      allocatedEmployeeCodes: conflict.allocatedEmployeeCodes || [],
      eligibleEmployeeCodes: conflict.eligibleEmployeeCodes || [],
      unavailableEmployeeDetails: conflict.unavailableEmployeeDetails || [],
      status: "OPEN",

      // Automatically escalate HIGH-severity conflicts
      requiresManagerReview,
      escalatedAt: requiresManagerReview ? new Date() : null,
      assignedTo: null,
    });

    if (requiresManagerReview) {
      escalatedCount++;
    }

    createdCount++;
  }

  // 2. Resolve OPEN conflicts that are no longer detected
  for (const conflict of openConflicts) {
    const key = getConflictKey(conflict);

    if (!detectedKeys.has(key)) {
      await RosterConflict.updateOne(
        { _id: conflict._id, status: "OPEN" },
        {
          $set: {
            status: "RESOLVED",
            resolvedAt: new Date(),
            requiresManagerReview: false,
            resolutionNotes:
              conflict.resolutionNotes ||
              "Automatically resolved during roster validation.",
          },
        },
      );

      resolvedCount++;
    }
  }

  // 3. Count currently OPEN conflicts
  const totalOpenConflicts = await RosterConflict.countDocuments({
    rosterId,
    status: "OPEN",
  });

  // 4. Count unresolved HIGH-severity conflicts
  const blockingConflicts = await RosterConflict.countDocuments({
    rosterId,
    status: "OPEN",
    severity: "HIGH",
  });

  // 5. Update roster conflict counts
  await Roster.updateOne(
    { _id: rosterId },
    {
      $set: {
        totalConflicts: totalOpenConflicts,
      },
    },
  );

  return {
    totalDetected: detectedConflicts.length,
    createdCount,
    resolvedCount,
    unchangedCount,
    ignoredCount,
    escalatedCount,
    totalOpenConflicts,
    blockingConflicts,
  };
};

module.exports = { syncRosterConflicts };
