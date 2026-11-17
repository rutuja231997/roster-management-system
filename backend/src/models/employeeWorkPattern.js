const mongoose = require("mongoose");

const employeeWorkPatternSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      unique: true,
    },

    weeklyOffDays: {
      type: [String],
      enum: [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
      ],
      default: ["SUNDAY"],
    },

    workingDays: {
      type: [String],
      enum: [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
      ],
      default: [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
      ],
    },

    effectiveFrom: {
      type: Date,
      required: true,
    },

    effectiveTo: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  },
);

const EmployeeWorkPattern = mongoose.model(
  "EmployeeWorkPattern",
  employeeWorkPatternSchema,
);

module.exports = EmployeeWorkPattern;
