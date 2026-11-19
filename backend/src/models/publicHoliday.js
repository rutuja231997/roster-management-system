const mongoose = require("mongoose");

const publicHolidaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

publicHolidaySchema.index({ date: 1 }, { unique: true });

const PublicHoliday = mongoose.model("PublicHoliday", publicHolidaySchema);

module.exports = PublicHoliday;
