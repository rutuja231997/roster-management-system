const Pod = require("../models/pod");
const Employee = require("../models/employee");
const mongoose = require("mongoose");

// 1. Create a new Pod
const createPod = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check duplicate Pod name
    const existingPod = await Pod.findOne({
      name: name?.trim(),
    });

    if (existingPod) {
      return res.status(409).json({
        message: "Pod with this name already exists",
      });
    }

    const pod = await Pod.create({
      name,
      description,
    });

    return res.status(201).json({
      message: "Pod created successfully",
      data: pod,
    });
  } catch (error) {
    console.error("Create Pod Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Pod name already exists",
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

// 2. Get all Pods
// const getAllPods = async (req, res) => {
//   try {
//     const pods = await Pod.find()
//       .populate("leadEmployeeId", "firstName lastName employeeCode")
//       .sort({ createdAt: -1 });

//     return res.status(200).json({
//       message: "Pods fetched successfully",
//       data: pods,
//     });
//   } catch (error) {
//     console.error("Get All Pods Error:", error);

//     return res.status(500).json({
//       message: "Internal server error",
//     });
//   }
// };

const getAllPods = async (req, res) => {
  try {
    const pods = await Pod.aggregate([
      {
        $lookup: {
          from: "employees",
          localField: "_id",
          foreignField: "podId",
          as: "employees",
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "leadEmployeeId",
          foreignField: "_id",
          as: "leadEmployee",
        },
      },
      {
        $addFields: {
          employeeCount: { $size: "$employees" },
          leadEmployeeId: {
            $arrayElemAt: ["$leadEmployee", 0],
          },
        },
      },
      {
        $project: {
          employees: 0,
          leadEmployee: 0,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    return res.status(200).json({
      message: "Pods fetched successfully",
      data: pods,
    });
  } catch (error) {
    console.error("Get All Pods Error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// 3. Get a single Pod by ID
const getPodById = async (req, res) => {
  try {
    const { id } = req.params;

    const pod = await Pod.findById(id).populate(
      "leadEmployeeId",
      "firstName lastName employeeCode",
    );

    if (!pod) {
      return res.status(404).json({
        message: "Pod not found",
      });
    }

    return res.status(200).json({
      message: "Pod fetched successfully",
      data: pod,
    });
  } catch (error) {
    console.error("Get Pod By ID Error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid Pod ID",
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// 4. Update Pod details
const updatePod = async (req, res) => {
  try {
    const { id } = req.params;

    // Check whether Pod exists
    const pod = await Pod.findById(id);

    if (!pod) {
      return res.status(404).json({
        message: "Pod not found",
      });
    }

    // Define fields allowed to be updated
    const allowedFields = ["name", "description", "status"];

    const updateData = Object.fromEntries(
      allowedFields
        .filter((field) => req.body[field] !== undefined)
        .map((field) => [field, req.body[field]]),
    );

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "Please provide at least one valid field to update",
      });
    }

    // Validate Pod Name
    if (
      updateData.name !== undefined &&
      (typeof updateData.name !== "string" || !updateData.name.trim())
    ) {
      return res.status(400).json({
        message: "Pod name cannot be empty",
      });
    }

    // Validate Description
    if (
      updateData.description !== undefined &&
      typeof updateData.description !== "string"
    ) {
      return res.status(400).json({
        message: "Description must be a string",
      });
    }

    // Validate Status
    if (
      updateData.status !== undefined &&
      !["ACTIVE", "INACTIVE"].includes(updateData.status)
    ) {
      return res.status(400).json({
        message: "Status must be either ACTIVE or INACTIVE",
      });
    }

    // Check duplicate Pod name
    if (updateData.name !== undefined) {
      updateData.name = updateData.name.trim();

      const existingPod = await Pod.findOne({
        name: updateData.name,
        _id: { $ne: id },
      });

      if (existingPod) {
        return res.status(409).json({
          message: "Pod with this name already exists",
        });
      }
    }

    // Trim description
    if (updateData.description !== undefined) {
      updateData.description = updateData.description.trim();
    }

    const updatedPod = await Pod.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      },
    ).populate("leadEmployeeId", "firstName lastName employeeCode");

    return res.status(200).json({
      message: "Pod updated successfully",
      data: updatedPod,
    });
  } catch (error) {
    console.error("Update Pod Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Pod name already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid Pod ID",
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// 6. assign pod lead

const assignPodLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId } = req.body;

    // Validate Pod ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid Pod ID",
      });
    }

    // Employee ID must be provided
    if (employeeId === undefined) {
      return res.status(400).json({
        message: "Employee ID is required. Use null to remove the Pod Lead.",
      });
    }

    // Find Pod
    const pod = await Pod.findById(id);

    if (!pod) {
      return res.status(404).json({
        message: "Pod not found",
      });
    }

    if (pod.status !== "ACTIVE") {
      return res.status(400).json({
        message: "Cannot assign a lead to an inactive Pod",
      });
    }

    // Remove existing Pod Lead
    if (employeeId === null) {
      pod.leadEmployeeId = null;
      await pod.save();

      const updatedPod = await Pod.findById(id).populate(
        "leadEmployeeId",
        "firstName lastName employeeCode",
      );

      return res.status(200).json({
        message: "Pod Lead removed successfully",
        data: updatedPod,
      });
    }

    // Validate Employee ID
    if (!mongoose.isValidObjectId(employeeId)) {
      return res.status(400).json({
        message: "Invalid Employee ID",
      });
    }

    // Find Employee
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    if (employee.status !== "ACTIVE") {
      return res.status(400).json({
        message: "Cannot assign an inactive employee as Pod Lead",
      });
    }

    // Employee must belong to this Pod
    if (!employee.podId || employee.podId.toString() !== pod._id.toString()) {
      return res.status(400).json({
        message: "Employee must belong to this Pod to become its lead",
      });
    }

    // Assign Pod Lead
    pod.leadEmployeeId = employee._id;
    await pod.save();

    const updatedPod = await Pod.findById(id).populate(
      "leadEmployeeId",
      "firstName lastName employeeCode",
    );

    return res.status(200).json({
      message: "Pod Lead assigned successfully",
      data: updatedPod,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: `Internal server error : ${err.message}`,
    });
  }
};

module.exports = {
  createPod,
  getAllPods,
  getPodById,
  updatePod,
  assignPodLead,
};
