import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../axiosInstance";

// ======================================================
// GET POD-WISE ROSTER
// ======================================================

export const getPodRoster = createAsyncThunk(
  "rosterView/getPodRoster",
  async ({ rosterId, podId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/roster-view/${rosterId}/pod/${podId}`,
        {
          params: { page, limit },
        },
      );
      console.log(response.data.data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch Pod roster.",
      );
    }
  },
);

// ======================================================
// GET BRAND-WISE ROSTER
// ======================================================

export const getBrandRoster = createAsyncThunk(
  "rosterView/getBrandRoster",
  async ({ rosterId, brandId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/roster-view/${rosterId}/brand/${brandId}`,
        {
          params: { page, limit },
        },
      );
      console.log(response.data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch Brand roster.",
      );
    }
  },
);

// ======================================================
// GET PROCESS-WISE ROSTER
// ======================================================

export const getProcessRoster = createAsyncThunk(
  "rosterView/getProcessRoster",
  async (
    { rosterId, processId, page = 1, limit = 10 },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosInstance.get(
        `/roster-view/${rosterId}/process/${processId}`,
        {
          params: { page, limit },
        },
      );
      console.log(response.data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch Process roster.",
      );
    }
  },
);

// ======================================================
// GET EMPLOYEE-WISE ROSTER
// ======================================================

export const getEmployeeRoster = createAsyncThunk(
  "rosterView/getEmployeeRoster",
  async (
    { rosterId, employeeId, page = 1, limit = 10 },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosInstance.get(
        `/roster-view/${rosterId}/employee/${employeeId}`,
        {
          params: { page, limit },
        },
      );
      console.log(response.data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch Employee roster.",
      );
    }
  },
);

// ======================================================
// INITIAL STATE
// ======================================================

const initialPagination = {
  currentPage: 1,
  limit: 10,
  totalRecords: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const initialState = {
  // Pod-wise roster
  podRoster: null,
  podPagination: { ...initialPagination },
  podLoading: false,
  podError: null,

  // Brand-wise roster
  brandRoster: null,
  brandPagination: { ...initialPagination },
  brandLoading: false,
  brandError: null,

  // Process-wise roster
  processRoster: null,
  processPagination: { ...initialPagination },
  processLoading: false,
  processError: null,

  // Employee-wise roster
  employeeRoster: null,
  employeePagination: { ...initialPagination },
  employeeLoading: false,
  employeeError: null,
};

// ======================================================
// SLICE
// ======================================================

const rosterViewSlice = createSlice({
  name: "rosterView",
  initialState,

  reducers: {
    // --------------------------------------------------
    // Clear Pod roster
    // --------------------------------------------------
    clearPodRoster: (state) => {
      state.podRoster = null;
      state.podPagination = { ...initialPagination };
      state.podLoading = false;
      state.podError = null;
    },

    clearPodRosterError: (state) => {
      state.podError = null;
    },

    // --------------------------------------------------
    // Clear Brand roster
    // --------------------------------------------------
    clearBrandRoster: (state) => {
      state.brandRoster = null;
      state.brandPagination = { ...initialPagination };
      state.brandLoading = false;
      state.brandError = null;
    },

    clearBrandRosterError: (state) => {
      state.brandError = null;
    },

    // --------------------------------------------------
    // Clear Process roster
    // --------------------------------------------------
    clearProcessRoster: (state) => {
      state.processRoster = null;
      state.processPagination = { ...initialPagination };
      state.processLoading = false;
      state.processError = null;
    },

    clearProcessRosterError: (state) => {
      state.processError = null;
    },

    // --------------------------------------------------
    // Clear Employee roster
    // --------------------------------------------------
    clearEmployeeRoster: (state) => {
      state.employeeRoster = null;
      state.employeePagination = { ...initialPagination };
      state.employeeLoading = false;
      state.employeeError = null;
    },

    clearEmployeeRosterError: (state) => {
      state.employeeError = null;
    },

    // --------------------------------------------------
    // Clear all roster views
    // --------------------------------------------------
    clearAllRosterViews: (state) => {
      state.podRoster = null;
      state.podPagination = { ...initialPagination };
      state.podLoading = false;
      state.podError = null;

      state.brandRoster = null;
      state.brandPagination = { ...initialPagination };
      state.brandLoading = false;
      state.brandError = null;

      state.processRoster = null;
      state.processPagination = { ...initialPagination };
      state.processLoading = false;
      state.processError = null;

      state.employeeRoster = null;
      state.employeePagination = { ...initialPagination };
      state.employeeLoading = false;
      state.employeeError = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // ==================================================
      // POD-WISE ROSTER
      // ==================================================

      .addCase(getPodRoster.pending, (state) => {
        state.podLoading = true;
        state.podError = null;
      })

      .addCase(getPodRoster.fulfilled, (state, action) => {
        state.podLoading = false;
        state.podRoster = action.payload;
        state.podPagination = action.payload.pagination;
      })

      .addCase(getPodRoster.rejected, (state, action) => {
        state.podLoading = false;
        state.podError = action.payload;
        state.podRoster = null;
      })

      // ==================================================
      // BRAND-WISE ROSTER
      // ==================================================

      .addCase(getBrandRoster.pending, (state) => {
        state.brandLoading = true;
        state.brandError = null;
      })

      .addCase(getBrandRoster.fulfilled, (state, action) => {
        state.brandLoading = false;
        state.brandRoster = action.payload;
        state.brandPagination = action.payload.pagination;
      })

      .addCase(getBrandRoster.rejected, (state, action) => {
        state.brandLoading = false;
        state.brandError = action.payload;
        state.brandRoster = null;
      })

      // ==================================================
      // PROCESS-WISE ROSTER
      // ==================================================

      .addCase(getProcessRoster.pending, (state) => {
        state.processLoading = true;
        state.processError = null;
      })

      .addCase(getProcessRoster.fulfilled, (state, action) => {
        state.processLoading = false;
        state.processRoster = action.payload;
        state.processPagination = action.payload.pagination;
      })

      .addCase(getProcessRoster.rejected, (state, action) => {
        state.processLoading = false;
        state.processError = action.payload;
        state.processRoster = null;
      })

      // ==================================================
      // EMPLOYEE-WISE ROSTER
      // ==================================================

      .addCase(getEmployeeRoster.pending, (state) => {
        state.employeeLoading = true;
        state.employeeError = null;
      })

      .addCase(getEmployeeRoster.fulfilled, (state, action) => {
        state.employeeLoading = false;
        state.employeeRoster = action.payload;
        state.employeePagination = action.payload.pagination;
      })

      .addCase(getEmployeeRoster.rejected, (state, action) => {
        state.employeeLoading = false;
        state.employeeError = action.payload;
        state.employeeRoster = null;
      });
  },
});

// ======================================================
// EXPORT ACTIONS
// ======================================================

export const {
  clearPodRoster,
  clearPodRosterError,

  clearBrandRoster,
  clearBrandRosterError,

  clearProcessRoster,
  clearProcessRosterError,

  clearEmployeeRoster,
  clearEmployeeRosterError,

  clearAllRosterViews,
} = rosterViewSlice.actions;

// ======================================================
// EXPORT REDUCER
// ======================================================

export default rosterViewSlice.reducer;
