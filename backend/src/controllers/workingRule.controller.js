const WorkingRule = require("../models/workingRule");
const Process = require("../models/process");
const Brand = require("../models/brand");

// Create Working Rule
const createWorkingRule = async (req, res) => {
  try {
    const {
      brandId,
      processId,
      operatingDays,
      operatesOnPublicHolidays,
      minimumStaffing,
      status,
    } = req.body;

    // 1. Check whether the Brand exists and is active
    const brand = await Brand.findOne({
      _id: brandId,
      status: "ACTIVE",
    });

    if (!brand) {
      return res.status(404).json({
        message: "Active brand not found.",
      });
    }

    // 2. Check whether the Process exists and is active
    const process = await Process.findOne({
      _id: processId,
      status: "ACTIVE",
    });

    if (!process) {
      return res.status(404).json({
        message: "Active process not found.",
      });
    }

    // 3. Check for an existing Brand + Process combination
    const existingRule = await WorkingRule.findOne({
      brandId,
      processId,
    });

    if (existingRule) {
      return res.status(409).json({
        message: "A working rule already exists for this brand and process.",
      });
    }

    // 4. Create Working Rule
    const workingRule = await WorkingRule.create({
      brandId,
      processId,
      operatingDays,
      operatesOnPublicHolidays,
      minimumStaffing,
      status,
    });

    // 5. Populate Brand and Process details
    const populatedRule = await WorkingRule.findById(workingRule._id)
      .populate("brandId", "name")
      .populate("processId", "name");

    // 6. Send response
    return res.status(201).json({
      message: "Working rule created successfully.",
      data: populatedRule,
    });
  } catch (error) {
    // Duplicate Brand + Process combination
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A working rule already exists for this brand and process.",
      });
    }

    // Mongoose validation errors
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create working rule.",
      error: error.message,
    });
  }
};

// Get All Working Rules
const getAllWorkingRules = async (req, res) => {
  try {
    const workingRules = await WorkingRule.find()
      .populate("brandId", "name")
      .populate("processId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Working rules fetched successfully.",
      data: workingRules,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch working rules.",
      error: error.message,
    });
  }
};

// Get Working Rule By ID
const getWorkingRuleById = async (req, res) => {
  try {
    const { id } = req.params;

    const workingRule = await WorkingRule.findById(id)
      .populate("brandId", "name")
      .populate("processId", "name");

    if (!workingRule) {
      return res.status(404).json({
        message: "Working rule not found.",
      });
    }

    return res.status(200).json({
      message: "Working rule fetched successfully.",
      data: workingRule,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid working rule ID.",
      });
    }

    return res.status(500).json({
      message: "Failed to fetch working rule.",
      error: error.message,
    });
  }
};

// Update Working Rule
const updateWorkingRule = async (req, res) => {
  try {
    const { id } = req.params;

    const { operatingDays, operatesOnPublicHolidays, minimumStaffing, status } =
      req.body;

    // 1. Find the existing Working Rule
    const workingRule = await WorkingRule.findById(id);

    if (!workingRule) {
      return res.status(404).json({
        message: "Working rule not found.",
      });
    }

    // 2. Update only the provided fields
    if (operatingDays !== undefined) {
      workingRule.operatingDays = operatingDays;
    }

    if (operatesOnPublicHolidays !== undefined) {
      workingRule.operatesOnPublicHolidays = operatesOnPublicHolidays;
    }

    if (minimumStaffing !== undefined) {
      workingRule.minimumStaffing = minimumStaffing;
    }

    if (status !== undefined) {
      workingRule.status = status;
    }

    // 3. Save updated Working Rule
    await workingRule.save();

    // 4. Populate Brand and Process details
    const updatedRule = await WorkingRule.findById(id)
      .populate("brandId", "name")
      .populate("processId", "name");

    return res.status(200).json({
      message: "Working rule updated successfully.",
      data: updatedRule,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid working rule ID.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to update working rule.",
      error: error.message,
    });
  }
};

module.exports = {
  createWorkingRule,
  getAllWorkingRules,
  getWorkingRuleById,
  updateWorkingRule,
};
