import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import DashboardLayout from "./components/layout/DashboardLayout";

import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Pods from "./pages/Pods";
import Brands from "./pages/Brands";
import Processes from "./pages/Processes";
import Allocations from "./pages/Allocations";

import { Provider } from "react-redux";
import appStore from "./utils/appStore";

function App() {
  return (
    <Provider store={appStore}>
      <BrowserRouter>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/pods" element={<Pods />} />
            <Route path="/brands" element={<Brands />} />
            <Route path="/processes" element={<Processes />} />
            <Route path="/allocations" element={<Allocations />} />

            {/* Add these pages when implemented */}
            {/* <Route path="/working-rules" element={<WorkingRules />} /> */}
            {/* <Route path="/availability" element={<Availability />} /> */}
            {/* <Route path="/rosters" element={<Rosters />} /> */}
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
