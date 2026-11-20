const express = require("express");

const availabilityController = require("../controllers/availability.controller");

const availabilityRouter = express.Router();

// Create availability request
availabilityRouter.post(
  "/create-availability",
  availabilityController.createAvailability,
);

// Get all availability records (supports query filters)
availabilityRouter.get(
  "/get-all-availabilites",
  availabilityController.getAllAvailability,
);

// Get availability record by ID
availabilityRouter.get(
  "/get-availability/:id",
  availabilityController.getAvailabilityById,
);

// Update pending availability request
availabilityRouter.patch(
  "/update-availability/:id",
  availabilityController.updateAvailability,
);

// Approve or reject availability request
availabilityRouter.patch(
  "/availability/:id/review",
  availabilityController.reviewAvailability,
);

module.exports = availabilityRouter;
