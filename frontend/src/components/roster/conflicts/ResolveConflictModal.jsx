import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { X, Users, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

import {
  fetchEligibleEmployees,
  resolveRosterConflict,
  clearEligibleEmployees,
} from "../../../utils/redux/slices/rosterConflictSlice";

const ResolveConflictModal = ({ isOpen, conflict, onClose, onResolved }) => {
  const dispatch = useDispatch();

  const { eligibleEmployees, eligibleEmployeesLoading, resolving, error } =
    useSelector((state) => state.rosterConflict);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Fetch eligible employees when modal opens
  useEffect(() => {
    function resolveConflict() {
      if (isOpen && conflict?._id) {
        dispatch(fetchEligibleEmployees(conflict._id));

        setSelectedEmployeeId("");
        setResolutionNotes("");
      }

      return () => {
        dispatch(clearEligibleEmployees());
      };
    }
    resolveConflict();
  }, [isOpen, conflict?._id, dispatch]);

  if (!isOpen || !conflict) return null;

  const eligibleList = Array.isArray(eligibleEmployees)
    ? eligibleEmployees
    : eligibleEmployees?.eligibleEmployees || [];

  const conflictInfo = eligibleEmployees?.conflict || {};

  const selectedEmployee = eligibleList.find(
    (employee) => employee.employeeId === selectedEmployeeId,
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedEmployeeId) {
      return;
    }

    const result = await dispatch(
      resolveRosterConflict({
        conflictId: conflict._id,
        employeeId: selectedEmployeeId,
        resolutionNotes,
      }),
    );

    if (resolveRosterConflict.fulfilled.match(result)) {
      onResolved?.();
      onClose();
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle size={20} className="text-orange-600" />
              </div>

              <h2 className="text-xl font-semibold text-gray-800">
                Resolve Staffing Conflict
              </h2>
            </div>

            <p className="text-sm text-gray-500 mt-2">
              Assign an eligible employee to resolve the staffing shortage.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Conflict Summary */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <h3 className="font-semibold text-orange-800 mb-3">
              Staffing Shortage
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SummaryItem
                label="Brand"
                value={conflict.brandId?.name || conflictInfo.brand || "-"}
              />

              <SummaryItem
                label="Process"
                value={conflict.processId?.name || conflictInfo.process || "-"}
              />

              <SummaryItem
                label="Date"
                value={formatDate(conflict.date || conflictInfo.date)}
              />

              <SummaryItem
                label="Shortage"
                value={conflict.shortage ?? conflictInfo.shortage ?? "-"}
                highlight
              />
            </div>
          </div>

          {/* Loading */}
          {eligibleEmployeesLoading && (
            <div className="py-10 text-center">
              <Loader2
                size={32}
                className="animate-spin mx-auto text-blue-600 mb-3"
              />

              <p className="text-sm text-gray-500">
                Finding eligible employees...
              </p>
            </div>
          )}

          {/* Error */}
          {error && !eligibleEmployeesLoading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Employee Selection */}
          {!eligibleEmployeesLoading && (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Eligible Employees */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">
                      Eligible Employees
                    </h3>

                    <span className="text-sm text-gray-500">
                      {eligibleList.length} available
                    </span>
                  </div>

                  {eligibleList.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                      <Users size={32} className="mx-auto text-gray-400 mb-2" />

                      <p className="font-medium text-gray-700">
                        No eligible employees found
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        There are currently no employees available to resolve
                        this staffing conflict.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {eligibleList.map((employee) => {
                        const employeeId = employee.employeeId;

                        const isSelected = selectedEmployeeId === employeeId;

                        return (
                          <label
                            key={employeeId}
                            className={`block border rounded-xl p-4 cursor-pointer transition-all ${
                              isSelected
                                ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="radio"
                                name="employee"
                                value={employeeId}
                                checked={isSelected}
                                onChange={() =>
                                  setSelectedEmployeeId(employeeId)
                                }
                                className="mt-1 accent-blue-600"
                              />

                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-medium text-gray-800">
                                      {employee.name}
                                    </p>

                                    <p className="text-sm text-gray-500 mt-1">
                                      {employee.employeeCode}
                                    </p>
                                  </div>

                                  {employee.isAllocated ? (
                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                      Allocated
                                    </span>
                                  ) : employee.requiresAllocation ? (
                                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                                      Allocation Required
                                    </span>
                                  ) : null}
                                </div>

                                {/* Reasons */}
                                {employee.reasons?.length > 0 && (
                                  <div className="mt-3 space-y-1">
                                    {employee.reasons.map((reason, index) => (
                                      <p
                                        key={index}
                                        className="text-xs text-gray-500"
                                      >
                                        • {reason}
                                      </p>
                                    ))}
                                  </div>
                                )}

                                {/* Allocation Warning */}
                                {employee.requiresAllocation && (
                                  <div className="mt-3 flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <AlertTriangle
                                      size={16}
                                      className="text-yellow-600 mt-0.5 shrink-0"
                                    />

                                    <p className="text-xs text-yellow-700">
                                      This employee requires allocation to this
                                      brand/process before assignment.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected Employee */}
                {selectedEmployee && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={18} className="text-blue-600" />

                      <h3 className="font-medium text-blue-800">
                        Selected Employee
                      </h3>
                    </div>

                    <p className="text-sm text-blue-700">
                      {selectedEmployee.name} ({selectedEmployee.employeeCode})
                    </p>
                  </div>
                )}

                {/* Resolution Notes */}
                <div>
                  <label
                    htmlFor="resolutionNotes"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Resolution Notes
                  </label>

                  <textarea
                    id="resolutionNotes"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Enter details about this resolution..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={
              resolving ||
              eligibleEmployeesLoading ||
              !selectedEmployeeId ||
              eligibleList.length === 0
            }
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {resolving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Resolving...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                Resolve Conflict
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------- Summary Item -------------------- */

const SummaryItem = ({ label, value, highlight }) => {
  return (
    <div>
      <p className="text-xs text-orange-700 mb-1">{label}</p>

      <p
        className={`font-semibold ${
          highlight ? "text-red-700" : "text-orange-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
};

export default ResolveConflictModal;
