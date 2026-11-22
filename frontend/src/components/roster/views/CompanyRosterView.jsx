import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { getMonthlyRoster } from "../../../utils/redux/slices/monthlyRosterSlice";

import { updateRosterEntry } from "../../../utils/redux/slices/rosterEntrySlice";

import RosterAssignmentsTable from "../RosterAssignmentsTable";
import RosterPagination from "../RosterPagination";
import RosterEntryForm from "../RosterEntryForm";

const CompanyRosterView = ({
  rosterId,
  roster,
  employees = [],
  brands = [],
  processes = [],
}) => {
  const dispatch = useDispatch();

  // ======================================================
  // REDUX STATE
  // ======================================================

  const { assignments, pagination, loading, error } = useSelector(
    (state) => state.monthlyRoster,
  );

  // ======================================================
  // LOCAL STATE
  // ======================================================

  const [selectedDate, setSelectedDate] = useState("");
  const [limit, setLimit] = useState(10);

  const [editingAssignment, setEditingAssignment] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  // ======================================================
  // FETCH COMPANY-WIDE ROSTER
  // ======================================================

  useEffect(() => {
    function CompanyRosterView() {
      if (!rosterId) return;

      dispatch(
        getMonthlyRoster({
          id: rosterId,
          page: 1,
          limit,
        }),
      );

      setSelectedDate("");
    }
    CompanyRosterView();
  }, [rosterId, dispatch, limit]);

  // ======================================================
  // FORMAT DATE
  // ======================================================

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });

  // ======================================================
  // ROSTER PERIOD
  // ======================================================

  const rosterPeriod = roster?.periodStart
    ? new Date(roster.periodStart).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : roster?.month
      ? `${new Date(roster.periodStart).toLocaleDateString("en-IN", {
          month: "long",
          timeZone: "UTC",
        })} ${roster.year}`
      : "Selected roster";

  // ======================================================
  // DATE FILTER
  // ======================================================

  const handleDateFilter = (value) => {
    setSelectedDate(value);

    if (!rosterId) return;

    dispatch(
      getMonthlyRoster({
        id: rosterId,
        date: value || undefined,
        page: 1,
        limit,
      }),
    );
  };

  // ======================================================
  // PAGINATION
  // ======================================================

  const handlePageChange = (page) => {
    if (!rosterId || page < 1) return;

    dispatch(
      getMonthlyRoster({
        id: rosterId,
        date: selectedDate || undefined,
        page,
        limit,
      }),
    );
  };

  // ======================================================
  // CHANGE PAGE LIMIT
  // ======================================================

  const handleLimitChange = (value) => {
    const newLimit = Number(value);

    setLimit(newLimit);

    if (!rosterId) return;

    dispatch(
      getMonthlyRoster({
        id: rosterId,
        date: selectedDate || undefined,
        page: 1,
        limit: newLimit,
      }),
    );
  };

  // ======================================================
  // EDIT ASSIGNMENT
  // ======================================================

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
  };

  const handleCloseEditModal = () => {
    setEditingAssignment(null);
  };

  // ======================================================
  // UPDATE ASSIGNMENT
  // ======================================================

  const handleUpdateAssignment = async (updatedData) => {
    if (!editingAssignment?._id) return;

    setUpdateLoading(true);

    try {
      await dispatch(
        updateRosterEntry({
          id: editingAssignment._id,
          updatedData,
        }),
      ).unwrap();

      setEditingAssignment(null);

      // Refresh the current company-wide page
      dispatch(
        getMonthlyRoster({
          id: rosterId,
          date: selectedDate || undefined,
          page: pagination?.page || 1,
          limit,
        }),
      );
    } catch (error) {
      console.error("Failed to update roster assignment:", error);
    } finally {
      setUpdateLoading(false);
    }
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#E2E8F0] p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-semibold text-[#0F172A]">
            Company-wide Roster
          </h2>

          <p className="mt-1 text-sm text-[#64748B]">
            {roster
              ? rosterPeriod
              : "Select an existing roster or generate a new one."}
          </p>
        </div>

        {/* DATE FILTER */}
        <div className="w-full sm:w-52">
          <input
            type="date"
            value={selectedDate}
            min={roster?.periodStart?.slice(0, 10)}
            max={roster?.periodEnd?.slice(0, 10)}
            disabled={!rosterId}
            onChange={(e) => handleDateFilter(e.target.value)}
            className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm text-[#334155] outline-none focus:border-[#2563EB] disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="m-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* CONTENT */}
      {loading ? (
        <div className="p-10 text-center text-sm text-[#64748B]">
          Loading roster assignments...
        </div>
      ) : !rosterId ? (
        <div className="p-10 text-center">
          <p className="text-sm text-[#64748B]">
            Select an existing roster or generate a new one.
          </p>
        </div>
      ) : assignments?.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-sm font-medium text-[#334155]">
            No roster assignments found.
          </p>

          <p className="mt-1 text-sm text-[#94A3B8]">
            There are no assignments for this selection.
          </p>
        </div>
      ) : (
        <RosterAssignmentsTable
          assignments={assignments}
          formatDate={formatDate}
          onEdit={handleEditAssignment}
        />
      )}

      {/* PAGINATION */}
      {!loading && pagination?.totalRecords > 0 && (
        <RosterPagination
          pagination={pagination}
          limit={limit}
          loading={loading}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      )}

      {/* EDIT MODAL */}
      <RosterEntryForm
        isOpen={Boolean(editingAssignment)}
        assignment={editingAssignment}
        employees={employees}
        brands={brands}
        processes={processes}
        onClose={handleCloseEditModal}
        onSubmit={handleUpdateAssignment}
        loading={updateLoading}
      />
    </div>
  );
};

export default CompanyRosterView;
