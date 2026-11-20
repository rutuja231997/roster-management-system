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

    // New: Mandatory weekly offs
    mandatoryWeeklyOffDays: {
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
      default: [],
    },

    // New: Preferred weekly offs (can be overridden)
    preferredWeeklyOffDays: {
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
      default: [],
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

employeeWorkPatternSchema.pre("validate", function () {
  const overlap = this.mandatoryWeeklyOffDays.filter((day) =>
    this.preferredWeeklyOffDays.includes(day),
  );

  if (overlap.length > 0) {
    this.invalidate(
      "preferredWeeklyOffDays",
      `A day cannot be both mandatory and preferred weekly off: ${overlap.join(", ")}`,
    );
  }
});

const EmployeeWorkPattern = mongoose.model(
  "EmployeeWorkPattern",
  employeeWorkPatternSchema,
);

module.exports = EmployeeWorkPattern;
