import { configureStore } from "@reduxjs/toolkit";

import employeeReducer from "./redux/slices/employeeSlice";
import podReducer from "./redux/slices/podSlice";
import brandReducer from "./redux/slices/brandSlice";
import processReducer from "./redux/slices/processSlice";
import allocationReducer from "./redux/slices/allocationSlice";

const appStore = configureStore({
  reducer: {
    employees: employeeReducer,
    pods: podReducer,
    brands: brandReducer,
    processes: processReducer,
    allocations: allocationReducer,
  },
});

export default appStore;
