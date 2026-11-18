/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Users,
  Building2,
  BriefcaseBusiness,
  Workflow,
  ClipboardList,
  UserCheck,
  UserX,
  RefreshCw,
  Clock,
} from "lucide-react";

import { getAllEmployees } from "../utils/redux/slices/employeeSlice";
import { getAllPods } from "../utils/redux/slices/podSlice";
import { getAllBrands } from "../utils/redux/slices/brandSlice";
import { getAllProcesses } from "../utils/redux/slices/processSlice";
import { getAllAllocations } from "../utils/redux/slices/allocationSlice";

// Sample activity data (no activity API exists yet)
const recentActivities = [
  {
    id: 1,
    title: "New employee added",
    description: "An employee was added to the employee list.",
    time: "Sample activity",
    icon: UserCheck,
    color: "text-green-600 bg-green-50",
  },
  {
    id: 2,
    title: "New allocation created",
    description: "An employee was allocated to a brand.",
    time: "Sample activity",
    icon: ClipboardList,
    color: "text-blue-600 bg-blue-50",
  },
  {
    id: 3,
    title: "Pod lead assigned",
    description: "A lead was assigned to a Pod.",
    time: "Sample activity",
    icon: Users,
    color: "text-purple-600 bg-purple-50",
  },
];

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>

        <div className={`rounded-lg p-2 ${color}`}>
          <Icon size={20} />
        </div>
      </div>

      <h2 className="mt-4 text-2xl font-semibold text-slate-900">{value}</h2>

      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

