const mongoose = require("mongoose");

// Validate Employee, Brand and Process IDs
const validateAllocationIds = (employeeId, brandId, processId) => {
  return (
    mongoose.isValidObjectId(employeeId) &&
    mongoose.isValidObjectId(brandId) &&
    mongoose.isValidObjectId(processId)
  );
};

// Populate Employee, Brand and Process details
const populateAllocation = (query) => {
  return query
    .populate("employeeId", "firstName lastName email employeeCode status")
    .populate("brandId", "name status")
    .populate("processId", "name status");
};

module.exports = {
  validateAllocationIds,
  populateAllocation,
};
