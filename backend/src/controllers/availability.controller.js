const Availability = require("../models/availability");
const Employee = require("../models/employee");

// 1. Create availability request
const createAvailability = async (req, res) => {
  try {
    const { employeeId, type, startDate, endDate, reason } = req.body;

    if (!employeeId || !type || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Employee, type, start date and end date are required.",
      });
    }

    const employee = await Employee.findById(employeeId);

    if (!employee || employee.status !== "ACTIVE") {
      return res.status(404).json({
        success: false,
        message: "Active employee not found.",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end < start
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide valid dates. End date cannot be before start date.",
      });
    }

    // Prevent overlapping pending or approved requests
    const existingRequest = await Availability.findOne({
      employeeId,
      status: { $in: ["PENDING", "APPROVED"] },
      startDate: { $lte: end },
      endDate: { $gte: start },
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message:
          "An overlapping pending or approved availability record already exists.",
      });
    }

    const availability = await Availability.create({
      employeeId,
      type,
      startDate: start,
      endDate: end,
      reason,
    });

    return res.status(201).json({
      success: true,
      message: "Availability request created successfully.",
      data: availability,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. Get all availability records
const getAllAvailability = async (req, res) => {
  try {
    const { employeeId, status, type } = req.query;

    const filter = {};

    if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;
    if (type) filter.type = type;

    const availabilityRecords = await Availability.find(filter)
      .populate("employeeId", "firstName lastName email")
      .populate("reviewedBy", "firstName lastName")
      .sort({ startDate: 1 });

    return res.status(200).json({
      success: true,
      totalRecords: availabilityRecords.length,
      data: availabilityRecords,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. Get availability record by ID
const getAvailabilityById = async (req, res) => {
  try {
    const availability = await Availability.findById(req.params.id)
      .populate("employeeId", "firstName lastName email")
      .populate("reviewedBy", "firstName lastName");

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: "Availability record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 4. Update a pending availability request
const updateAvailability = async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;

    const availability = await Availability.findById(req.params.id);

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: "Availability record not found.",
      });
    }

    if (availability.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending availability requests can be updated.",
      });
    }

    const updatedStart = startDate
      ? new Date(startDate)
      : availability.startDate;

    const updatedEnd = endDate ? new Date(endDate) : availability.endDate;

    if (
      Number.isNaN(updatedStart.getTime()) ||
      Number.isNaN(updatedEnd.getTime()) ||
      updatedEnd < updatedStart
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide valid dates. End date cannot be before start date.",
      });
    }

    const overlappingRequest = await Availability.findOne({
      _id: { $ne: availability._id },
      employeeId: availability.employeeId,
      status: { $in: ["PENDING", "APPROVED"] },
      startDate: { $lte: updatedEnd },
      endDate: { $gte: updatedStart },
    });

    if (overlappingRequest) {
      return res.status(409).json({
        success: false,
        message:
          "An overlapping pending or approved availability record already exists.",
      });
    }

    if (type !== undefined) availability.type = type;
    if (startDate !== undefined) availability.startDate = updatedStart;
    if (endDate !== undefined) availability.endDate = updatedEnd;
    if (reason !== undefined) availability.reason = reason;

    await availability.save();

    return res.status(200).json({
      success: true,
      message: "Availability request updated successfully.",
      data: availability,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 5. Approve or reject availability request
const reviewAvailability = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be APPROVED or REJECTED.",
      });
    }

    const availability = await Availability.findById(req.params.id);

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: "Availability record not found.",
      });
    }

    if (availability.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending requests can be reviewed.",
      });
    }

    availability.status = status;
    availability.reviewedBy = req.user?._id || null;
    availability.reviewedAt = new Date();

    await availability.save();

    return res.status(200).json({
      success: true,
      message: `Availability request ${status.toLowerCase()} successfully.`,
      data: availability,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createAvailability,
  getAllAvailability,
  getAvailabilityById,
  updateAvailability,
  reviewAvailability,
};
