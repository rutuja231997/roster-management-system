const express = require("express");

const brandController = require("../controllers/brand.controller");

const brandRouter = express.Router();

// add a brand
brandRouter.post("/create-brand", brandController.createBrand);

// get all brands
brandRouter.get("/brands", brandController.getAllBrands);

// update a brand
brandRouter.patch("/update-brand/:id", brandController.updateBrand);

// get a brand
brandRouter.get("/brand/:id", brandController.getBrandById);

// delete a brand

module.exports = brandRouter;
