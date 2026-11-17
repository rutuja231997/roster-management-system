const express = require("express");
const processRouter = express.Router();

const processController = require("../controllers/process.controller");

// Create a process
processRouter.post("/create-process", processController.createProcess);

// Get all processes
processRouter.get("/processes", processController.getAllProcesses);

// Get process by ID
processRouter.get("/process/:id", processController.getProcessById);

// Update process
processRouter.patch("/update-process/:id", processController.updateProcess);

module.exports = processRouter;
