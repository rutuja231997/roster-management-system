const mongoose = require("mongoose");
const validator = require("validator");

const employeeSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },

    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (value) => validator.isEmail(value),
        message: "Please provide a valid email address",
      },
    },

    employeeCode: {
      type: String,
      required: [true, "Employee code is required"],
      unique: true,
      trim: true,
    },

    podId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pod",
      default: null,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true },
);

const Employee = mongoose.model("Employee", employeeSchema);
module.exports = Employee;
