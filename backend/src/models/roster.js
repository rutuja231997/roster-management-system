const mongoose = require("mongoose");

const rosterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    periodStart: {
      type: Date,
      required: true,
    },

    periodEnd: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
    },

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      // required: true,
      default: null,
    },

    generatedAt: {
      type: Date,
      default: Date.now,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    totalConflicts: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

// validate the roster date range
rosterSchema.pre("validate", function () {
  if (this.periodStart && this.periodEnd && this.periodEnd < this.periodStart) {
    this.invalidate(
      "periodEnd",
      "Roster end date can not be before start date",
    );
  }
});

const Roster = mongoose.model("Roster", rosterSchema);
module.exports = Roster;
