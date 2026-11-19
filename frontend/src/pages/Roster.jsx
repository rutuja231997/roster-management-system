import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  generateMonthlyRoster,
  getMonthlyRoster,
  getAllRosters,
  clearMonthlyRosterError,
} from "../utils/redux/slices/monthlyRosterSlice";

import { CalendarDays, ClipboardList, AlertTriangle } from "lucide-react";

import SummaryCard from "../components/common/SummaryCard";

const Roster = () => {
  const dispatch = useDispatch();

  const {
    roster,
    rosters,
    summary,
    assignments,
    pagination,
    loading,
    rostersLoading,
    error,
    generating,
    generationError,
  } = useSelector((state) => state.monthlyRoster);

  const currentDate = new Date();

  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [selectedDate, setSelectedDate] = useState("");
  const [limit, setLimit] = useState(10);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Fetch all existing rosters when the page loads
  useEffect(() => {
    dispatch(getAllRosters());
  }, [dispatch]);

  // Automatically load the latest roster if none is selected
  useEffect(() => {
    if (rosters.length > 0 && !roster?._id) {
      dispatch(
        getMonthlyRoster({
          id: rosters[0]._id,
          page: 1,
          limit,
        }),
      );
    }
  }, [rosters, roster?._id, dispatch, limit]);

  // Generate a new monthly roster
  const handleGenerateRoster = async () => {
    dispatch(clearMonthlyRosterError());

    const result = await dispatch(
      generateMonthlyRoster({
        month: Number(month),
        year: Number(year),
      }),
    );

    if (generateMonthlyRoster.fulfilled.match(result)) {
      setSelectedDate("");

      // Refresh existing roster list
      await dispatch(getAllRosters());

      // Fetch newly generated roster
      await dispatch(
        getMonthlyRoster({
          id: result.payload.rosterId,
          page: 1,
          limit,
        }),
      );
    }
  };

  // Select an existing roster
  const handleRosterChange = (id) => {
    setSelectedDate("");

    if (id) {
      dispatch(
        getMonthlyRoster({
          id,
          page: 1,
          limit,
        }),
      );
    }
  };

  // Filter assignments by date
  const handleDateFilter = (value) => {
    setSelectedDate(value);

    if (roster?._id) {
      dispatch(
        getMonthlyRoster({
          id: roster._id,
          date: value || undefined,
          page: 1,
          limit,
        }),
      );
    }
  };

  // Change pagination page
  const handlePageChange = (page) => {
    if (!roster?._id || page < 1) return;

    dispatch(
      getMonthlyRoster({
        id: roster._id,
        date: selectedDate || undefined,
        page,
        limit,
      }),
    );
  };

  // Change records per page
  const handleLimitChange = (value) => {
    const newLimit = Number(value);

    setLimit(newLimit);

    if (roster?._id) {
      dispatch(
        getMonthlyRoster({
          id: roster._id,
          date: selectedDate || undefined,
          page: 1,
          limit: newLimit,
        }),
      );
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });

  // Display selected roster's month and year
  const rosterPeriod = roster?.periodStart
    ? new Date(roster.periodStart).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : roster?.month
      ? `${months[roster.month - 1]} ${roster.year}`
      : "Select a roster";

  // Calculate displayed record range
  const startRecord =
    pagination?.totalRecords > 0
      ? (pagination.currentPage - 1) * pagination.limit + 1
      : 0;

  const endRecord = Math.min(
    pagination?.currentPage * pagination?.limit || 0,
    pagination?.totalRecords || 0,
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-[#0F172A]">
              Monthly Roster
            </h1>

            <p className="mt-1 text-sm text-[#64748B]">
              Generate and manage monthly employee schedules.
            </p>
          </div>

          <button
            onClick={handleGenerateRoster}
            disabled={generating}
            className="rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? "Generating..." : "Generate Roster"}
          </button>
        </div>

        {/* Roster Period and Existing Rosters */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-[#0F172A]">
            Roster Period
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Month */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[#334155]">
                Month
              </label>

              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
              >
                {months.map((item, index) => (
                  <option key={item} value={index + 1}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[#334155]">
                Year
              </label>

              <input
                type="number"
                min="2020"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
              />
            </div>

            {/* Existing Rosters */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[#334155]">
                Existing Rosters
              </label>

              <select
                value={roster?._id || ""}
                onChange={(e) => handleRosterChange(e.target.value)}
                disabled={rostersLoading}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] disabled:bg-slate-50"
              >
                <option value="">
                  {rostersLoading ? "Loading rosters..." : "Select a roster"}
                </option>

                {rosters.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Generation Error */}
        {generationError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {generationError}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Total Days"
            count={summary?.totalDays ?? 0}
            icon={CalendarDays}
            color="bg-blue-50 text-blue-600"
          />

          <SummaryCard
            title="Total Assignments"
            count={summary?.totalAssignments ?? 0}
            icon={ClipboardList}
            color="bg-green-50 text-green-600"
          />

          <SummaryCard
            title="Total Conflicts"
            count={summary?.totalConflicts ?? 0}
            icon={AlertTriangle}
            color="bg-red-50 text-red-600"
          />
        </div>

        {/* Roster Assignments */}
        <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
          {/* Table Header */}
          <div className="flex flex-col justify-between gap-4 border-b border-[#E2E8F0] p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-semibold text-[#0F172A]">
                Roster Assignments
              </h2>

              <p className="mt-1 text-sm text-[#64748B]">
                {roster
                  ? rosterPeriod
                  : "Select an existing roster or generate a new one."}
              </p>
            </div>

            {/* Date Filter */}
            <div className="w-full sm:w-52">
              <input
                type="date"
                value={selectedDate}
                min={
                  roster?.periodStart
                    ? roster.periodStart.slice(0, 10)
                    : undefined
                }
                max={
                  roster?.periodEnd ? roster.periodEnd.slice(0, 10) : undefined
                }
                disabled={!roster?._id}
                onChange={(e) => handleDateFilter(e.target.value)}
                className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm text-[#334155] outline-none focus:border-[#2563EB] disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>
          </div>

          {/* Fetch Error */}
          {error && (
            <div className="m-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="p-10 text-center text-sm text-[#64748B]">
              Loading roster assignments...
            </div>
          ) : assignments.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-[#334155]">
                No roster assignments found.
              </p>

              <p className="mt-1 text-sm text-[#94A3B8]">
                {roster
                  ? "There are no assignments for this selection."
                  : "Select an existing roster or generate a new one."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-187.5 text-left text-sm">
                <thead className="bg-[#F8FAFC] text-xs uppercase text-[#64748B]">
                  <tr>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Employee</th>
                    <th className="px-5 py-3 font-medium">Employee Code</th>
                    <th className="px-5 py-3 font-medium">Brand</th>
                    <th className="px-5 py-3 font-medium">Process</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E2E8F0]">
                  {assignments.map((assignment) => (
                    <tr
                      key={assignment._id}
                      className="transition hover:bg-[#F8FAFC]"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-[#475569]">
                        {formatDate(assignment.date)}
                      </td>

                      <td className="px-5 py-4 font-medium text-[#0F172A]">
                        {assignment.employeeId?.firstName}{" "}
                        {assignment.employeeId?.lastName}
                      </td>

                      <td className="px-5 py-4 text-[#64748B]">
                        {assignment.employeeId?.employeeCode}
                      </td>

                      <td className="px-5 py-4 text-[#334155]">
                        {assignment.brandId?.name}
                      </td>

                      <td className="px-5 py-4 text-[#334155]">
                        {assignment.processId?.name}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            assignment.status === "SCHEDULED"
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {assignment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination?.totalRecords > 0 && (
            <div className="flex flex-col justify-between gap-4 border-t border-[#E2E8F0] p-4 sm:flex-row sm:items-center">
              {/* Records Information */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <p className="text-sm text-[#64748B]">
                  Showing{" "}
                  <span className="font-medium text-[#0F172A]">
                    {startRecord}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-[#0F172A]">
                    {endRecord}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-[#0F172A]">
                    {pagination.totalRecords}
                  </span>{" "}
                  assignments
                </p>

                {/* Page Size */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-[#64748B]">Rows:</label>

                  <select
                    value={limit}
                    onChange={(e) => handleLimitChange(e.target.value)}
                    className="rounded-lg border border-[#E2E8F0] bg-white px-2 py-1.5 text-sm text-[#334155] outline-none focus:border-[#2563EB]"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPreviousPage || loading}
                  className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#334155] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="whitespace-nowrap text-sm text-[#64748B]">
                  Page{" "}
                  <span className="font-medium text-[#0F172A]">
                    {pagination.currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-[#0F172A]">
                    {pagination.totalPages}
                  </span>
                </span>

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage || loading}
                  className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#334155] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Roster;
