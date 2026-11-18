/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { UserPlus, UserMinus, Users } from "lucide-react";

import Modal from "../common/Modal";
import StatusBadge from "../common/StatusBadge";

// const getEmployeePodId = (employee) => {
//   return employee.podId?._id || employee.podId || null;
// };

const getPodId = (podId) => {
  if (!podId) return null;

  return typeof podId === "object" ? podId._id : podId;
};

const PodEmployeesModal = ({
  isOpen,
  onClose,
  pod,
  employees = [],
  onAssign,
  onRemove,
  loading = false,
  error = null,
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  // Reset selection when modal or selected Pod changes
  useEffect(() => {
    setSelectedEmployeeId("");
  }, [isOpen, pod?._id]);

  // Employees assigned to the selected Pod
  const assignedEmployees = useMemo(() => {
    if (!pod) return [];

    return employees.filter((employee) => getPodId(employee.podId) === pod._id);
  }, [employees, pod]);

  // Active employees who are not assigned to any Pod
  const availableEmployees = useMemo(() => {
    return employees.filter(
      (employee) =>
        employee.status === "ACTIVE" && getPodId(employee.podId) === null,
    );
  }, [employees]);

  // Assign selected employee
  const handleAssign = async () => {
    if (!selectedEmployeeId) return;

    const success = await onAssign(selectedEmployeeId);

    if (success) {
      setSelectedEmployeeId("");
    }
  };

  // Remove employee from selected Pod
  const handleRemove = async (employeeId) => {
    await onRemove(employeeId);
  };

  if (!pod) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage Employees - ${pod.name}`}
      description="Assign employees to this Pod or remove existing assignments."
      size="lg"
    >
      <div className="space-y-6">
        {/* Assigned Employees */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-slate-800">
              <Users size={18} />
              Assigned Employees
            </h3>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              {assignedEmployees.length} Employees
            </span>
          </div>

          {assignedEmployees.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center">
              <p className="text-sm text-slate-500">
                No employees assigned to this Pod yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
              {assignedEmployees.map((employee) => (
                <div
                  key={employee._id}
                  className="flex items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">
                      {employee.firstName} {employee.lastName}
                    </p>

                    <p className="text-xs text-slate-500">
                      {employee.employeeCode} · {employee.email}
                    </p>

                    <div className="mt-2">
                      <StatusBadge status={employee.status} />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(employee._id)}
                    disabled={loading}
                    className="flex shrink-0 items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <UserMinus size={16} />
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Available Employees */}
        <section className="border-t border-slate-200 pt-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-slate-800">
              <UserPlus size={18} />
              Available Employees
            </h3>

            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              {availableEmployees.length} Available
            </span>
          </div>

          {availableEmployees.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center">
              <p className="text-sm text-slate-500">
                No unassigned active employees available.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={selectedEmployeeId}
                onChange={(event) => setSelectedEmployeeId(event.target.value)}
                disabled={loading}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select an employee</option>

                {availableEmployees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.firstName} {employee.lastName} (
                    {employee.employeeCode})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAssign}
                disabled={!selectedEmployeeId || loading}
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UserPlus size={16} />
                {loading ? "Processing..." : "Assign Employee"}
              </button>
            </div>
          )}
        </section>

        {/* Error message */}
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PodEmployeesModal;
