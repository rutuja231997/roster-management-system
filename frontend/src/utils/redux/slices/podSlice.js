import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../axiosInstance";

// Get all Pods
export const getAllPods = createAsyncThunk(
  "pods/getAllPods",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/pods");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch Pods",
      );
    }
  },
);

// Get Pod by ID
export const getPodById = createAsyncThunk(
  "pods/getPodById",
  async (podId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/pod/${podId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch Pod",
      );
    }
  },
);

// Create Pod
export const createPod = createAsyncThunk(
  "pods/createPod",
  async (podData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/pods", podData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create Pod",
      );
    }
  },
);

// Update Pod
export const updatePod = createAsyncThunk(
  "pods/updatePod",
  async ({ podId, podData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`/pods/${podId}`, podData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update Pod",
      );
    }
  },
);

const podSlice = createSlice({
  name: "pods",

  initialState: {
    pods: [],
    selectedPod: null,

    loading: false,
    error: null,

    singlePodLoading: false,
    singlePodError: null,

    mutationLoading: false,
    mutationError: null,
  },

  reducers: {
    clearSelectedPod: (state) => {
      state.selectedPod = null;
      state.singlePodError = null;
    },

    clearPodError: (state) => {
      state.error = null;
      state.singlePodError = null;
      state.mutationError = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // Get all Pods
      .addCase(getAllPods.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getAllPods.fulfilled, (state, action) => {
        state.loading = false;

        state.pods = Array.isArray(action.payload)
          ? action.payload
          : action.payload.pods || action.payload.data || [];
      })

      .addCase(getAllPods.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Pod by ID
      .addCase(getPodById.pending, (state) => {
        state.singlePodLoading = true;
        state.singlePodError = null;
      })

      .addCase(getPodById.fulfilled, (state, action) => {
        state.singlePodLoading = false;

        state.selectedPod =
          action.payload.pod || action.payload.data || action.payload;
      })

      .addCase(getPodById.rejected, (state, action) => {
        state.singlePodLoading = false;
        state.singlePodError = action.payload;
      })

      // Create Pod
      .addCase(createPod.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })

      .addCase(createPod.fulfilled, (state, action) => {
        state.mutationLoading = false;

        const newPod =
          action.payload.pod || action.payload.data || action.payload;

        state.pods.unshift(newPod);
      })

      .addCase(createPod.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = action.payload;
      })

      // Update Pod
      .addCase(updatePod.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })

      .addCase(updatePod.fulfilled, (state, action) => {
        state.mutationLoading = false;

        const updatedPod =
          action.payload.pod || action.payload.data || action.payload;

        state.pods = state.pods.map((pod) =>
          pod._id === updatedPod._id ? updatedPod : pod,
        );

        if (state.selectedPod?._id === updatedPod._id) {
          state.selectedPod = updatedPod;
        }
      })

      .addCase(updatePod.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = action.payload;
      });
  },
});

export const { clearSelectedPod, clearPodError } = podSlice.actions;

export default podSlice.reducer;
