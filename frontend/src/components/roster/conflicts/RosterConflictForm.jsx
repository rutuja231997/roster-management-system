import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AlertTriangle, CheckCircle, User, Loader2 } from "lucide-react";

import {
  fetchEligibleEmployees,
  clearEligibleEmployees,
  clearConflictError,
} from "../../../utils/redux/slices/rosterConflictSlice";

const RosterConflictForm = ({ conflict, onSubmit }) => {
  const dispatch = useDispatch();

  /* --------------------------------------------------
     Redux State
  -------------------------------------------------- */

  const {
    eligibleEmployees,
    conflictDetails,
    eligibleEmployeesLoading,
    error,
  } = useSelector((state) => state.rosterConflict);

  /* --------------------------------------------------
     Local State
  -------------------------------------------------- */

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  /* --------------------------------------------------
     Fetch Eligible Employees
  -------------------------------------------------- */

  useEffect(() => {
    function onResolve() {
      if (!conflict?._id) return;

      setSelectedEmployeeId("");
      setResolutionNotes("");

      dispatch(clearEligibleEmployees());
      dispatch(clearConflictError());

      dispatch(fetchEligibleEmployees(conflict._id));
    }
    onResolve();
  }, [conflict?._id, dispatch]);

  /* --------------------------------------------------
     Form Submit
  -------------------------------------------------- */

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedEmployeeId) {
      return;
    }

    onSubmit({
      employeeId: selectedEmployeeId,
      resolutionNotes,
    });
  };

  /* --------------------------------------------------
     UI
  -------------------------------------------------- */

  return (
    <form id="rosterConflictForm" onSubmit={handleSubmit} className="space-y-5">
      {/* Conflict Information */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-600" />

          <div>
            <h3 className="font-semibold text-amber-900">
              Insufficient Staffing
            </h3>

            <p className="mt-1 text-sm text-amber-800">
              {conflict?.description ||
                "This roster has insufficient staffing."}
            </p>
          </div>
        </div>

        {/* Conflict Details */}
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-amber-700">Brand</p>

            <p className="mt-1 text-sm font-medium text-amber-900">
              {conflict?.brandId?.name || "N/A"}
            </p>
          </div>

          <div>
            <p className="text-xs text-amber-700">Process</p>

            <p className="mt-1 text-sm font-medium text-amber-900">
              {conflict?.processId?.name || "N/A"}
            </p>
          </div>

          <div>
            <p className="text-xs text-amber-700">Date</p>

            <p className="mt-1 text-sm font-medium text-amber-900">
              {conflict?.date
                ? new Date(conflict.date).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>

        {/* Staffing Summary */}
        {conflictDetails && (
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-amber-200 pt-3">
            <div>
              <p className="text-xs text-amber-700">Required</p>

              <p className="text-lg font-semibold text-amber-900">
                {conflictDetails.requiredEmployees}
              </p>
            </div>

            <div>
              <p className="text-xs text-amber-700">Available</p>

              <p className="text-lg font-semibold text-amber-900">
                {conflictDetails.currentAvailableEmployees}
              </p>
            </div>

            <div>
              <p className="text-xs text-amber-700">Shortage</p>

              <p className="text-lg font-semibold text-amber-900">
                {conflictDetails.shortage}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Eligible Employees */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-800">
            Select Employee
          </label>

          {!eligibleEmployeesLoading && (
            <span className="text-xs text-slate-500">
              {eligibleEmployees.length} eligible employees
            </span>
          )}
        </div>

        {/* Loading */}
        {eligibleEmployeesLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={22} className="animate-spin text-blue-600" />

            <span className="ml-2 text-sm text-slate-500">
              Fetching eligible employees...
            </span>
          </div>
        )}

        {/* Empty State */}
        {!eligibleEmployeesLoading && eligibleEmployees.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
            <AlertTriangle size={28} className="mx-auto mb-2 text-amber-500" />

            <p className="font-medium text-slate-700">
              No eligible employees available
            </p>

            <p className="mt-1 text-sm text-slate-500">
              No employee currently satisfies the eligibility requirements for
              this conflict.
            </p>
          </div>
        )}

        {/* Employee List */}
        {!eligibleEmployeesLoading && eligibleEmployees.length > 0 && (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {eligibleEmployees.map((employee) => {
              const employeeId = employee.employeeId;

              const isSelected = selectedEmployeeId === employeeId;

              return (
                <label
                  key={employeeId}
                  className={`block cursor-pointer rounded-lg border p-3 transition ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Radio Button */}
                    <input
                      type="radio"
                      name="employee"
                      value={employeeId}
                      checked={isSelected}
                      onChange={() => setSelectedEmployeeId(employeeId)}
                      className="mt-1 accent-blue-600"
                    />

                    {/* Employee Icon */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      <User size={18} className="text-slate-600" />
                    </div>

                    {/* Employee Information */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-slate-800">
                          {employee.name}
                        </p>

                        <span className="text-xs text-slate-500">
                          {employee.employeeCode}
                        </span>
                      </div>

                      {/* Allocation Status */}
                      {employee.requiresAllocation && (
                        <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                          Requires Allocation
                        </span>
                      )}

                      {employee.isAllocated && (
                        <span className="mt-1 inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                          Allocated
                        </span>
                      )}

                      {/* Eligibility Reasons */}
                      {employee.reasons?.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {employee.reasons.map((reason, index) => (
                            <li key={index} className="text-xs text-slate-500">
                              {reason}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Selected Indicator */}
                    {isSelected && (
                      <CheckCircle
                        size={18}
                        className="shrink-0 text-blue-600"
                      />
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Resolution Notes */}
      <div>
        <label
          htmlFor="resolutionNotes"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Resolution Notes
          <span className="ml-1 font-normal text-slate-400">(Optional)</span>
        </label>

        <textarea
          id="resolutionNotes"
          value={resolutionNotes}
          onChange={(e) => setResolutionNotes(e.target.value)}
          rows={3}
          placeholder="Add details about how this conflict was resolved..."
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </form>
  );
};

export default RosterConflictForm;
