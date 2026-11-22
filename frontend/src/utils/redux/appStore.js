import { configureStore } from "@reduxjs/toolkit";

import employeeReducer from "./slices/employeeSlice";
import podReducer from "./slices/podSlice";
import brandReducer from "./slices/brandSlice";
import processReducer from "./slices/processSlice";
import allocationReducer from "./slices/allocationSlice";
import workingRuleReducer from "./slices/workingRuleSlice";
import monthlyRosterReducer from "./slices/monthlyRosterSlice";
import rosterViewReducer from "./slices/rosterViewSlice";
import rosterEntryReducer from "./slices/rosterEntrySlice";

const appStore = configureStore({
  reducer: {
    employees: employeeReducer,
    pods: podReducer,
    brands: brandReducer,
    processes: processReducer,
    allocations: allocationReducer,
    workingRules: workingRuleReducer,
    monthlyRoster: monthlyRosterReducer,
    rosterView: rosterViewReducer,
    rosterEntry: rosterEntryReducer,
  },
});

export default appStore;
