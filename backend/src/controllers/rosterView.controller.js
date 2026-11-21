const mongoose = require("mongoose");

const {
  getPodRoster,
  getBrandRoster,
  getProcessRoster,
  getEmployeeRoster,
} = require("../services/rosterView.service");

const getPodRosterController = async (req, res) => {
  try {
    const { rosterId, podId } = req.params;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(10, Math.max(1, parseInt(req.query.limit) || 5));

    if (
      !mongoose.Types.ObjectId.isValid(rosterId) ||
      !mongoose.Types.ObjectId.isValid(podId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid roster ID or pod ID.",
      });
    }

    const data = await getPodRoster(rosterId, podId, page, limit);

    return res.status(200).json({
      success: true,
      message: "Pod roster fetched successfully.",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getBrandRosterController = async (req, res) => {
  try {
    const { rosterId, brandId } = req.params;

    // Pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(10, Math.max(1, parseInt(req.query.limit) || 5));

    if (
      !mongoose.Types.ObjectId.isValid(rosterId) ||
      !mongoose.Types.ObjectId.isValid(brandId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid roster ID or brand ID.",
      });
    }

    // Pass pagination parameters to service
    const data = await getBrandRoster(rosterId, brandId, page, limit);

    return res.status(200).json({
      success: true,
      message: "Brand roster fetched successfully.",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getProcessRosterController = async (req, res) => {
  try {
    const { rosterId, processId } = req.params;

    // Pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(10, Math.max(1, parseInt(req.query.limit) || 5));

    if (
      !mongoose.Types.ObjectId.isValid(rosterId) ||
      !mongoose.Types.ObjectId.isValid(processId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid roster ID or process ID.",
      });
    }

    // Pass pagination parameters to service
    const data = await getProcessRoster(rosterId, processId, page, limit);

    return res.status(200).json({
      success: true,
      message: "Process roster fetched successfully.",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getEmployeeRosterController = async (req, res) => {
  try {
    const { rosterId, employeeId } = req.params;

    // Pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(10, Math.max(1, parseInt(req.query.limit) || 5));

    if (
      !mongoose.Types.ObjectId.isValid(rosterId) ||
      !mongoose.Types.ObjectId.isValid(employeeId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid roster ID or employee ID.",
      });
    }

    // Pass pagination parameters to service
    const data = await getEmployeeRoster(rosterId, employeeId, page, limit);

    return res.status(200).json({
      success: true,
      message: "Employee roster fetched successfully.",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getPodRosterController,
  getBrandRosterController,
  getProcessRosterController,
  getEmployeeRosterController,
};
