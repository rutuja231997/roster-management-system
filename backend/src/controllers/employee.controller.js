const Employee = require("../models/employee");
const Pod = require("../models/pod");

const mongoose = require("mongoose");

// Add a new employee
const createEmployee = async (req, res) => {
  try {
    const { firstName, lastName, email, employeeCode, podId } = req.body;

    // Check whether email already exists
    const existingEmail = await Employee.findOne({
      email: email?.trim().toLowerCase(),
    });

    if (existingEmail) {
      return res.status(409).json({
        message: "An employee with this email already exists",
      });
    }

    // Check whether employee code already exists
    const existingEmployeeCode = await Employee.findOne({
      employeeCode: employeeCode?.trim(),
    });

    if (existingEmployeeCode) {
      return res.status(409).json({
        message: "Employee code already exists",
      });
    }

    // Create employee
    const employee = await Employee.create({
      firstName,
      lastName,
      email,
      employeeCode,
      podId,
    });

    return res.status(201).json({
      message: "Employee created successfully",
      data: employee,
    });
  } catch (error) {
    console.error("Create Employee Error:", error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email or employee code already exists",
      });
    }

    // Handle Mongoose validation errors
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

// get all employees
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("podId", "name description")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Employees fetched successfully",
      data: employees,
    });
  } catch (error) {
    console.error("Get All Employees Error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// get one employee
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id).populate(
      "podId",
      "name description",
    );

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    return res.status(200).json({
      message: "Employee fetched successfully",
      data: employee,
    });
  } catch (error) {
    console.error("Get Employee By ID Error:", error);

    // Handle invalid MongoDB ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid employee ID",
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// update a employee
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Check whether employee exists
    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    // Define fields allowed to be updated
    const allowedFields = [
      "firstName",
      "lastName",
      "email",
      "employeeCode",
      "status",
    ];

    // Prepare update data using only allowed fields
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

    // Validate name fields
    for (const field of ["firstName", "lastName"]) {
      if (
        updateData[field] !== undefined &&
        (typeof updateData[field] !== "string" || !updateData[field].trim())
      ) {
        return res.status(400).json({
          message: `${field} cannot be empty`,
        });
      }

      if (updateData[field] !== undefined) {
        updateData[field] = updateData[field].trim();
      }
    }

    // Validate email
    if (updateData.email !== undefined) {
      if (typeof updateData.email !== "string" || !updateData.email.trim()) {
        return res.status(400).json({
          message: "Email cannot be empty",
        });
      }

      updateData.email = updateData.email.trim().toLowerCase();

      const existingEmail = await Employee.findOne({
        email: updateData.email,
        _id: { $ne: id },
      });

      if (existingEmail) {
        return res.status(409).json({
          message: "Email already exists",
        });
      }
    }

    // Validate employee code
    if (updateData.employeeCode !== undefined) {
      if (
        typeof updateData.employeeCode !== "string" ||
        !updateData.employeeCode.trim()
      ) {
        return res.status(400).json({
          message: "Employee code cannot be empty",
        });
      }

      updateData.employeeCode = updateData.employeeCode.trim();

      const existingEmployeeCode = await Employee.findOne({
        employeeCode: updateData.employeeCode,
        _id: { $ne: id },
      });

      if (existingEmployeeCode) {
        return res.status(409).json({
          message: "Employee code already exists",
        });
      }
    }

    // Validate status
    if (
      updateData.status !== undefined &&
      !["ACTIVE", "INACTIVE"].includes(updateData.status)
    ) {
      return res.status(400).json({
        message: "Status must be either ACTIVE or INACTIVE",
      });
    }

    // Update employee
    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      },
    ).populate("podId", "name description");

    return res.status(200).json({
      message: "Employee updated successfully",
      data: updatedEmployee,
    });
  } catch (error) {
    console.error("Update Employee Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email or employee code already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid employee ID",
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Assign or unassign an employee to a Pod
const assignEmployeeToPod = async (req, res) => {
  try {
    const { id } = req.params;
    const { podId } = req.body;

    // Validate employee ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid employee ID",
      });
    }

    // Check whether podId is provided
    if (podId === undefined) {
      return res.status(400).json({
        message: "Pod ID is required. Use null to unassign the employee.",
      });
    }

    // Find employee
    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    // Only active employees can be assigned
    if (employee.status !== "ACTIVE") {
      return res.status(400).json({
        message: "Cannot assign an inactive employee to a Pod",
      });
    }

    // Unassign employee from current Pod
    if (podId === null) {
      employee.podId = null;
      await employee.save();

      const updatedEmployee = await Employee.findById(id).populate(
        "podId",
        "name description",
      );

      return res.status(200).json({
        message: "Employee unassigned from Pod successfully",
        data: updatedEmployee,
      });
    }

    // Validate Pod ID
    if (!mongoose.isValidObjectId(podId)) {
      return res.status(400).json({
        message: "Invalid Pod ID",
      });
    }

    // Find Pod
    const pod = await Pod.findById(podId);

    if (!pod) {
      return res.status(404).json({
        message: "Pod not found",
      });
    }

    // Only active Pods can receive employees
    if (pod.status !== "ACTIVE") {
      return res.status(400).json({
        message: "Cannot assign an employee to an inactive Pod",
      });
    }

    // Assign employee to Pod
    employee.podId = pod._id;
    await employee.save();

    const updatedEmployee = await Employee.findById(id).populate(
      "podId",
      "name description",
    );

    return res.status(200).json({
      message: "Employee assigned to Pod successfully",
      data: updatedEmployee,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: `Internal server error : ${error.message}`,
    });
  }
};

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  assignEmployeeToPod,
};
