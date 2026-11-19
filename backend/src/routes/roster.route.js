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

module.exports = rosterRouter;
