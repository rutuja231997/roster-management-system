import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../axiosInstance";

// GET: Fetch all employees
export const getAllEmployees = createAsyncThunk(
  "employees/getAllEmployees",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/employees");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch employees",
      );
    }
  },
);

// GET: Fetch employee by ID
export const getEmployeeById = createAsyncThunk(
  "employees/getEmployeeById",
  async (employeeId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/employee/${employeeId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch employee",
      );
    }
  },
);

// POST: Create employee
export const createEmployee = createAsyncThunk(
  "employees/createEmployee",
  async (employeeData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/employee", employeeData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create employee",
      );
    }
  },
);

// PATCH: Update employee
export const updateEmployee = createAsyncThunk(
  "employees/updateEmployee",
  async ({ employeeId, employeeData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(
        `/employee/${employeeId}`,
        employeeData,
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update employee",
      );
    }
  },
);

// PATCH: Assign or unassign employee to/from a Pod
export const assignEmployeeToPod = createAsyncThunk(
  "employees/assignEmployeeToPod",
  async ({ employeeId, podId }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(
        `/assign-employee/${employeeId}/pod`,
        { podId },
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to assign employee to Pod",
      );
    }
  },
);

const employeeSlice = createSlice({
  name: "employees",

  initialState: {
    employees: [],
    selectedEmployee: null,

    loading: false,
    error: null,

    singleEmployeeLoading: false,
    singleEmployeeError: null,

    mutationLoading: false,
    mutationError: null,
  },

  reducers: {
    clearSelectedEmployee: (state) => {
      state.selectedEmployee = null;
      state.singleEmployeeError = null;
    },

    clearEmployeeError: (state) => {
      state.error = null;
      state.singleEmployeeError = null;
      state.mutationError = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // Get all employees
      .addCase(getAllEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = action.payload.data || [];
      })
      .addCase(getAllEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get employee by ID
      .addCase(getEmployeeById.pending, (state) => {
        state.singleEmployeeLoading = true;
        state.singleEmployeeError = null;
      })
      .addCase(getEmployeeById.fulfilled, (state, action) => {
        state.singleEmployeeLoading = false;
        state.selectedEmployee = action.payload.data;
      })
      .addCase(getEmployeeById.rejected, (state, action) => {
        state.singleEmployeeLoading = false;
        state.singleEmployeeError = action.payload;
      })

      // Create employee
      .addCase(createEmployee.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.employees.unshift(action.payload);
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = action.payload;
      })

      // Update employee
      .addCase(updateEmployee.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.mutationLoading = false;

        const updatedEmployee = action.payload;

        state.employees = state.employees.map((employee) =>
          employee._id === updatedEmployee._id ? updatedEmployee : employee,
        );

        if (state.selectedEmployee?._id === updatedEmployee._id) {
          state.selectedEmployee = updatedEmployee;
        }
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = action.payload;
      })

      // Assign employee to Pod
      .addCase(assignEmployeeToPod.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })
      .addCase(assignEmployeeToPod.fulfilled, (state, action) => {
        state.mutationLoading = false;

        const updatedEmployee = action.payload;

        state.employees = state.employees.map((employee) =>
          employee._id === updatedEmployee._id ? updatedEmployee : employee,
        );

        if (state.selectedEmployee?._id === updatedEmployee._id) {
          state.selectedEmployee = updatedEmployee;
        }
      })
      .addCase(assignEmployeeToPod.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = action.payload;
      });
  },
});

export const { clearSelectedEmployee, clearEmployeeError } =
  employeeSlice.actions;

export default employeeSlice.reducer;
