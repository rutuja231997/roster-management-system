import { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllAllocations,
  createAllocation,
  updateAllocation,
} from "../utils/redux/slices/allocationSlice";

import {
  Plus,
  Pencil,
  Layers,
  CheckCircle,
  XCircle,
  Search,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import Modal from "../components/common/Modal";
import SummaryCard from "../components/common/SummaryCard";
import StatusBadge from "../components/common/StatusBadge";
import AllocationForm from "../components/allocation/AllocationForm";

import { getAllEmployees } from "../utils/redux/slices/employeeSlice";
import { getAllBrands } from "../utils/redux/slices/brandSlice";
import { getAllProcesses } from "../utils/redux/slices/processSlice";

const Allocations = () => {
  const dispatch = useDispatch();

  const { allocations, loading, error, mutationLoading, mutationError } =
    useSelector((state) => state.allocations);

  const { employees } = useSelector((state) => state.employees);
  const { brands } = useSelector((state) => state.brands);
  const { processes } = useSelector((state) => state.processes);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [actionError, setActionError] = useState("");

  // Fetch allocations and related data
  const fetchPageData = useCallback(() => {
    dispatch(getAllAllocations());
    dispatch(getAllEmployees());
    dispatch(getAllBrands());
    dispatch(getAllProcesses());
  }, [dispatch]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  // Summary counts
  const totalAllocations = allocations.length;

  const activeAllocations = allocations.filter(
    (allocation) => allocation.isActive,
  ).length;

  const inactiveAllocations = allocations.filter(
    (allocation) => !allocation.isActive,
  ).length;

  // Search and filter allocations
  const filteredAllocations = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return allocations.filter((allocation) => {
      const employee = allocation.employeeId || {};
      const brand = allocation.brandId || {};
      const process = allocation.processId || {};
      const pod = employee.podId || {};

      const employeeName =
        `${employee.firstName || ""} ${employee.lastName || ""}`.toLowerCase();

      const matchesSearch =
        employeeName.includes(search) ||
        (employee.email || "").toLowerCase().includes(search) ||
        (employee.employeeCode || "").toLowerCase().includes(search) ||
        (brand.name || "").toLowerCase().includes(search) ||
        (process.name || "").toLowerCase().includes(search) ||
        (pod.name || "").toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && allocation.isActive) ||
        (statusFilter === "INACTIVE" && !allocation.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [allocations, searchTerm, statusFilter]);

  // Open Add modal
  const handleAddAllocation = () => {
    setSelectedAllocation(null);
    setActionError("");
    setIsModalOpen(true);
  };

  // Open Edit modal
  const handleEditAllocation = (allocation) => {
    setSelectedAllocation(allocation);
    setActionError("");
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    if (mutationLoading) return;

    setIsModalOpen(false);
    setSelectedAllocation(null);
    setActionError("");
  };

  // Create or update allocation
  const handleAllocationSubmit = async (formData) => {
    setActionError("");

    try {
      if (selectedAllocation) {
        await dispatch(
          updateAllocation({
            allocationId: selectedAllocation._id,
            allocationData: formData,
          }),
        ).unwrap();
      } else {
        await dispatch(createAllocation(formData)).unwrap();
      }

      setIsModalOpen(false);
      setSelectedAllocation(null);

      // Refresh allocations with populated employee, brand and process data
      dispatch(getAllAllocations());
    } catch (err) {
      setActionError(
        typeof err === "string"
          ? err
          : err?.message || "Unable to save allocation. Please try again.",
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Allocations</h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage employee assignments across brands and processes.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddAllocation}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Allocation
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          title="Total Allocations"
          count={totalAllocations}
          icon={Layers}
          color="blue"
        />

        <SummaryCard
          title="Active Allocations"
          count={activeAllocations}
          icon={CheckCircle}
          color="green"
        />

        <SummaryCard
          title="Inactive Allocations"
          count={inactiveAllocations}
          icon={XCircle}
          color="red"
        />
      </div>

      {/* Allocation table container */}
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
              placeholder="Search employee, brand, process or code"
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

            <button
              type="button"
              onClick={fetchPageData}
              title="Refresh allocations"
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

        {/* Allocation table */}
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500">
            <LoaderCircle size={20} className="animate-spin" />
            Loading allocations...
          </div>
        ) : filteredAllocations.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
            <Layers size={36} className="text-slate-300" />

            <h3 className="mt-3 font-medium text-slate-800">
              No allocations found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {allocations.length === 0
                ? "Add your first allocation to get started."
                : "Try changing your search or filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-225 text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Employee Code</th>
                  <th className="px-5 py-3">Pod</th>
                  <th className="px-5 py-3">Brand</th>
                  <th className="px-5 py-3">Process</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredAllocations.map((allocation) => (
                  <tr
                    key={allocation._id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {allocation.employeeId?.firstName
                          ? `${allocation.employeeId.firstName} ${allocation.employeeId.lastName}`
                          : "N/A"}
                      </p>

                      <p className="mt-0.5 text-sm text-slate-500">
                        {allocation.employeeId?.email || ""}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {allocation.employeeId?.employeeCode || "N/A"}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {allocation.employeeId?.podId?.name || "Not assigned"}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {allocation.brandId?.name || "N/A"}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {allocation.processId?.name || "N/A"}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge
                        status={allocation.isActive ? "ACTIVE" : "INACTIVE"}
                      />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleEditAllocation(allocation)}
                          title="Edit allocation"
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table footer */}
        {!loading && allocations.length > 0 && (
          <div className="border-t border-slate-200 px-5 py-3 text-sm text-slate-500">
            Showing {filteredAllocations.length} of {allocations.length}{" "}
            allocations
          </div>
        )}
      </div>

      {/* Add / Edit Allocation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedAllocation ? "Edit Allocation" : "Add Allocation"}
        description={
          selectedAllocation
            ? "Update employee, brand, process or allocation status."
            : "Select an employee, brand and process to create an allocation."
        }
        size="md"
      >
        {(actionError || mutationError) && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {actionError || mutationError}
          </div>
        )}

        <AllocationForm
          allocation={selectedAllocation}
          employees={employees}
          brands={brands}
          processes={processes}
          onSubmit={handleAllocationSubmit}
          onCancel={handleCloseModal}
          loading={mutationLoading}
        />
      </Modal>
    </div>
  );
};

export default Allocations;
