const express = require("express");

const workingRuleController = require("../controllers/workingRule.controller");

const workingRuleRouter = express.Router();

// Create Working Rule
workingRuleRouter.post(
  "/create-working-rule",
  workingRuleController.createWorkingRule,
);

// Get All Working Rules
workingRuleRouter.get(
  "/get-working-rules",
  workingRuleController.getAllWorkingRules,
);

// Get Working Rule By ID
workingRuleRouter.get(
  "/get-working-rule/:id",
  workingRuleController.getWorkingRuleById,
);

// Update Working Rule
workingRuleRouter.patch(
  "/update-working-rule/:id",
  workingRuleController.updateWorkingRule,
);

module.exports = workingRuleRouter;
