import { useLocation } from "react-router-dom";
import { Menu, ChevronRight, UserCircle } from "lucide-react";

const pageTitles = {
  "/dashboard": "Dashboard",
  "/employees": "Employees",
  "/pods": "Pods",
  "/brands": "Brands",
  "/processes": "Processes",
  "/allocations": "Allocations",
  "/working-rules": "Working Rules",
  "/availability": "Availability",
  "/rosters": "Rosters",
};

const Navbar = ({ onMenuClick }) => {
  const location = useLocation();

  const pageTitle = pageTitles[location.pathname] || "Roster Management";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      {/* Page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={21} />
        </button>

        <div className="flex items-center gap-2">
          <ChevronRight size={16} className="hidden text-slate-400 sm:block" />

          <h2 className="text-base font-semibold text-slate-800">
            {pageTitle}
          </h2>
        </div>
      </div>

      {/* Admin profile */}
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-800">Admin</p>
          <p className="text-xs text-slate-500">Administrator</p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <UserCircle size={22} />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
