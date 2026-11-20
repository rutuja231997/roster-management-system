const mongoose = require("mongoose");

const rosterEntrySchema = new mongoose.Schema(
  {
    rosterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Roster",
      required: true,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },

    processId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Process",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    // New: Shift start time in 24-hour HH:mm format
    shiftStart: {
      type: String,
      default: null,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    // New: Shift end time in 24-hour HH:mm format
    shiftEnd: {
      type: String,
      default: null,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    status: {
      type: String,
      enum: ["SCHEDULED", "CANCELLED"],
      default: "SCHEDULED",
    },

    source: {
      type: String,
      enum: ["AUTO", "MANUAL"],
      default: "AUTO",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate employee assignments
rosterEntrySchema.index(
  {
    rosterId: 1,
    date: 1,
    employeeId: 1,
    brandId: 1,
    processId: 1,
  },
  {
    unique: true,
  },
);

// useful for finding assignments by roster and date
rosterEntrySchema.index({
  rosterId: 1,
  date: 1,
});

// useful for finding an employee's assignments
rosterEntrySchema.index({
  employeeId: 1,
  date: 1,
});

const RosterEntry = mongoose.model("RosterEntry", rosterEntrySchema);
module.exports = RosterEntry;
