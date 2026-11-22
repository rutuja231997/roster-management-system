import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { getPodRoster } from "../../../utils/redux/slices/rosterViewSlice";

import RosterAssignmentsTable from "../RosterAssignmentsTable";
import RosterPagination from "../RosterPagination";
import RosterEntryForm from "../RosterEntryForm";

import { updateRosterEntry } from "../../../utils/redux/slices/rosterEntrySlice";

const PodRosterView = ({
  rosterId,
  podId,
  employees = [],
  brands = [],
  processes = [],
}) => {
  const dispatch = useDispatch();

  const { podRoster, podPagination, podLoading, podError } = useSelector(
    (state) => state.rosterView,
  );

  const [limit, setLimit] = useState(10);

  // Selected assignment for editing
  const [editingAssignment, setEditingAssignment] = useState(null);

  // Update loading state
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    if (!rosterId || !podId) return;

    dispatch(
      getPodRoster({
        rosterId,
        podId,
        page: 1,
        limit,
      }),
    );
  }, [dispatch, rosterId, podId, limit]);

  const handlePageChange = (page) => {
    dispatch(
      getPodRoster({
        rosterId,
        podId,
        page,
        limit,
      }),
    );
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
  };

  // Open edit modal
  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
  };

  // Close edit modal
  const handleCloseEditModal = () => {
    if (updateLoading) return;

    setEditingAssignment(null);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Update assignment
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

      // Close modal after successful update
      setEditingAssignment(null);

      // Refresh current Pod roster
      dispatch(
        getPodRoster({
          rosterId,
          podId,
          page: podPagination?.page || 1,
          limit,
        }),
      );
    } catch (error) {
      // Error handling/toast is handled by Redux thunk
      console.error("Failed to update roster assignment:", error);
    } finally {
      setUpdateLoading(false);
    }
  };

  if (!podId) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
        Select a Pod to view its roster.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Pod-wise Roster
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {podRoster?.pod?.name || "Selected Pod"}
          </p>

          {podRoster && (
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
              <span>
                Employees: <strong>{podRoster.totalEmployees}</strong>
              </span>

              <span>
                Total Assignments: <strong>{podRoster.totalAssignments}</strong>
              </span>
            </div>
          )}
        </div>

        {podLoading ? (
          <div className="p-8 text-center text-gray-500">
            Loading Pod roster...
          </div>
        ) : podError ? (
          <div className="p-8 text-center text-red-500">{podError}</div>
        ) : (
          <>
            <RosterAssignmentsTable
              assignments={podRoster?.assignments || []}
              formatDate={formatDate}
              onEdit={handleEditAssignment}
            />

            {podRoster?.assignments?.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No roster assignments found.
              </div>
            )}

            <RosterPagination
              pagination={podPagination}
              limit={limit}
              loading={podLoading}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          </>
        )}
      </div>

      {/* Edit Assignment Modal */}
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
    </>
  );
};

export default PodRosterView;
