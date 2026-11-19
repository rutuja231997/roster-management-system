const mongoose = require("mongoose");

const validDays = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const workingRuleSchema = new mongoose.Schema(
  {
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

    operatingDays: {
      type: [String],
      enum: validDays,
      required: true,
      validate: {
        validator: (days) => days.length > 0,
        message: "At least one operating day is required.",
      },
    },

    operatesOnPublicHolidays: {
      type: Boolean,
      default: false,
    },

    minimumStaffing: [
      {
        day: {
          type: String,
          enum: validDays,
          required: true,
        },

        requiredEmployees: {
          type: Number,
          required: true,
          min: 0,
          validate: {
            validator: Number.isInteger,
            message: "Required employees must be a whole number.",
          },
        },
      },
    ],

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

// Validate minimum staffing days against operating days
workingRuleSchema.path("minimumStaffing").validate(function (staffing) {
  const staffingDays = staffing.map((item) => item.day);

  if (new Set(staffingDays).size !== staffingDays.length) {
    return false;
  }

  const operatingDays =
    this instanceof mongoose.Document
      ? this.operatingDays
      : this.get("operatingDays");

  if (!operatingDays) {
    return true;
  }

  return staffingDays.every((day) => operatingDays.includes(day));
}, "Staffing days must be unique and must belong to the operating days.");

// One working rule per brand-process combination
workingRuleSchema.index(
  {
    brandId: 1,
    processId: 1,
  },
  { unique: true },
);

const workingRule = mongoose.model("workingRule", workingRuleSchema);

module.exports = workingRule;
