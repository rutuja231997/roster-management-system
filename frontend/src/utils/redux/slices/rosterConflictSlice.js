import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../axiosInstance";
import toast from "react-hot-toast";

// Fetch roster conflicts
export const fetchRosterConflicts = createAsyncThunk(
  "rosterConflict/fetchRosterConflicts",
  async ({ rosterId, filters = {} }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/${rosterId}/conflicts`, {
        params: filters,
      });
      console.log(response.data);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch roster conflicts.";

      return rejectWithValue(message);
    }
  },
);

// Validate roster and synchronize conflicts
export const validateRoster = createAsyncThunk(
  "rosterConflict/validateRoster",
  async (rosterId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/${rosterId}/validate`);

      toast.success(response.data.message || "Roster validation completed.");

      return response.data.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to validate roster.";

      toast.error(message);

      return rejectWithValue(message);
    }
  },
);

// Fetch eligible employees for a conflict
export const fetchEligibleEmployees = createAsyncThunk(
  "rosterConflict/fetchEligibleEmployees",
  async (conflictId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/conflicts/${conflictId}/eligible-employees`,
      );

      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch eligible employees.";

      return rejectWithValue(message);
    }
  },
);

// Resolve staffing conflict
export const resolveRosterConflict = createAsyncThunk(
  "rosterConflict/resolveRosterConflict",
  async ({ conflictId, employeeId, resolutionNotes }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(
        `/conflicts/${conflictId}/resolve`,
        {
          employeeId,
          resolutionNotes,
        },
      );
      console.log(response.data);
      toast.success(response.data.message);

      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to resolve roster conflict.";

      toast.error(message);

      return rejectWithValue(message);
    }
  },
);

const rosterConflictSlice = createSlice({
  name: "rosterConflict",
  initialState: {
    conflicts: [],
    statusCounts: {
      OPEN: 0,
      RESOLVED: 0,
      IGNORED: 0,
    },
    totalConflicts: 0,

    eligibleEmployees: [],
    conflictDetails: null,
    validationResult: null,

    loading: false,
    validating: false,
    resolving: false,
    eligibleEmployeesLoading: false,

    error: null,
  },

  reducers: {
    clearEligibleEmployees: (state) => {
      state.eligibleEmployees = [];
      state.conflictDetails = null;
    },

    clearConflictError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // Fetch conflicts
      .addCase(fetchRosterConflicts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRosterConflicts.fulfilled, (state, action) => {
        state.loading = false;

        state.conflicts = action.payload.conflicts || [];
        state.statusCounts = action.payload.statusCounts || state.statusCounts;

        state.totalConflicts = action.payload.totalConflicts || 0;
      })
      .addCase(fetchRosterConflicts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Validate roster
      .addCase(validateRoster.pending, (state) => {
        state.validating = true;
        state.error = null;
      })
      .addCase(validateRoster.fulfilled, (state, action) => {
        state.validating = false;
        state.validationResult = action.payload;
      })
      .addCase(validateRoster.rejected, (state, action) => {
        state.validating = false;
        state.error = action.payload;
      })

      // Fetch eligible employees
      .addCase(fetchEligibleEmployees.pending, (state) => {
        state.eligibleEmployeesLoading = true;
        state.error = null;
      })
      .addCase(fetchEligibleEmployees.fulfilled, (state, action) => {
        state.eligibleEmployeesLoading = false;

        state.eligibleEmployees = action.payload.eligibleEmployees || [];

        state.conflictDetails = action.payload.conflict || null;
      })
      .addCase(fetchEligibleEmployees.rejected, (state, action) => {
        state.eligibleEmployeesLoading = false;
        state.error = action.payload;
      })

      // Resolve conflict
      .addCase(resolveRosterConflict.pending, (state) => {
        state.resolving = true;
        state.error = null;
      })
      .addCase(resolveRosterConflict.fulfilled, (state) => {
        state.resolving = false;
      })
      .addCase(resolveRosterConflict.rejected, (state, action) => {
        state.resolving = false;
        state.error = action.payload;
      });
  },
});

export const { clearEligibleEmployees, clearConflictError } =
  rosterConflictSlice.actions;

export default rosterConflictSlice.reducer;
