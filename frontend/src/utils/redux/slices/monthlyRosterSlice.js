import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../axiosInstance";

// Generate monthly roster
export const generateMonthlyRoster = createAsyncThunk(
  "monthlyRoster/generateMonthlyRoster",
  async ({ month, year }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/generate-monthly-roster", {
        month,
        year,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to generate monthly roster.",
      );
    }
  },
);

// Get monthly roster by ID with optional date filter
// Get monthly roster by ID with optional date and pagination
export const getMonthlyRoster = createAsyncThunk(
  "monthlyRoster/getMonthlyRoster",
  async ({ id, date, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/monthly-roster/${id}`, {
        params: {
          ...(date ? { date } : {}),
          page,
          limit,
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch monthly roster.",
      );
    }
  },
);

// Get all existing rosters
export const getAllRosters = createAsyncThunk(
  "monthlyRoster/getAllRosters",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/get-rosters");
      return response.data.rosters;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch rosters.",
      );
    }
  },
);

const initialState = {
  roster: null,
  rosters: [],
  summary: null,
  assignments: [],

  pagination: {
    currentPage: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },

  loading: false,
  rostersLoading: false,
  error: null,
  generating: false,
  generationError: null,
};

const monthlyRosterSlice = createSlice({
  name: "monthlyRoster",
  initialState,

  reducers: {
    clearMonthlyRoster: (state) => {
      state.roster = null;
      state.summary = null;
      state.assignments = [];
      state.pagination = initialState.pagination;
      state.error = null;
      state.generationError = null;
    },

    clearMonthlyRosterError: (state) => {
      state.error = null;
      state.generationError = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // Generate monthly roster
      .addCase(generateMonthlyRoster.pending, (state) => {
        state.generating = true;
        state.generationError = null;
      })

      .addCase(generateMonthlyRoster.fulfilled, (state, action) => {
        state.generating = false;

        state.roster = {
          _id: action.payload.rosterId,
          month: action.payload.month,
          year: action.payload.year,
        };

        state.summary = {
          totalDays: action.payload.totalDays,
          totalAssignments: action.payload.totalAssignments,
          totalConflicts: action.payload.totalConflicts,
        };

        state.assignments = [];
      })

      .addCase(generateMonthlyRoster.rejected, (state, action) => {
        state.generating = false;
        state.generationError = action.payload;
      })

      // Get monthly roster by ID
      .addCase(getMonthlyRoster.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.assignments = [];
      })

      .addCase(getMonthlyRoster.fulfilled, (state, action) => {
        state.loading = false;

        state.roster = action.payload.roster;
        state.summary = action.payload.summary;
        state.assignments = action.payload.assignments;

        state.pagination = action.payload.pagination;
      })

      .addCase(getMonthlyRoster.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.assignments = [];
      })

      // Get all existing rosters
      .addCase(getAllRosters.pending, (state) => {
        state.rostersLoading = true;
      })

      .addCase(getAllRosters.fulfilled, (state, action) => {
        state.rostersLoading = false;
        state.rosters = action.payload;
      })

      .addCase(getAllRosters.rejected, (state, action) => {
        state.rostersLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearMonthlyRoster, clearMonthlyRosterError } =
  monthlyRosterSlice.actions;

export default monthlyRosterSlice.reducer;
