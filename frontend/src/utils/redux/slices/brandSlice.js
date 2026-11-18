import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../axiosInstance";

// Get all brands
export const getAllBrands = createAsyncThunk(
  "brands/getAllBrands",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/brands");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch brands",
      );
    }
  },
);

// Get brand by ID
export const getBrandById = createAsyncThunk(
  "brands/getBrandById",
  async (brandId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/brand/${brandId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch brand",
      );
    }
  },
);

// Create brand
export const createBrand = createAsyncThunk(
  "brands/createBrand",
  async (brandData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/create-brand", brandData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create brand",
      );
    }
  },
);

// Update brand
export const updateBrand = createAsyncThunk(
  "brands/updateBrand",
  async ({ brandId, brandData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(
        `/update-brand/${brandId}`,
        brandData,
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update brand",
      );
    }
  },
);

const brandSlice = createSlice({
  name: "brands",

  initialState: {
    brands: [],
    selectedBrand: null,

    loading: false,
    error: null,

    singleBrandLoading: false,
    singleBrandError: null,

    mutationLoading: false,
    mutationError: null,
  },

  reducers: {
    clearSelectedBrand: (state) => {
      state.selectedBrand = null;
      state.singleBrandError = null;
    },

    clearBrandError: (state) => {
      state.error = null;
      state.singleBrandError = null;
      state.mutationError = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Get all brands
      .addCase(getAllBrands.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllBrands.fulfilled, (state, action) => {
        state.loading = false;

        state.brands = Array.isArray(action.payload)
          ? action.payload
          : action.payload.brands || action.payload.data || [];
      })
      .addCase(getAllBrands.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get brand by ID
      .addCase(getBrandById.pending, (state) => {
        state.singleBrandLoading = true;
        state.singleBrandError = null;
      })
      .addCase(getBrandById.fulfilled, (state, action) => {
        state.singleBrandLoading = false;

        state.selectedBrand =
          action.payload.brand || action.payload.data || action.payload;
      })
      .addCase(getBrandById.rejected, (state, action) => {
        state.singleBrandLoading = false;
        state.singleBrandError = action.payload;
      })

      // Create brand
      .addCase(createBrand.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })
      .addCase(createBrand.fulfilled, (state, action) => {
        state.mutationLoading = false;
        state.brands.unshift(action.payload);
      })
      .addCase(createBrand.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = action.payload;
      })

      // Update brand
      .addCase(updateBrand.pending, (state) => {
        state.mutationLoading = true;
        state.mutationError = null;
      })
      .addCase(updateBrand.fulfilled, (state, action) => {
        state.mutationLoading = false;

        state.brands = state.brands.map((brand) =>
          brand._id === action.payload._id ? action.payload : brand,
        );

        if (state.selectedBrand?._id === action.payload._id) {
          state.selectedBrand = action.payload;
        }
      })
      .addCase(updateBrand.rejected, (state, action) => {
        state.mutationLoading = false;
        state.mutationError = action.payload;
      });
  },
});

export const { clearSelectedBrand, clearBrandError } = brandSlice.actions;

export default brandSlice.reducer;
