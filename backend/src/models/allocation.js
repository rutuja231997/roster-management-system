const mongoose = require("mongoose");

const allocationSchema = new mongoose.Schema(
  {
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

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// prevent duplicate allocations for the same combination
allocationSchema.index(
  {
    employeeId: 1,
    brandId: 1,
    processId: 1,
  },
  { unique: true },
);

const Allocation = mongoose.model("Allocation", allocationSchema);
module.exports = Allocation;
