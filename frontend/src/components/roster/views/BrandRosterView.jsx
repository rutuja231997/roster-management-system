import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { getBrandRoster } from "../../../utils/redux/slices/rosterViewSlice";

import RosterAssignmentsTable from "../RosterAssignmentsTable";
import RosterPagination from "../RosterPagination";
import RosterEntryForm from "../RosterEntryForm";

import { updateRosterEntry } from "../../../utils/redux/slices/rosterEntrySlice";

const BrandRosterView = ({
  rosterId,
  brandId,
  employees = [],
  brands = [],
  processes = [],
}) => {
  const dispatch = useDispatch();

  const { brandRoster, brandPagination, brandLoading, brandError } =
    useSelector((state) => state.rosterView);

  const [limit, setLimit] = useState(10);

  // Selected assignment for editing
  const [editingAssignment, setEditingAssignment] = useState(null);

  // Update loading state
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    if (!rosterId || !brandId) return;

    dispatch(
      getBrandRoster({
        rosterId,
        brandId,
        page: 1,
        limit,
      }),
    );
  }, [dispatch, rosterId, brandId, limit]);

  const handlePageChange = (page) => {
    dispatch(
      getBrandRoster({
        rosterId,
        brandId,
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

      // Refresh current brand roster
      dispatch(
        getBrandRoster({
          rosterId,
          brandId,
          page: brandPagination?.page || 1,
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

  if (!brandId) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
        Select a Brand to view its roster.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Brand-wise Roster
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {brandRoster?.brand?.name || "Selected Brand"}
          </p>

          {brandRoster && (
            <div className="mt-3 text-sm text-gray-600">
              Total Assignments: <strong>{brandRoster.totalAssignments}</strong>
            </div>
          )}
        </div>

        {brandLoading ? (
          <div className="p-8 text-center text-gray-500">
            Loading Brand roster...
          </div>
        ) : brandError ? (
          <div className="p-8 text-center text-red-500">{brandError}</div>
        ) : (
          <>
            <RosterAssignmentsTable
              assignments={brandRoster?.assignments || []}
              formatDate={formatDate}
              onEdit={handleEditAssignment}
            />

            {brandRoster?.assignments?.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No roster assignments found.
              </div>
            )}

            <RosterPagination
              pagination={brandPagination}
              limit={limit}
              loading={brandLoading}
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

export default BrandRosterView;
