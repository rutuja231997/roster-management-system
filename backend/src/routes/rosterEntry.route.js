const express = require("express");
const rosterEntryRouter = express.Router();

const rosterEntryController = require("../controllers/rosterEntry.controller");

rosterEntryRouter.post(
  "/create-roster-entry",
  rosterEntryController.createRosterEntryController,
);

// Update an existing roster assignment
rosterEntryRouter.patch(
  "/update-roster-entry/:id",
  rosterEntryController.updateRosterEntry,
);

module.exports = rosterEntryRouter;
