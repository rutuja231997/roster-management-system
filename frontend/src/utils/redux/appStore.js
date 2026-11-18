import { configureStore } from "@reduxjs/toolkit";

import employeeReducer from "./slices/employeeSlice";
import podReducer from "./slices/podSlice";
import brandReducer from "./slices/brandSlice";
import processReducer from "./slices/processSlice";
import allocationReducer from "./slices/allocationSlice";
import workingRuleReducer from "./slices/workingRuleSlice";

const appStore = configureStore({
  reducer: {
    employees: employeeReducer,
    pods: podReducer,
    brands: brandReducer,
    processes: processReducer,
    allocations: allocationReducer,
    workingRules: workingRuleReducer,
  },
});

export default appStore;
