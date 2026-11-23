import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../axiosInstance";

// ============================================
// 1. Fetch all availability records
// ============================================
export const fetchAvailability = createAsyncThunk(
  "availability/fetchAvailability",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/get-all-availabilites", {
        params: filters,
      });
      console.log(response.data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch availability records.",
      );
    }
  },
);

// ============================================
// 2. Fetch availability by ID
// ============================================
export const fetchAvailabilityById = createAsyncThunk(
  "availability/fetchAvailabilityById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/get-availability/${id}`);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch availability record.",
      );
    }
  },
);

// ============================================
// 3. Create availability request
// ============================================
export const createAvailability = createAsyncThunk(
  "availability/createAvailability",
  async (availabilityData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "/create-availability",
        availabilityData,
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to create availability request.",
      );
    }
  },
);

// ============================================
// 4. Update pending availability request
// ============================================
export const updateAvailability = createAsyncThunk(
  "availability/updateAvailability",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(
        `/update-availability/${id}`,
        data,
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to update availability request.",
      );
    }
  },
);

// ============================================
// 5. Approve or reject availability request
// ============================================
export const reviewAvailability = createAsyncThunk(
  "availability/reviewAvailability",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`/availability/${id}/review`, {
        status,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to review availability request.",
      );
    }
  },
);

// ============================================
// Initial State
// ============================================
const initialState = {
  availabilityRecords: [],
  selectedAvailability: null,

  loading: false,
  error: null,

  singleLoading: false,
  singleError: null,

  mutationLoading: false,
  mutationError: null,
};

// ============================================
// Slice
// ============================================
const availabilitySlice = createSlice({
  name: "availability",
  initialState,

  reducers: {
    clearAvailabilityError: (state) => {
      state.error = null;
      state.singleError = null;
      state.mutationError = null;
    },

    clearSelectedAvailability: (state) => {
      state.selectedAvailability = null;
      state.singleError = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // ========================================
      // Fetch All Availability
      // ========================================
      .addCase(fetchAvailability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchAvailability.fulfilled, (state, action) => {
        state.loading = false;
        state.availabilityRecords = action.payload.data || [];
      })

      .addCase(fetchAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ========================================
      // Fetch Availability By ID
      // ========================================
      .addCase(fetchAvailabilityById.pending, (state) => {
        state.singleLoading = true;
        state.singleError = null;
      })

      .addCase(fetchAvailabilityById.fulfilled, (state, action) => {
        state.singleLoading = false;
        state.selectedAvailability = action.payload.data;
      })

      .addCase(fetchAvailabilityById.rejected, (state, action) => {
        state.singleLoading = false;
        state.singleError = action.payload;
      })

      // ========================================
      // Create Availability
      // ========================================
      .addCase(createAvailability.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })

      .addCase(createAvailability.fulfilled, (state, action) => {
        state.mutationLoading = false;

        const newAvailability = action.payload.data;

        state.availabilityRecords.unshift(newAvailability);
        state.selectedAvailability = newAvailability;
      })

      .addCase(createAvailability.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = action.payload;
      })

      // ========================================
      // Update Availability
      // ========================================
      .addCase(updateAvailability.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })

      .addCase(updateAvailability.fulfilled, (state, action) => {
        state.mutationLoading = false;

        const updatedAvailability = action.payload.data;

        state.availabilityRecords = state.availabilityRecords.map(
          (availability) =>
            availability._id === updatedAvailability._id
              ? updatedAvailability
              : availability,
        );

        if (state.selectedAvailability?._id === updatedAvailability._id) {
          state.selectedAvailability = updatedAvailability;
        }
      })

      .addCase(updateAvailability.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = action.payload;
      })

      // ========================================
      // Review Availability
      // ========================================
      .addCase(reviewAvailability.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })

      .addCase(reviewAvailability.fulfilled, (state, action) => {
        state.mutationLoading = false;

        const reviewedAvailability = action.payload.data;

        state.availabilityRecords = state.availabilityRecords.map(
          (availability) =>
            availability._id === reviewedAvailability._id
              ? reviewedAvailability
              : availability,
        );

        if (state.selectedAvailability?._id === reviewedAvailability._id) {
          state.selectedAvailability = reviewedAvailability;
        }
      })

      .addCase(reviewAvailability.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = action.payload;
      });
  },
});

// ============================================
// Exports
// ============================================
export const { clearAvailabilityError, clearSelectedAvailability } =
  availabilitySlice.actions;

export default availabilitySlice.reducer;
