const mongoose = require("mongoose");

const rosterConflictSchema = new mongoose.Schema(
  {
    rosterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Roster",
      required: true,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
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

    type: {
      type: String,
      enum: [
        "INSUFFICIENT_STAFFING",
        "EMPLOYEE_UNAVAILABLE",
        "WEEKLY_OFF",
        "PUBLIC_HOLIDAY",
        "MISSING_STAFFING_RULE",
        "OVERLAPPING_ASSIGNMENT",
        "WORKING_RULE_VIOLATION",
      ],
      required: true,
    },

    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "HIGH",
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    requiredEmployees: {
      type: Number,
      default: 0,
      min: 0,
    },

    availableEmployees: {
      type: Number,
      default: 0,
      min: 0,
    },

    shortage: {
      type: Number,
      default: 0,
      min: 0,
    },

    allocatedEmployeeCodes: {
      type: [String],
      default: [],
    },

    eligibleEmployeeCodes: {
      type: [String],
      default: [],
    },

    unavailableEmployeeDetails: [
      {
        employeeCode: {
          type: String,
          required: true,
        },
        reason: {
          type: String,
          required: true,
        },
      },
    ],

    status: {
      type: String,
      enum: ["OPEN", "RESOLVED", "IGNORED"],
      default: "OPEN",
    },

    resolutionNotes: {
      type: String,
      trim: true,
      default: "",
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

rosterConflictSchema.index({ rosterId: 1, date: 1 });
rosterConflictSchema.index({ rosterId: 1, status: 1 });

const RosterConflict = mongoose.model("RosterConflict", rosterConflictSchema);

module.exports = RosterConflict;
