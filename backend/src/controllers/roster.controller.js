const mongoose = require("mongoose");

const Roster = require("../models/roster");
const RosterEntry = require("../models/rosterEntry");

const { generateMonthlyRoster } = require("../services/roster.service");

const generateMonthlyRosterController = async (req, res) => {
  const { month, year } = req.body;

  // Validate month
  if (!month || month < 1 || month > 12 || !Number.isInteger(month)) {
    return res.status(400).json({
      message: "Month must be a number between 1 and 12.",
    });
  }

  // Validate year
  if (!year || !Number.isInteger(year) || year < 2020) {
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

    // Generate monthly roster
    const monthlyRoster = await generateMonthlyRoster(month, year);

    // Start MongoDB transaction
    session = await mongoose.startSession();

    await session.withTransaction(async () => {
      // Create Roster document
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
          },
        ],
        { session },
      );

      // Prepare roster entries
      const rosterEntries = monthlyRoster.assignments.map((assignment) => ({
        rosterId: roster._id,
        employeeId: assignment.employeeId,
        brandId: assignment.brandId,
        processId: assignment.processId,
        date: assignment.date,
        status: "SCHEDULED",
        source: "AUTO",
      }));

      // Save all assignments
      if (rosterEntries.length > 0) {
        await RosterEntry.insertMany(rosterEntries, {
          session,
        });
      }

      // Store roster ID for response
      req.generatedRosterId = roster._id;
    });

    // return res.status(201).json({
    //   message: "Monthly roster generated successfully.",
    //   rosterId: req.generatedRosterId,
    //   month,
    //   year,
    //   totalDays: monthlyRoster.totalDays,
    //   totalAssignments: monthlyRoster.totalAssignments,
    //   totalConflicts: monthlyRoster.totalConflicts,
    //   dailySummary: monthlyRoster.dailySummary,
    //   conflicts: monthlyRoster.conflicts,
    // });

    return res.status(201).json({
      message: "Monthly roster generated successfully.",
      rosterId: req.generatedRosterId,
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

    // Fetch roster assignments
    const assignments = await RosterEntry.find(query)
      .populate("employeeId", "firstName lastName employeeCode")
      .populate("brandId", "name")
      .populate("processId", "name")
      .sort({ date: 1 })
      .lean();

    return res.status(200).json({
      message: "Roster fetched successfully.",
      roster,
      summary: {
        totalAssignments: assignments.length,
        totalDays: date
          ? 1
          : Math.round((roster.periodEnd - roster.periodStart) / 86400000) + 1,
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

module.exports = {
  generateMonthlyRosterController,
  getRosterByIdController,
};
