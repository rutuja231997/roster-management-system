import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Building2,
  Workflow,
  BriefcaseBusiness,
  Settings,
  CalendarDays,
  ClipboardList,
  X,
} from "lucide-react";

const navigationItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Employees",
    path: "/employees",
    icon: Users,
  },
  {
    name: "Pods",
    path: "/pods",
    icon: UsersRound,
  },
  {
    name: "Brands",
    path: "/brands",
    icon: Building2,
  },
  {
    name: "Processes",
    path: "/processes",
    icon: Workflow,
  },
  {
    name: "Allocations",
    path: "/allocations",
    icon: BriefcaseBusiness,
  },
  {
    name: "Working Rules",
    path: "/working-rules",
    icon: Settings,
  },
  {
    name: "Availability",
    path: "/availability",
    icon: CalendarDays,
  },
  {
    name: "Rosters",
    path: "/rosters",
    icon: ClipboardList,
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              RS
            </div>

            <div>
              <h1 className="text-sm font-semibold text-slate-900">
                Roster Management
              </h1>
              <p className="text-xs text-slate-500">Admin Panel</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 md:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>

          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/dashboard"}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200 px-5 py-4">
          <p className="text-xs text-slate-400">Smart Roster Management</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