function PodDistribution({ pods, employees }) {
  const podCounts = pods.map((pod) => {
    const employeeCount = employees.filter((employee) => {
      const employeePodId = employee.podId?._id || employee.podId;

      return employeePodId?.toString() === pod._id?.toString();
    }).length;

    return {
      id: pod._id,
      name: pod.name,
      employees: employeeCount,
    };
  });

  const maxEmployees = Math.max(...podCounts.map((pod) => pod.employees), 1);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-6">
        <h3 className="font-semibold text-slate-900">Pod Distribution</h3>

        <p className="mt-1 text-sm text-slate-500">
          Employee distribution across Pods
        </p>
      </div>

      {podCounts.length === 0 ? (
        <p className="text-sm text-slate-500">No Pods available.</p>
      ) : (
        <div className="space-y-5">
          {podCounts.map((pod) => (
            <div key={pod.id}>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-slate-700">{pod.name}</span>

                <span className="text-slate-500">
                  {pod.employees} employees
                </span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{
                    width: `${(pod.employees / maxEmployees) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AllocationOverview({ allocations }) {
  const total = allocations.length;

  const active = allocations.filter(
    (allocation) => allocation.isActive === true,
  ).length;

  const inactive = total - active;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold text-slate-900">Allocation Overview</h3>

      <p className="mt-1 text-sm text-slate-500">
        Employee-to-brand and process allocations
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-green-50 p-4">
          <div className="flex items-center gap-2 text-green-700">
            <UserCheck size={18} />
            <span className="text-sm font-medium">Active</span>
          </div>

          <p className="mt-2 text-2xl font-semibold text-green-700">{active}</p>
        </div>

        <div className="rounded-lg bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-700">
            <UserX size={18} />
            <span className="text-sm font-medium">Inactive</span>
          </div>

          <p className="mt-2 text-2xl font-semibold text-red-700">{inactive}</p>
        </div>
      </div>

      <div className="mt-5 flex justify-between border-t border-slate-100 pt-4 text-sm">
        <span className="text-slate-500">Total allocations</span>

        <span className="font-semibold text-slate-900">{total}</span>
      </div>
    </div>
  );
}

function RecentActivity() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-5">
        <h3 className="font-semibold text-slate-900">Recent Activity</h3>

        <p className="mt-1 text-sm text-slate-500">
          Illustrative sample activities
        </p>
      </div>

      <div className="space-y-5">
        {recentActivities.map((activity) => {
          const Icon = activity.icon;

          return (
            <div key={activity.id} className="flex gap-3">
              <div className={`h-fit rounded-lg p-2 ${activity.color}`}>
                <Icon size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800">
                  {activity.title}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {activity.description}
                </p>

                <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                  <Clock size={12} />
                  {activity.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const dispatch = useDispatch();

  // Get data from Redux store
  const {
    employees,
    loading: employeeLoading,
    error: employeeError,
  } = useSelector((state) => state.employees);

  const {
    pods,
    loading: podLoading,
    error: podError,
  } = useSelector((state) => state.pods);

  const {
    brands,
    loading: brandLoading,
    error: brandError,
  } = useSelector((state) => state.brands);

  const {
    processes,
    loading: processLoading,
    error: processError,
  } = useSelector((state) => state.processes);

  const {
    allocations,
    loading: allocationLoading,
    error: allocationError,
  } = useSelector((state) => state.allocations);

  // Fetch all dashboard data
  const fetchDashboardData = () => {
    dispatch(getAllEmployees());
    dispatch(getAllPods());
    dispatch(getAllBrands());
    dispatch(getAllProcesses());
    dispatch(getAllAllocations());
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dispatch]);

  // Loading state
  const loading =
    employeeLoading ||
    podLoading ||
    brandLoading ||
    processLoading ||
    allocationLoading;

  // Error state
  const error =
    employeeError || podError || brandError || processError || allocationError;

  // Calculate statistics
  const activeEmployees = employees.filter(
    (employee) => employee.status === "ACTIVE",
  ).length;

  const inactiveEmployees = employees.length - activeEmployees;

  const activePods = pods.filter((pod) => pod.status === "ACTIVE").length;

  const activeBrands = brands.filter(
    (brand) => brand.status === "ACTIVE",
  ).length;

  const activeProcesses = processes.filter(
    (process) => process.status === "ACTIVE",
  ).length;

  const activeAllocations = allocations.filter(
    (allocation) => allocation.isActive === true,
  ).length;

  // const inactiveAllocations = allocations.length - activeAllocations;

  if (loading) {
    return (
      <div className="flex min-h-60 items-center justify-center">
        <div className="text-center">
          <RefreshCw size={28} className="mx-auto animate-spin text-blue-600" />

          <p className="mt-3 text-sm text-slate-500">
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-semibold text-red-700">
          Failed to load dashboard data
        </h2>

        <p className="mt-2 text-sm text-red-600">{error}</p>

        <button
          onClick={fetchDashboardData}
          className="mt-4 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>

          <p className="mt-1 text-sm text-slate-500">
            Overview of your workforce and allocation management.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Main Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={employees.length}
          subtitle={`${activeEmployees} active employees`}
          icon={Users}
          color="bg-blue-50 text-blue-600"
        />

        <StatCard
          title="Total Pods"
          value={pods.length}
          subtitle={`${activePods} active Pods`}
          icon={Building2}
          color="bg-purple-50 text-purple-600"
        />

        <StatCard
          title="Total Brands"
          value={brands.length}
          subtitle={`${activeBrands} active Brands`}
          icon={BriefcaseBusiness}
          color="bg-orange-50 text-orange-600"
        />

        <StatCard
          title="Total Processes"
          value={processes.length}
          subtitle={`${activeProcesses} active Processes`}
          icon={Workflow}
          color="bg-green-50 text-green-600"
        />
      </div>

      {/* Secondary Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          title="Active Employees"
          value={activeEmployees}
          subtitle={`${inactiveEmployees} inactive employees`}
          icon={UserCheck}
          color="bg-green-50 text-green-600"
        />

        <StatCard
          title="Total Allocations"
          value={allocations.length}
          subtitle={`${activeAllocations} active allocations`}
          icon={ClipboardList}
          color="bg-indigo-50 text-indigo-600"
        />
      </div>

      {/* Pod Distribution and Allocation Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PodDistribution pods={pods} employees={employees} />

        <AllocationOverview allocations={allocations} />
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
}
