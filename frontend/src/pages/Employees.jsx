import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  Search,
  Pencil,
  Ban,
  RefreshCw,
  LoaderCircle,
} from "lucide-react";

import Modal from "../components/common/Modal";
import EmployeeForm from "../components/employee/EmployeeForm";
import SummaryCard from "../components/common/SummaryCard";
import StatusBadge from "../components/common/StatusBadge";

import {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  assignEmployeeToPod,
} from "../utils/redux/slices/employeeSlice";

import { getAllPods } from "../utils/redux/slices/podSlice";

// Get Pod ID whether podId is populated or not
const getPodId = (podId) => {
  if (!podId) return "";
  return typeof podId === "object" ? podId._id : podId;
};

// Get employee initials
const getInitials = (firstName, lastName) => {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
};

const Employees = () => {
  const dispatch = useDispatch();

  const { employees, loading, error, mutationLoading, mutationError } =
    useSelector((state) => state.employees);

  const { pods } = useSelector((state) => state.pods);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [podFilter, setPodFilter] = useState("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeToDeactivate, setEmployeeToDeactivate] = useState(null);

  const [actionError, setActionError] = useState("");

  // Fetch employees and Pods when page loads
  const fetchPageData = useCallback(() => {
    dispatch(getAllEmployees());
    dispatch(getAllPods());
  }, [dispatch]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  // Summary counts
  const totalEmployees = employees.length;

  const activeEmployees = employees.filter(
    (employee) => employee.status === "ACTIVE",
  ).length;

  const inactiveEmployees = employees.filter(
    (employee) => employee.status === "INACTIVE",
  ).length;

  // Search and filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const fullName =
        `${employee.firstName} ${employee.lastName}`.toLowerCase();

      const search = searchTerm.toLowerCase();

      const matchesSearch =
        fullName.includes(search) ||
        employee.email?.toLowerCase().includes(search) ||
        employee.employeeCode?.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "ALL" || employee.status === statusFilter;

      const matchesPod =
        podFilter === "ALL" || getPodId(employee.podId) === podFilter;

      return matchesSearch && matchesStatus && matchesPod;
    });
  }, [employees, searchTerm, statusFilter, podFilter]);

  // Open Add modal
  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setActionError("");
    setIsModalOpen(true);
  };

  // Open Edit modal
  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setActionError("");
    setIsModalOpen(true);
  };

  // Close Add/Edit modal
  const handleCloseModal = () => {
    if (mutationLoading) return;

    setIsModalOpen(false);
    setSelectedEmployee(null);
    setActionError("");
  };

  // Create or update employee
  const handleEmployeeSubmit = async (formData) => {
    setActionError("");

    try {
      const { podId, ...employeeData } = formData;

      if (selectedEmployee) {
        // Update employee details
        await dispatch(
          updateEmployee({
            employeeId: selectedEmployee._id,
            employeeData,
          }),
        ).unwrap();

        // Update Pod assignment only when it has changed
        if (getPodId(selectedEmployee.podId) !== (podId || "")) {
          await dispatch(
            assignEmployeeToPod({
              employeeId: selectedEmployee._id,
              podId: podId || null,
            }),
          ).unwrap();
        }
      } else {
        // Create employee first
        const createdEmployee = await dispatch(
          createEmployee(employeeData),
        ).unwrap();

        // Assign Pod if one was selected
        if (podId) {
          await dispatch(
            assignEmployeeToPod({
              employeeId: createdEmployee._id,
              podId,
            }),
          ).unwrap();
        }
      }

      setIsModalOpen(false);
      setSelectedEmployee(null);
    } catch (error) {
      setActionError(
        typeof error === "string"
          ? error
          : "Something went wrong. Please try again.",
      );
    }
  };

  // Deactivate employee
  const handleDeactivateEmployee = async () => {
    if (!employeeToDeactivate) return;

    setActionError("");

    try {
      await dispatch(
        updateEmployee({
          employeeId: employeeToDeactivate._id,
          employeeData: { status: "INACTIVE" },
        }),
      ).unwrap();

      setEmployeeToDeactivate(null);
    } catch (error) {
      setActionError(
        typeof error === "string" ? error : "Failed to deactivate employee.",
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Employees</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage employees and their Pod assignments.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddEmployee}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Employee
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          title="Total Employees"
          count={totalEmployees}
          icon={Users}
          color="blue"
        />

        <SummaryCard
          title="Active Employees"
          count={activeEmployees}
          icon={UserCheck}
          color="green"
        />

        <SummaryCard
          title="Inactive Employees"
          count={inactiveEmployees}
          icon={UserX}
          color="red"
        />
      </div>

      {/* Employee table container */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Search and filters */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, email or employee code"
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <select
              value={podFilter}
              onChange={(event) => setPodFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="ALL">All Pods</option>
              {pods.map((pod) => (
                <option key={pod._id} value={pod._id}>
                  {pod.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={fetchPageData}
              title="Refresh employees"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              <span className="sm:hidden">Refresh</span>
            </button>
          </div>
        </div>

        {/* API error */}
        {error && (
          <div className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Employee table */}
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500">
            <LoaderCircle size={20} className="animate-spin" />
            Loading employees...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
            <Users size={36} className="text-slate-300" />

            <h3 className="mt-3 font-medium text-slate-800">
              No employees found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {employees.length === 0
                ? "Add your first employee to get started."
                : "Try changing your search or filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-212.5 text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Employee Code</th>
                  <th className="px-5 py-3">Pod</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((employee) => (
                  <tr
                    key={employee._id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                          {getInitials(employee.firstName, employee.lastName)}
                        </div>

                        <div>
                          <p className="font-medium text-slate-900">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="mt-0.5 text-sm text-slate-500">
                            {employee.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {employee.employeeCode}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {typeof employee.podId === "object"
                        ? employee.podId?.name || "Not assigned"
                        : pods.find((pod) => pod._id === employee.podId)
                            ?.name || "Not assigned"}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={employee.status} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditEmployee(employee)}
                          title="Edit employee"
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil size={17} />
                        </button>

                        {employee.status === "ACTIVE" && (
                          <button
                            type="button"
                            onClick={() => setEmployeeToDeactivate(employee)}
                            title="Deactivate employee"
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Ban size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table footer */}
        {!loading && employees.length > 0 && (
          <div className="border-t border-slate-200 px-5 py-3 text-sm text-slate-500">
            Showing {filteredEmployees.length} of {employees.length} employees
          </div>
        )}
      </div>

      {/* Add / Edit Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedEmployee ? "Edit Employee" : "Add Employee"}
        description={
          selectedEmployee
            ? "Update employee information and Pod assignment."
            : "Enter employee details to add a new employee."
        }
        size="md"
      >
        {actionError && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {mutationError && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {mutationError}
          </div>
        )}

        <EmployeeForm
          employee={selectedEmployee}
          pods={pods.filter((pod) => pod.status === "ACTIVE")}
          onSubmit={handleEmployeeSubmit}
          onCancel={handleCloseModal}
          loading={mutationLoading}
        />
      </Modal>

      {/* Deactivate Confirmation Modal */}
      <Modal
        isOpen={Boolean(employeeToDeactivate)}
        onClose={() => {
          if (!mutationLoading) setEmployeeToDeactivate(null);
        }}
        title="Deactivate Employee"
        description="Please confirm this action."
        size="sm"
      >
        {actionError && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {actionError}
          </div>
        )}

        <p className="text-sm leading-6 text-slate-600">
          Are you sure you want to deactivate{" "}
          <span className="font-semibold text-slate-900">
            {employeeToDeactivate?.firstName} {employeeToDeactivate?.lastName}
          </span>
          ? The employee record will be retained, but the employee will become
          inactive.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={mutationLoading}
            onClick={() => setEmployeeToDeactivate(null)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={mutationLoading}
            onClick={handleDeactivateEmployee}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {mutationLoading && (
              <LoaderCircle size={16} className="animate-spin" />
            )}
            Deactivate
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Employees;
