const express = require("express");
const allocationRouter = express.Router();

const allocationController = require("../controllers/allocation.controller");

// Create allocation
allocationRouter.post(
  "/create-allocation",
  allocationController.createAllocation,
);

// Get all allocations
allocationRouter.get("/allocations", allocationController.getAllAllocations);

// Get allocation by ID
allocationRouter.get("/allocation/:id", allocationController.getAllocationById);

// Update allocation
allocationRouter.patch(
  "/update-allocation/:id",
  allocationController.updateAllocation,
);

module.exports = allocationRouter;
