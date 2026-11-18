import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../axiosInstance";

// Get all allocations
export const getAllAllocations = createAsyncThunk(
  "allocations/getAllAllocations",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/allocations");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch allocations",
      );
    }
  },
);

// Get allocation by ID
export const getAllocationById = createAsyncThunk(
  "allocations/getAllocationById",
  async (allocationId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/allocation/${allocationId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch allocation",
      );
    }
  },
);

// Create allocation
export const createAllocation = createAsyncThunk(
  "allocations/createAllocation",
  async (allocationData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "/create-allocation",
        allocationData,
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create allocation",
      );
    }
  },
);

// Update allocation
export const updateAllocation = createAsyncThunk(
  "allocations/updateAllocation",
  async ({ allocationId, allocationData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(
        `/update-allocation/${allocationId}`,
        allocationData,
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update allocation",
      );
    }
  },
);

const allocationSlice = createSlice({
  name: "allocations",

  initialState: {
    allocations: [],
    selectedAllocation: null,

    loading: false,
    error: null,

    singleAllocationLoading: false,
    singleAllocationError: null,

    mutationLoading: false,
    mutationError: null,
  },

  reducers: {
    clearSelectedAllocation: (state) => {
      state.selectedAllocation = null;
      state.singleAllocationError = null;
    },

    clearAllocationError: (state) => {
      state.error = null;
      state.singleAllocationError = null;
      state.mutationError = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Get all allocations
      .addCase(getAllAllocations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllAllocations.fulfilled, (state, action) => {
        state.loading = false;

        state.allocations = Array.isArray(action.payload)
          ? action.payload
          : action.payload.allocations || action.payload.data || [];
      })
      .addCase(getAllAllocations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get allocation by ID
      .addCase(getAllocationById.pending, (state) => {
        state.singleAllocationLoading = true;
        state.singleAllocationError = null;
      })
      .addCase(getAllocationById.fulfilled, (state, action) => {
        state.singleAllocationLoading = false;

        state.selectedAllocation =
          action.payload.allocation || action.payload.data || action.payload;
      })
      .addCase(getAllocationById.rejected, (state, action) => {
        state.singleAllocationLoading = false;
        state.singleAllocationError = action.payload;
      })

      // Create allocation
      .addCase(createAllocation.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })
      .addCase(createAllocation.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.allocations.unshift(action.payload);
      })
      .addCase(createAllocation.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = action.payload;
      })

      // Update allocation
      .addCase(updateAllocation.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })
      .addCase(updateAllocation.fulfilled, (state, action) => {
        state.mutationLoading = false;

        state.allocations = state.allocations.map((allocation) =>
          allocation._id === action.payload._id ? action.payload : allocation,
        );

        if (state.selectedAllocation?._id === action.payload._id) {
          state.selectedAllocation = action.payload;
        }
      })
      .addCase(updateAllocation.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = action.payload;
      });
  },
});

export const { clearSelectedAllocation, clearAllocationError } =
  allocationSlice.actions;

export default allocationSlice.reducer;
