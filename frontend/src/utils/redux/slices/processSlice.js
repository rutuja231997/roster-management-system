import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../axiosInstance";

// Get all processes
export const getAllProcesses = createAsyncThunk(
  "processes/getAllProcesses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/processes");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch processes",
      );
    }
  },
);

// Get process by ID
export const getProcessById = createAsyncThunk(
  "processes/getProcessById",
  async (processId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/process/${processId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch process",
      );
    }
  },
);

// Create process
export const createProcess = createAsyncThunk(
  "processes/createProcess",
  async (processData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/create-process", processData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create process",
      );
    }
  },
);

// Update process
export const updateProcess = createAsyncThunk(
  "processes/updateProcess",
  async ({ processId, processData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(
        `/update-process/${processId}`,
        processData,
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update process",
      );
    }
  },
);

const processSlice = createSlice({
  name: "processes",

  initialState: {
    processes: [],
    selectedProcess: null,

    loading: false,
    error: null,

    singleProcessLoading: false,
    singleProcessError: null,

    mutationLoading: false,
    mutationError: null,
  },

  reducers: {
    clearSelectedProcess: (state) => {
      state.selectedProcess = null;
      state.singleProcessError = null;
    },

    clearProcessError: (state) => {
      state.error = null;
      state.singleProcessError = null;
      state.mutationError = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Get all processes
      .addCase(getAllProcesses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllProcesses.fulfilled, (state, action) => {
        state.loading = false;

        state.processes = Array.isArray(action.payload)
          ? action.payload
          : action.payload.processes || action.payload.data || [];
      })
      .addCase(getAllProcesses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get process by ID
      .addCase(getProcessById.pending, (state) => {
        state.singleProcessLoading = true;
        state.singleProcessError = null;
      })
      .addCase(getProcessById.fulfilled, (state, action) => {
        state.singleProcessLoading = false;

        state.selectedProcess =
          action.payload.process || action.payload.data || action.payload;
      })
      .addCase(getProcessById.rejected, (state, action) => {
        state.singleProcessLoading = false;
        state.singleProcessError = action.payload;
      })

      // Create process
      .addCase(createProcess.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })
      .addCase(createProcess.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.processes.unshift(action.payload);
      })
      .addCase(createProcess.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = action.payload;
      })

      // Update process
      .addCase(updateProcess.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })
      .addCase(updateProcess.fulfilled, (state, action) => {
        state.mutationLoading = false;

        state.processes = state.processes.map((process) =>
          process._id === action.payload._id ? action.payload : process,
        );

        if (state.selectedProcess?._id === action.payload._id) {
          state.selectedProcess = action.payload;
        }
      })
      .addCase(updateProcess.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = action.payload;
      });
  },
});

export const { clearSelectedProcess, clearProcessError } = processSlice.actions;

export default processSlice.reducer;
