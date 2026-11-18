import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../axiosInstance";

// Get All Working Rules
export const getAllWorkingRules = createAsyncThunk(
  "workingRules/getAllWorkingRules",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/get-working-rules");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

// Get Working Rule By ID
export const getWorkingRuleById = createAsyncThunk(
  "workingRules/getWorkingRuleById",
  async (workingRuleId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/get-working-rule/${workingRuleId}`,
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

// Create Working Rule
export const createWorkingRule = createAsyncThunk(
  "workingRules/createWorkingRule",
  async (workingRuleData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "/create-working-rule",
        workingRuleData,
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

// Update Working Rule
export const updateWorkingRule = createAsyncThunk(
  "workingRules/updateWorkingRule",
  async ({ workingRuleId, workingRuleData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(
        `/update-working-rule/${workingRuleId}`,
        workingRuleData,
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

const initialState = {
  workingRules: [],
  selectedWorkingRule: null,

  loading: false,
  error: null,

  singleWorkingRuleLoading: false,
  singleWorkingRuleError: null,

  mutationLoading: false,
  mutationError: null,
};

const workingRuleSlice = createSlice({
  name: "workingRules",
  initialState,

  reducers: {
    clearSelectedWorkingRule: (state) => {
      state.selectedWorkingRule = null;
      state.singleWorkingRuleError = null;
    },

    clearWorkingRuleError: (state) => {
      state.error = null;
      state.singleWorkingRuleError = null;
      state.mutationError = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // Get All Working Rules
      .addCase(getAllWorkingRules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllWorkingRules.fulfilled, (state, action) => {
        state.loading = false;
        state.workingRules = action.payload.data || [];
      })
      .addCase(getAllWorkingRules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Working Rule By ID
      .addCase(getWorkingRuleById.pending, (state) => {
        state.singleWorkingRuleLoading = true;
        state.singleWorkingRuleError = null;
      })
      .addCase(getWorkingRuleById.fulfilled, (state, action) => {
        state.singleWorkingRuleLoading = false;
        state.selectedWorkingRule = action.payload.data;
      })
      .addCase(getWorkingRuleById.rejected, (state, action) => {
        state.singleWorkingRuleLoading = false;
        state.singleWorkingRuleError = action.payload;
      })

      // Create Working Rule
      .addCase(createWorkingRule.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })
      .addCase(createWorkingRule.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.workingRules.unshift(action.payload);
      })
      .addCase(createWorkingRule.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = action.payload;
      })

      // Update Working Rule
      .addCase(updateWorkingRule.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })
      .addCase(updateWorkingRule.fulfilled, (state, action) => {
        state.mutationLoading = false;

        state.workingRules = state.workingRules.map((rule) =>
          rule._id === action.payload._id ? action.payload : rule,
        );

        if (state.selectedWorkingRule?._id === action.payload._id) {
          state.selectedWorkingRule = action.payload;
        }
      })
      .addCase(updateWorkingRule.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = action.payload;
      });
  },
});

export const { clearSelectedWorkingRule, clearWorkingRuleError } =
  workingRuleSlice.actions;

export default workingRuleSlice.reducer;
