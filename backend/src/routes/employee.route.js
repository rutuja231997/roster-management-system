const express = require("express");

const employeeController = require("../controllers/employee.controller");

const employeeRouter = express.Router();

// add employee
employeeRouter.post("/employee", employeeController.createEmployee);

//get all employees
employeeRouter.get("/employees", employeeController.getAllEmployees);

// assign or unassign an employee from a pod
employeeRouter.patch(
  "/assign-employee/:id/pod",
  employeeController.assignEmployeeToPod,
);

//get one employee
employeeRouter.get("/employee/:id", employeeController.getEmployeeById);

//update employee
employeeRouter.patch("/employee/:id", employeeController.updateEmployee);

module.exports = employeeRouter;
