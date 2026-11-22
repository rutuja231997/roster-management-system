const RosterConflict = require("../models/rosterConflict");
const Roster = require("../models/roster");

const getId = (value) => {
  if (!value) return "null";

  return String(value._id || value);
};

// Normalize date to YYYY-MM-DD
const getDateKey = (date) => {
  if (!date) return "null";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(date);
  }

  return parsedDate.toISOString().slice(0, 10);
};

// Generate a unique identity for a conflict
const getConflictKey = (conflict) => {
  return [
    getId(conflict.brandId),
    getId(conflict.processId),
    getDateKey(conflict.date),
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

  // --------------------------------------------------
  // 1. DEDUPLICATE DETECTED CONFLICTS
  // --------------------------------------------------

  const uniqueDetectedConflicts = new Map();

  for (const conflict of detectedConflicts) {
    const key = getConflictKey(conflict);

    if (!uniqueDetectedConflicts.has(key)) {
      uniqueDetectedConflicts.set(key, conflict);
    }
  }

  const conflictsToSync = [...uniqueDetectedConflicts.values()];

  // --------------------------------------------------
  // 2. CREATE MAP OF EXISTING OPEN CONFLICTS
  // --------------------------------------------------

  const openConflictMap = new Map();

  let resolvedCount = 0;
  let duplicateExistingCount = 0;

  for (const conflict of openConflicts) {
    const key = getConflictKey(conflict);

    // If an OPEN conflict with the same identity already exists,
    // automatically resolve the duplicate record.
    if (openConflictMap.has(key)) {
      await RosterConflict.updateOne(
        {
          _id: conflict._id,
          status: "OPEN",
        },
        {
          $set: {
            status: "RESOLVED",
            resolvedAt: new Date(),
            requiresManagerReview: false,
            resolutionNotes:
              "Duplicate conflict record automatically resolved during synchronization.",
          },
        },
      );

      resolvedCount++;
      duplicateExistingCount++;

      continue;
    }

    openConflictMap.set(key, conflict);
  }

  // --------------------------------------------------
  // 3. CREATE MAP OF IGNORED CONFLICTS
  // --------------------------------------------------

  const ignoredConflictKeys = new Set(ignoredConflicts.map(getConflictKey));

  // --------------------------------------------------
  // 4. CREATE MAP OF DETECTED CONFLICT KEYS
  // --------------------------------------------------

  const detectedKeys = new Set(conflictsToSync.map(getConflictKey));

  // --------------------------------------------------
  // 5. INITIALIZE COUNTERS
  // --------------------------------------------------

  let createdCount = 0;
  let unchangedCount = 0;
  let ignoredCount = 0;
  let escalatedCount = 0;

  // --------------------------------------------------
  // 6. CREATE NEW CONFLICTS OR UPDATE EXISTING OPEN
  // --------------------------------------------------

  for (const conflict of conflictsToSync) {
    const key = getConflictKey(conflict);

    const severity = conflict.severity || "HIGH";

    const requiresManagerReview = severity === "HIGH";

    const existingConflict = openConflictMap.get(key);

    // ----------------------------------------------
    // EXISTING OPEN CONFLICT
    // ----------------------------------------------

    if (existingConflict) {
      await RosterConflict.updateOne(
        {
          _id: existingConflict._id,
          status: "OPEN",
        },
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
              ? {
                  escalatedAt: new Date(),
                }
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

    // ----------------------------------------------
    // IGNORED CONFLICT
    // ----------------------------------------------

    if (ignoredConflictKeys.has(key)) {
      ignoredCount++;

      continue;
    }

    // ----------------------------------------------
    // CREATE NEW CONFLICT
    // ----------------------------------------------

    const createdConflict = await RosterConflict.create({
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

    // IMPORTANT:
    // Add the newly created conflict to the map.
    // This prevents another detected conflict with
    // the same identity from being created again
    // during this synchronization.
    openConflictMap.set(key, createdConflict);

    if (requiresManagerReview) {
      escalatedCount++;
    }

    createdCount++;
  }

  // --------------------------------------------------
  // 7. RESOLVE OPEN CONFLICTS NO LONGER DETECTED
  // --------------------------------------------------

  for (const conflict of openConflicts) {
    const key = getConflictKey(conflict);

    // Duplicate records were already resolved above.
    if (!openConflictMap.has(key)) {
      continue;
    }

    // If this conflict is still detected, keep it OPEN.
    if (detectedKeys.has(key)) {
      continue;
    }

    await RosterConflict.updateOne(
      {
        _id: conflict._id,
        status: "OPEN",
      },
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

    // Remove it from the map to prevent further processing.
    openConflictMap.delete(key);
  }

  // --------------------------------------------------
  // 8. GET CURRENT OPEN CONFLICT COUNT
  // --------------------------------------------------

  const totalOpenConflicts = await RosterConflict.countDocuments({
    rosterId,
    status: "OPEN",
  });

  // --------------------------------------------------
  // 9. GET CURRENT HIGH-SEVERITY OPEN CONFLICT COUNT
  // --------------------------------------------------

  const blockingConflicts = await RosterConflict.countDocuments({
    rosterId,
    status: "OPEN",
    severity: "HIGH",
  });

  // --------------------------------------------------
  // 10. UPDATE ROSTER CONFLICT COUNT
  // --------------------------------------------------

  await Roster.updateOne(
    {
      _id: rosterId,
    },
    {
      $set: {
        totalConflicts: totalOpenConflicts,
      },
    },
  );

  // --------------------------------------------------
  // 11. LOG SYNCHRONIZATION RESULTS
  // --------------------------------------------------

  console.log("========== CONFLICT SYNC ==========");

  console.log({
    rosterId: String(rosterId),

    totalDetected: detectedConflicts.length,

    uniqueDetected: conflictsToSync.length,

    existingConflicts: existingConflicts.length,

    existingOpenConflicts: openConflicts.length,

    duplicateExistingCount,

    createdCount,

    resolvedCount,

    unchangedCount,

    ignoredCount,

    escalatedCount,

    totalOpenConflicts,

    blockingConflicts,
  });

  console.log("==================================");

  // --------------------------------------------------
  // 12. RETURN SYNCHRONIZATION RESULTS
  // --------------------------------------------------

  return {
    totalDetected: conflictsToSync.length,

    createdCount,

    resolvedCount,

    duplicateExistingCount,

    unchangedCount,

    ignoredCount,

    escalatedCount,

    totalOpenConflicts,

    blockingConflicts,
  };
};

module.exports = {
  syncRosterConflicts,
};
