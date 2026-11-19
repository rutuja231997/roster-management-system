const express = require("express");

const rosterRouter = express.Router();

const rosterController = require("../controllers/roster.controller");

rosterRouter.post(
  "/generate-monthly-roster",
  rosterController.generateMonthlyRosterController,
);

rosterRouter.get(
  "/monthly-roster/:id",
  rosterController.getRosterByIdController,
);

rosterRouter.get("/get-rosters", rosterController.getAllRosters);

module.exports = rosterRouter;
