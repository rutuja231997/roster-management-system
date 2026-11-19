import { configureStore } from "@reduxjs/toolkit";

import employeeReducer from "./slices/employeeSlice";
import podReducer from "./slices/podSlice";
import brandReducer from "./slices/brandSlice";
import processReducer from "./slices/processSlice";
import allocationReducer from "./slices/allocationSlice";
import workingRuleReducer from "./slices/workingRuleSlice";
import monthlyRosterReducer from "./slices/monthlyRosterSlice";

const appStore = configureStore({
  reducer: {
    employees: employeeReducer,
    pods: podReducer,
    brands: brandReducer,
    processes: processReducer,
    allocations: allocationReducer,
    workingRules: workingRuleReducer,
    monthlyRoster: monthlyRosterReducer,
  },
});

export default appStore;
