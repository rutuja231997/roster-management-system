const mongoose = require("mongoose");

const Allocation = require("../models/allocation");
const Employee = require("../models/employee");
const Brand = require("../models/brand");
const Process = require("../models/process");

const {
  validateAllocationIds,
  populateAllocation,
} = require("../utils/allocationHelper");

// Create Allocation
const createAllocation = async (req, res) => {
  try {
    const { employeeId, brandId, processId } = req.body;

    // Check required fields
    if (!employeeId || !brandId || !processId) {
      return res.status(400).json({
        message: "Employee ID, Brand ID and Process ID are required",
      });
    }

    // Validate IDs
    if (!validateAllocationIds(employeeId, brandId, processId)) {
      return res.status(400).json({
        message: "Invalid Employee ID, Brand ID or Process ID",
      });
    }

    // Find Employee, Brand and Process
    const [employee, brand, process] = await Promise.all([
      Employee.findById(employeeId),
      Brand.findById(brandId),
      Process.findById(processId),
    ]);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    if (!brand) {
      return res.status(404).json({
        message: "Brand not found",
      });
    }

    if (!process) {
      return res.status(404).json({
        message: "Process not found",
      });
    }

    // Check active status
    if (employee.status !== "ACTIVE") {
      return res.status(400).json({
        message: "Cannot allocate an inactive employee",
      });
    }

    if (brand.status !== "ACTIVE") {
      return res.status(400).json({
        message: "Cannot allocate an inactive brand",
      });
    }

    if (process.status !== "ACTIVE") {
      return res.status(400).json({
        message: "Cannot allocate an inactive process",
      });
    }

    // Check duplicate allocation
    const existingAllocation = await Allocation.findOne({
      employeeId,
      brandId,
      processId,
    });

    if (existingAllocation) {
      return res.status(409).json({
        message: existingAllocation.isActive
          ? "This allocation already exists"
          : "This allocation already exists but is inactive. Reactivate the existing allocation.",
      });
    }

    // Create allocation
    const allocation = await Allocation.create({
      employeeId,
      brandId,
      processId,
    });

    const populatedAllocation = await populateAllocation(
      Allocation.findById(allocation._id),
    );

    return res.status(201).json({
      message: "Employee allocation created successfully",
      data: populatedAllocation,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This allocation already exists",
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

// Get All Allocations
const getAllAllocations = async (req, res) => {
  try {
    const allocations = await populateAllocation(
      Allocation.find().sort({ createdAt: -1 }),
    );

    return res.status(200).json({
      message: "Allocations fetched successfully",
      count: allocations.length,
      data: allocations,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get Allocation By ID
const getAllocationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid Allocation ID",
      });
    }

    const allocation = await populateAllocation(Allocation.findById(id));

    if (!allocation) {
      return res.status(404).json({
        message: "Allocation not found",
      });
    }

    return res.status(200).json({
      message: "Allocation fetched successfully",
      data: allocation,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Update Allocation

const updateAllocation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid Allocation ID",
      });
    }

    const allocation = await Allocation.findById(id);

    if (!allocation) {
      return res.status(404).json({
        message: "Allocation not found",
      });
    }

    // Allow only these fields to be updated
    const allowedFields = ["employeeId", "brandId", "processId", "isActive"];

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

    // Validate isActive
    if (
      updateData.isActive !== undefined &&
      typeof updateData.isActive !== "boolean"
    ) {
      return res.status(400).json({
        message: "isActive must be a boolean value",
      });
    }

    // Get updated values or retain existing values
    const employeeId =
      updateData.employeeId !== undefined
        ? updateData.employeeId
        : allocation.employeeId;

    const brandId =
      updateData.brandId !== undefined
        ? updateData.brandId
        : allocation.brandId;

    const processId =
      updateData.processId !== undefined
        ? updateData.processId
        : allocation.processId;

    // Validate IDs
    if (!validateAllocationIds(employeeId, brandId, processId)) {
      return res.status(400).json({
        message: "Invalid Employee ID, Brand ID or Process ID",
      });
    }

    // Find Employee, Brand and Process
    const [employee, brand, process] = await Promise.all([
      Employee.findById(employeeId),
      Brand.findById(brandId),
      Process.findById(processId),
    ]);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    if (!brand) {
      return res.status(404).json({
        message: "Brand not found",
      });
    }

    if (!process) {
      return res.status(404).json({
        message: "Process not found",
      });
    }

    // Check active status of linked records
    if (employee.status !== "ACTIVE") {
      return res.status(400).json({
        message: "Cannot allocate an inactive employee",
      });
    }

    if (brand.status !== "ACTIVE") {
      return res.status(400).json({
        message: "Cannot allocate an inactive brand",
      });
    }

    if (process.status !== "ACTIVE") {
      return res.status(400).json({
        message: "Cannot allocate an inactive process",
      });
    }

    // Check duplicate combination
    const existingAllocation = await Allocation.findOne({
      employeeId,
      brandId,
      processId,
      _id: { $ne: id },
    });

    if (existingAllocation) {
      return res.status(409).json({
        message: "Another allocation with this combination already exists",
      });
    }

    // Update allocation fields
    allocation.employeeId = employeeId;
    allocation.brandId = brandId;
    allocation.processId = processId;

    // Update allocation status if provided
    if (updateData.isActive !== undefined) {
      allocation.isActive = updateData.isActive;
    }

    await allocation.save();

    const updatedAllocation = await populateAllocation(Allocation.findById(id));

    return res.status(200).json({
      message: "Allocation updated successfully",
      data: updatedAllocation,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Another allocation with this combination already exists",
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

// Export controllers
module.exports = {
  createAllocation,
  getAllAllocations,
  getAllocationById,
  updateAllocation,
};
