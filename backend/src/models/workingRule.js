const mongoose = require("mongoose");

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
      enum: [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
      ],
      required: true,
    },

    operatesOnPublicHolidays: {
      type: Boolean,
      default: false,
    },

    minimumStaffing: [
      {
        day: {
          type: String,
          enum: [
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
            "SATURDAY",
            "SUNDAY",
          ],
          required: true,
        },

        requiredEmployees: {
          type: Number,
          required: true,
          min: 0,
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

// one working rule per brand-process combination
workingRuleSchema.index(
  {
    brandId: 1,
    processId: 1,
  },
  { unique: true },
);

const workingRule = mongoose.model("workingRule", workingRuleSchema);
module.exports = workingRule;
