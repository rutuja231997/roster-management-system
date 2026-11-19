const mongoose = require("mongoose");

const Roster = require("../models/roster");
const RosterEntry = require("../models/rosterEntry");
const RosterConflict = require("../models/rosterConflict");

const { generateMonthlyRoster } = require("../services/roster.service");

const generateMonthlyRosterController = async (req, res) => {
  const { month, year } = req.body;

  // Validate month
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return res.status(400).json({
      message: "Month must be a number between 1 and 12.",
    });
  }

  // Validate year
  if (!Number.isInteger(year) || year < 2020) {
    return res.status(400).json({
      message: "Please provide a valid year.",
    });
  }

  const periodStart = new Date(Date.UTC(year, month - 1, 1));
  const periodEnd = new Date(Date.UTC(year, month, 0));

  let session;

  try {
    // Check if roster already exists for this month
    const existingRoster = await Roster.findOne({
      periodStart,
      periodEnd: {
        $gte: periodEnd,
      },
    });

    if (existingRoster) {
      return res.status(409).json({
        message: "A roster already exists for this month.",
        rosterId: existingRoster._id,
      });
    }

    // Generate monthly roster data
    const monthlyRoster = await generateMonthlyRoster(month, year);

    // Start MongoDB transaction
    session = await mongoose.startSession();

    let createdRosterId;

    await session.withTransaction(async () => {
      // 1. Create Roster document
      const [roster] = await Roster.create(
        [
          {
            name: `${new Date(year, month - 1).toLocaleString("en-US", {
              month: "long",
            })} ${year} Roster`,

            periodStart,
            periodEnd,
            status: "DRAFT",
            generatedAt: new Date(),
            totalConflicts: monthlyRoster.totalConflicts,
          },
        ],
        { session },
      );

      // 2. Prepare roster entries
      const rosterEntries = monthlyRoster.assignments.map((assignment) => ({
        rosterId: roster._id,
        employeeId: assignment.employeeId,
        brandId: assignment.brandId,
        processId: assignment.processId,
        date: assignment.date,
        status: "SCHEDULED",
        source: "AUTO",
      }));

      // 3. Save roster entries
      if (rosterEntries.length > 0) {
        await RosterEntry.insertMany(rosterEntries, {
          session,
        });
      }

      // 4. Prepare roster conflicts
      const rosterConflicts = monthlyRoster.conflicts.map((conflict) => ({
        rosterId: roster._id,
        employeeId: conflict.employeeId ?? null,
        brandId: conflict.brandId,
        processId: conflict.processId,
        date: conflict.date,
        type: conflict.type,
        message: conflict.message,

        requiredEmployees: conflict.requiredEmployees ?? 0,
        availableEmployees: conflict.availableEmployees ?? 0,
        shortage: conflict.shortage ?? 0,

        allocatedEmployeeCodes: conflict.allocatedEmployeeCodes ?? [],

        eligibleEmployeeCodes: conflict.eligibleEmployeeCodes ?? [],

        unavailableEmployeeDetails: conflict.unavailableEmployeeDetails ?? [],

        status: "OPEN",
      }));

      // 5. Save roster conflicts
      if (rosterConflicts.length > 0) {
        await RosterConflict.insertMany(rosterConflicts, {
          session,
        });
      }

      createdRosterId = roster._id;
    });

    // 6. Send response after transaction succeeds
    return res.status(201).json({
      message: "Monthly roster generated successfully.",
      rosterId: createdRosterId,
      month,
      year,
      totalDays: monthlyRoster.totalDays,
      totalAssignments: monthlyRoster.totalAssignments,
      totalConflicts: monthlyRoster.totalConflicts,
    });
  } catch (error) {
    console.error("Monthly roster generation error:", error);

    return res.status(500).json({
      message: "Unable to generate monthly roster.",
      error: error.message,
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

const getRosterByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    // Pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    const skip = (page - 1) * limit;

    // Validate roster ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid roster ID.",
      });
    }

    // Find roster
    const roster = await Roster.findById(id).lean();

    if (!roster) {
      return res.status(404).json({
        message: "Roster not found.",
      });
    }

    // Build assignment query
    const query = {
      rosterId: roster._id,
    };

    // Optional date filter
    if (date) {
      const selectedDate = new Date(date);

      if (
        Number.isNaN(selectedDate.getTime()) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        selectedDate.toISOString().slice(0, 10) !== date
      ) {
        return res.status(400).json({
          message: "Please provide a valid date in YYYY-MM-DD format.",
        });
      }

      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);

      if (startOfDay < roster.periodStart || startOfDay > roster.periodEnd) {
        return res.status(400).json({
          message: "Selected date is outside the roster period.",
        });
      }

      query.date = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    // Count total matching assignments
    const totalRecords = await RosterEntry.countDocuments(query);

    const totalPages = Math.ceil(totalRecords / limit);

    // Fetch paginated assignments
    const assignments = await RosterEntry.find(query)
      .populate("employeeId", "firstName lastName employeeCode")
      .populate("brandId", "name")
      .populate("processId", "name")
      .sort({ date: 1, employeeId: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(200).json({
      message: "Roster fetched successfully.",
      roster,

      summary: {
        totalAssignments: totalRecords,
        totalDays: date
          ? 1
          : Math.round((roster.periodEnd - roster.periodStart) / 86400000) + 1,
        totalConflicts: roster.totalConflicts ?? 0,
      },

      pagination: {
        currentPage: page,
        limit,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },

      assignments,
    });
  } catch (error) {
    console.error("Get roster error:", error);

    return res.status(500).json({
      message: "Unable to fetch roster.",
      error: error.message,
    });
  }
};

const getAllRosters = async (req, res) => {
  try {
    const rosters = await Roster.find()
      .sort({ generatedAt: -1 })
      .select("name periodStart periodEnd status generatedAt");

    return res.status(200).json({
      message: "Rosters fetched successfully.",
      rosters,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch rosters.",
    });
  }
};

module.exports = {
  generateMonthlyRosterController,
  getRosterByIdController,
  getAllRosters,
};
