import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { getEmployeeRoster } from "../../../utils/redux/slices/rosterViewSlice";

import RosterAssignmentsTable from "../RosterAssignmentsTable";
import RosterPagination from "../RosterPagination";
import RosterEntryForm from "../RosterEntryForm";

import { updateRosterEntry } from "../../../utils/redux/slices/rosterEntrySlice";

const EmployeeRosterView = ({
  rosterId,
  employeeId,
  employees = [],
  brands = [],
  processes = [],
}) => {
  const dispatch = useDispatch();

  const { employeeRoster, employeePagination, employeeLoading, employeeError } =
    useSelector((state) => state.rosterView);

  const [limit, setLimit] = useState(10);

  // Selected assignment for editing
  const [editingAssignment, setEditingAssignment] = useState(null);

  // Update loading state
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    if (!rosterId || !employeeId) return;

    dispatch(
      getEmployeeRoster({
        rosterId,
        employeeId,
        page: 1,
        limit,
      }),
    );
  }, [dispatch, rosterId, employeeId, limit]);

  const handlePageChange = (page) => {
    dispatch(
      getEmployeeRoster({
        rosterId,
        employeeId,
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

      // Refresh current employee roster
      dispatch(
        getEmployeeRoster({
          rosterId,
          employeeId,
          page: employeePagination?.page || 1,
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

  if (!employeeId) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
        Select an Employee to view their roster.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Employee-wise Roster
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {employeeRoster?.employee
              ? `${employeeRoster.employee.firstName} ${employeeRoster.employee.lastName}`
              : "Selected Employee"}
          </p>

          {employeeRoster && (
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
              <span>
                Total Assignments:{" "}
                <strong>{employeeRoster.totalAssignments}</strong>
              </span>
            </div>
          )}
        </div>

        {employeeLoading ? (
          <div className="p-8 text-center text-gray-500">
            Loading Employee roster...
          </div>
        ) : employeeError ? (
          <div className="p-8 text-center text-red-500">{employeeError}</div>
        ) : (
          <>
            <RosterAssignmentsTable
              assignments={employeeRoster?.assignments || []}
              formatDate={formatDate}
              onEdit={handleEditAssignment}
            />

            {employeeRoster?.assignments?.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No roster assignments found.
              </div>
            )}

            <RosterPagination
              pagination={employeePagination}
              limit={limit}
              loading={employeeLoading}
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

export default EmployeeRosterView;
