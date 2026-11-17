const Brand = require("../models/brand");

// Create a new brand
const createBrand = async (req, res) => {
  try {
    const { name, description } = req.body;

    const existingBrand = await Brand.findOne({
      name: name?.trim(),
    });

    if (existingBrand) {
      return res.status(409).json({
        message: "Brand already exists",
      });
    }

    const brand = await Brand.create({
      name,
      description,
    });

    return res.status(201).json({
      message: "Brand created successfully",
      data: brand,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Brand already exists",
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

// Get all brands
const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      message: "Brands fetched successfully",
      data: brands,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get brand by ID
const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findById(id);

    if (!brand) {
      return res.status(404).json({
        message: "Brand not found",
      });
    }

    return res.status(200).json({
      message: "Brand fetched successfully",
      data: brand,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid brand ID",
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Update brand details

const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;

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

    // Check whether Brand exists
    const existingBrand = await Brand.findById(id);

    if (!existingBrand) {
      return res.status(404).json({
        message: "Brand not found",
      });
    }

    // Validate Brand Name
    if (
      updateData.name !== undefined &&
      (typeof updateData.name !== "string" || !updateData.name.trim())
    ) {
      return res.status(400).json({
        message: "Brand name cannot be empty",
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
        message: "Status must be ACTIVE or INACTIVE",
      });
    }

    // Check duplicate Brand name
    if (updateData.name !== undefined) {
      updateData.name = updateData.name.trim();

      const duplicateBrand = await Brand.findOne({
        name: updateData.name,
        _id: { $ne: id },
      });

      if (duplicateBrand) {
        return res.status(409).json({
          message: "Brand name already exists",
        });
      }
    }

    // Trim description
    if (updateData.description !== undefined) {
      updateData.description = updateData.description.trim();
    }

    // Update Brand
    const updatedBrand = await Brand.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      },
    );

    return res.status(200).json({
      message: "Brand updated successfully",
      data: updatedBrand,
    });
  } catch (error) {
    console.error("Update Brand Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Brand name already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid Brand ID",
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
};
