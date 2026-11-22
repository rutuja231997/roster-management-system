import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import DashboardLayout from "./components/layout/DashboardLayout";

import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Pods from "./pages/Pods";
import Brands from "./pages/Brands";
import Processes from "./pages/Processes";
import Allocations from "./pages/Allocations";
import WorkingRules from "./pages/WorkingRules";
import Roster from "./pages/Roster";
import RosterConflict from "./pages/RosterConflict";

import { Provider } from "react-redux";
import appStore from "./utils/redux/appStore";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <Provider store={appStore}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1e293b",
            color: "#ffffff",
          },
          success: {
            iconTheme: {
              primary: "#22c55e",
              secondary: "#ffffff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
          },
        }}
      />

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

            <Route path="/working-rules" element={<WorkingRules />} />
            <Route path="/rosters" element={<Roster />} />
            <Route
              path="/roster-conflict/:rosterId"
              element={<RosterConflict />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;

// function App() {
//   return (
//     <Provider store={appStore}>
//       <BrowserRouter>
//         <Routes>
//           <Route element={<DashboardLayout />}>
//             <Route path="/" element={<Navigate to="/dashboard" replace />} />

//             <Route path="/dashboard" element={<Dashboard />} />
//             <Route path="/employees" element={<Employees />} />
//             <Route path="/pods" element={<Pods />} />
//             <Route path="/brands" element={<Brands />} />
//             <Route path="/processes" element={<Processes />} />
//             <Route path="/allocations" element={<Allocations />} />

//             {/* Add these pages when implemented */}
//             <Route path="/working-rules" element={<WorkingRules />} />
//             {/* <Route path="/availability" element={<Availability />} /> */}
//             <Route path="/rosters" element={<Roster />} />
//           </Route>
//         </Routes>
//       </BrowserRouter>
//     </Provider>
//   );
// }

// export default App;
