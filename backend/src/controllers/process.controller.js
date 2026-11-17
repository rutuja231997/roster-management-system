const mongoose = require("mongoose");
const Process = require("../models/process");

// Create Process
const createProcess = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Process name is required",
      });
    }

    if (description !== undefined && typeof description !== "string") {
      return res.status(400).json({
        message: "Description must be a string",
      });
    }

    const existingProcess = await Process.findOne({
      name: name.trim(),
    });

    if (existingProcess) {
      return res.status(409).json({
        message: "Process already exists",
      });
    }

    const process = await Process.create({
      name: name.trim(),
      description: description?.trim() || "",
    });

    return res.status(201).json({
      message: "Process created successfully",
      data: process,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Process already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get All Processes
const getAllProcesses = async (req, res) => {
  try {
    const processes = await Process.find().sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Processes fetched successfully",
      count: processes.length,
      data: processes,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get Process By ID
const getProcessById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid Process ID",
      });
    }

    const process = await Process.findById(id);

    if (!process) {
      return res.status(404).json({
        message: "Process not found",
      });
    }

    return res.status(200).json({
      message: "Process fetched successfully",
      data: process,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Update Process
const updateProcess = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid Process ID",
      });
    }

    const process = await Process.findById(id);

    if (!process) {
      return res.status(404).json({
        message: "Process not found",
      });
    }

    const allowedFields = ["name", "description"];
    const updateData = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "At least one valid field is required to update",
      });
    }

    if (
      updateData.name !== undefined &&
      (typeof updateData.name !== "string" || !updateData.name.trim())
    ) {
      return res.status(400).json({
        message: "Process name cannot be empty",
      });
    }

    if (
      updateData.description !== undefined &&
      typeof updateData.description !== "string"
    ) {
      return res.status(400).json({
        message: "Description must be a string",
      });
    }

    if (updateData.name !== undefined) {
      updateData.name = updateData.name.trim();

      const existingProcess = await Process.findOne({
        name: updateData.name,
        _id: { $ne: id },
      });

      if (existingProcess) {
        return res.status(409).json({
          message: "Another process with this name already exists",
        });
      }
    }

    if (updateData.description !== undefined) {
      updateData.description = updateData.description.trim();
    }

    Object.assign(process, updateData);
    await process.save();

    return res.status(200).json({
      message: "Process updated successfully",
      data: process,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Another process with this name already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  createProcess,
  getAllProcesses,
  getProcessById,
  updateProcess,
};
