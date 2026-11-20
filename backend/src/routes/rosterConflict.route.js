const express = require("express");

const rosterConflictController = require("../controllers/rosterConflict.controller");

const routerConflictRouter = express.Router();

routerConflictRouter.get(
  "/:rosterId/conflicts",
  rosterConflictController.getRosterConflictsController,
);

routerConflictRouter.patch(
  "/conflicts/:conflictId/resolve",
  rosterConflictController.resolveRosterConflictController,
);

routerConflictRouter.get(
  "/conflicts/:conflictId/eligible-employees",
  rosterConflictController.getEligibleEmployeesController,
);

routerConflictRouter.post(
  "/:rosterId/validate",
  rosterConflictController.validateRosterController,
);

module.exports = routerConflictRouter;
