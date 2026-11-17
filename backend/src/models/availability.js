const mongoose = require("mongoose");

const Employee = require("./employee");

const availabilitySchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Employee,
      required: true,
    },

    type: {
      type: String,
      enum: ["LEAVE", "SICK_LEAVE", "COMP_OFF", "UNAVAILABLE"],
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    reason: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Employee,
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// validate that the end date is not before the start date
availabilitySchema.pre("validate", function () {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate("endDate", "End date can not before start date");
  }
});

const Availability = mongoose.model("Availability", availabilitySchema);
module.exports = Availability;
