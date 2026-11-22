import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import axiosInstance from "../../axiosInstance";

export const updateRosterEntry = createAsyncThunk(
  "rosterEntry/updateRosterEntry",
  async ({ id, updatedData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(
        `/update-roster-entry/${id}`,
        updatedData,
      );

      toast.success(
        response.data.message || "Roster entry updated successfully!",
      );

      return response.data.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update roster entry.";

      toast.error(errorMessage);

      return rejectWithValue(errorMessage);
    }
  },
);

const rosterEntrySlice = createSlice({
  name: "rosterEntry",

  initialState: {
    updatedRosterEntry: null,
    validationReport: null,
    conflictSyncResult: null,
    impactSummary: null,
    impacts: [],

    loading: false,
    error: null,
  },

  reducers: {
    clearRosterEntryError: (state) => {
      state.error = null;
    },

    clearRosterEntryUpdate: (state) => {
      state.updatedRosterEntry = null;
      state.validationReport = null;
      state.conflictSyncResult = null;
      state.impactSummary = null;
      state.impacts = [];
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Pending
      .addCase(updateRosterEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      // Fulfilled
      .addCase(updateRosterEntry.fulfilled, (state, action) => {
        state.loading = false;

        state.updatedRosterEntry = action.payload.rosterEntry;

        state.validationReport = action.payload.validationReport || null;

        state.conflictSyncResult = action.payload.conflictSyncResult || null;

        state.impactSummary = action.payload.impactSummary || null;

        state.impacts = action.payload.impacts || [];
      })

      // Rejected
      .addCase(updateRosterEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearRosterEntryError, clearRosterEntryUpdate } =
  rosterEntrySlice.actions;

export default rosterEntrySlice.reducer;
