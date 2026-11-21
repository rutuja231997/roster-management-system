const express = require("express");
const rosterViewController = express.Router();

const {
  getPodRosterController,
  getBrandRosterController,
  getProcessRosterController,
  getEmployeeRosterController,
} = require("../controllers/rosterView.controller");

rosterViewController.get(
  "/roster-view/:rosterId/pod/:podId",
  getPodRosterController,
);
rosterViewController.get(
  "/roster-view/:rosterId/brand/:brandId",
  getBrandRosterController,
);
rosterViewController.get(
  "/roster-view/:rosterId/process/:processId",
  getProcessRosterController,
);
rosterViewController.get(
  "/roster-view/:rosterId/employee/:employeeId",
  getEmployeeRosterController,
);

module.exports = rosterViewController;
