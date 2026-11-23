import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus,
  Search,
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Pencil,
  Eye,
  Check,
  X,
} from "lucide-react";

import Modal from "../common/Modal";
import SummaryCard from "../common/SummaryCard";
import StatusBadge from "../common/StatusBadge";
import AvailabilityForm from "./AvailabilityForm";

import {
  fetchAvailability,
  createAvailability,
  updateAvailability,
  reviewAvailability,
} from "../../utils/redux/slices/availabilitySlice";

import { getAllEmployees } from "../../utils/redux/slices/employeeSlice";

const AvailabilityManagement = () => {
  const dispatch = useDispatch();

  const {
    availabilityRecords,
    loading,
    error,
    mutationLoading,
    mutationError,
  } = useSelector((state) => state.availability);

  const { employees } = useSelector((state) => state.employees);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState(null);

  const [viewRecord, setViewRecord] = useState(null);

  useEffect(() => {
    dispatch(fetchAvailability());
    dispatch(getAllEmployees());
  }, [dispatch]);

  // ============================================
  // Refresh
  // ============================================
  const handleRefresh = () => {
    dispatch(fetchAvailability());
  };

  // ============================================
  // Modal
  // ============================================
  const handleAddAvailability = () => {
    setSelectedAvailability(null);
    setIsModalOpen(true);
  };

  const handleEditAvailability = (availability) => {
    setSelectedAvailability(availability);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAvailability(null);
  };

  // ============================================
  // Create / Update
  // ============================================
  const handleSubmit = async (formData) => {
    try {
      if (selectedAvailability) {
        await dispatch(
          updateAvailability({
            id: selectedAvailability._id,
            data: formData,
          }),
        ).unwrap();
      } else {
        await dispatch(createAvailability(formData)).unwrap();
      }

      handleCloseModal();
      dispatch(fetchAvailability());
    } catch (error) {
      console.error("Availability operation failed:", error);
    }
  };

  // ============================================
  // Approve / Reject
  // ============================================
  const handleReview = async (id, status) => {
    try {
      await dispatch(
        reviewAvailability({
          id,
          status,
        }),
      ).unwrap();

      dispatch(fetchAvailability());
    } catch (error) {
      console.error("Availability review failed:", error);
    }
  };

  // ============================================
  // Statistics
  // ============================================
  const totalRecords = availabilityRecords.length;

  const pendingRecords = availabilityRecords.filter(
    (record) => record.status === "PENDING",
  ).length;

  const approvedRecords = availabilityRecords.filter(
    (record) => record.status === "APPROVED",
  ).length;

  const rejectedRecords = availabilityRecords.filter(
    (record) => record.status === "REJECTED",
  ).length;

  // ============================================
  // Search & Filter
  // ============================================
  const filteredRecords = useMemo(() => {
    return availabilityRecords.filter((record) => {
      const employee = record.employeeId;

      const employeeName = employee
        ? `${employee.firstName || ""} ${employee.lastName || ""}`
        : "";

      const employeeCode = employee?.employeeCode || "";

      const matchesSearch =
        employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.reason?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || record.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [availabilityRecords, searchTerm, statusFilter]);

  // ============================================
  // Date Formatting
  // ============================================
  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ============================================
  // Availability Type Formatting
  // ============================================
  const formatType = (type) => {
    if (!type) return "-";

    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // ============================================
  // Employee Name
  // ============================================
  const getEmployeeName = (employee) => {
    if (!employee) return "Unknown Employee";

    return `${employee.firstName || ""} ${employee.lastName || ""}`.trim();
  };

  return (
    <div className="space-y-6">
      {/* ========================================
          Header
      ======================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">
            Availability Management
          </h1>

          <p className="text-gray-500 mt-1">
            Manage employee leave and availability requests.
          </p>
        </div>

        <button
          onClick={handleAddAvailability}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Create Request
        </button>
      </div>

      {/* ========================================
          Summary Cards
      ======================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Requests"
          count={totalRecords}
          icon={CalendarDays}
          color="blue"
        />

        <SummaryCard
          title="Pending Requests"
          count={pendingRecords}
          icon={Clock}
          color="yellow"
        />

        <SummaryCard
          title="Approved Requests"
          count={approvedRecords}
          icon={CheckCircle}
          color="green"
        />

        <SummaryCard
          title="Rejected Requests"
          count={rejectedRecords}
          icon={XCircle}
          color="red"
        />
      </div>

      {/* ========================================
          Main Table
      ======================================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search employee, code, type or reason..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 text-red-600 border-b border-red-100">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && availabilityRecords.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3" />
            Loading availability records...
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Type
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <tr
                      key={record._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Employee */}
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">
                          {getEmployeeName(record.employeeId)}
                        </div>

                        <div className="text-sm text-gray-500">
                          {record.employeeId?.employeeCode || "-"}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-4 text-gray-700">
                        {formatType(record.type)}
                      </td>

                      {/* Start Date */}
                      <td className="px-5 py-4 text-gray-700 whitespace-nowrap">
                        {formatDate(record.startDate)}
                      </td>

                      {/* End Date */}
                      <td className="px-5 py-4 text-gray-700 whitespace-nowrap">
                        {formatDate(record.endDate)}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <StatusBadge status={record.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {/* View */}
                          <button
                            onClick={() => setViewRecord(record)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye size={17} />
                          </button>

                          {/* Edit */}
                          {record.status === "PENDING" && (
                            <button
                              onClick={() => handleEditAvailability(record)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit request"
                            >
                              <Pencil size={17} />
                            </button>
                          )}

                          {/* Approve */}
                          {record.status === "PENDING" && (
                            <button
                              onClick={() =>
                                handleReview(record._id, "APPROVED")
                              }
                              disabled={mutationLoading}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Approve request"
                            >
                              <Check size={17} />
                            </button>
                          )}

                          {/* Reject */}
                          {record.status === "PENDING" && (
                            <button
                              onClick={() =>
                                handleReview(record._id, "REJECTED")
                              }
                              disabled={mutationLoading}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Reject request"
                            >
                              <X size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-gray-500"
                    >
                      {searchTerm || statusFilter !== "ALL"
                        ? "No availability records match your search."
                        : "No availability requests found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================
          Create / Edit Modal
      ======================================== */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          selectedAvailability
            ? "Edit Availability Request"
            : "Create Availability Request"
        }
      >
        <div className="space-y-4">
          {mutationError && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {mutationError}
            </div>
          )}

          <AvailabilityForm
            availability={selectedAvailability}
            employees={employees}
            onSubmit={handleSubmit}
            onCancel={handleCloseModal}
            loading={mutationLoading}
          />
        </div>
      </Modal>

      {/* ========================================
          View Details Modal
      ======================================== */}
      <Modal
        isOpen={!!viewRecord}
        onClose={() => setViewRecord(null)}
        title="Availability Details"
      >
        {viewRecord && (
          <div className="space-y-5">
            {/* Employee */}
            <div>
              <p className="text-sm text-gray-500">Employee</p>
              <p className="font-medium text-gray-900 mt-1">
                {getEmployeeName(viewRecord.employeeId)}
              </p>
              <p className="text-sm text-gray-500">
                {viewRecord.employeeId?.employeeCode}
              </p>
            </div>

            {/* Type */}
            <div>
              <p className="text-sm text-gray-500">Availability Type</p>
              <p className="font-medium text-gray-900 mt-1">
                {formatType(viewRecord.type)}
              </p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium text-gray-900 mt-1">
                  {formatDate(viewRecord.startDate)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">End Date</p>
                <p className="font-medium text-gray-900 mt-1">
                  {formatDate(viewRecord.endDate)}
                </p>
              </div>
            </div>

            {/* Status */}
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <div className="mt-2">
                <StatusBadge status={viewRecord.status} />
              </div>
            </div>

            {/* Reason */}
            <div>
              <p className="text-sm text-gray-500">Reason</p>
              <p className="font-medium text-gray-900 mt-1">
                {viewRecord.reason || "No reason provided"}
              </p>
            </div>

            {/* Review Information */}
            {viewRecord.reviewedBy && (
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500">Reviewed By</p>

                <p className="font-medium text-gray-900 mt-1">
                  {viewRecord.reviewedBy.firstName}{" "}
                  {viewRecord.reviewedBy.lastName}
                </p>

                {viewRecord.reviewedAt && (
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(viewRecord.reviewedAt)}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={() => setViewRecord(null)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AvailabilityManagement;
