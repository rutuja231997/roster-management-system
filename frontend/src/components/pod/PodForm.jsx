/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import FormField from "../common/FormField";
import { podSchema } from "../../utils/validations/podValidation";

const getPodId = (podId) => {
  if (!podId) return "";
  return typeof podId === "object" ? podId._id : podId;
};

const PodForm = ({
  pod = null,
  employees = [],
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    employeeIds: [],
  });

  const [errors, setErrors] = useState({});

  const isEditing = Boolean(pod);

  useEffect(() => {
    const assignedEmployees = employees
      .filter((employee) => getPodId(employee.podId) === pod?._id)
      .map((employee) => employee._id);

    setFormData({
      name: pod?.name || "",
      description: pod?.description || "",
      employeeIds: assignedEmployees,
    });

    setErrors({});
  }, [pod, employees]);

  const availableEmployees = employees.filter(
    (employee) => employee.status === "ACTIVE" && !employee.podId,
  );

  const assignedEmployees = employees.filter(
    (employee) => getPodId(employee.podId) === pod?._id,
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleEmployeeSelection = (employeeId) => {
    setFormData((prev) => ({
      ...prev,
      employeeIds: prev.employeeIds.includes(employeeId)
        ? prev.employeeIds.filter((id) => id !== employeeId)
        : [...prev.employeeIds, employeeId],
    }));

    setErrors((prev) => ({
      ...prev,
      employeeIds: "",
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const result = podSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = {};

      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0];

        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      });

      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onSubmit(result.data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-4">
        <FormField
          label="Pod Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter Pod name"
          error={errors.name}
          required
          disabled={loading}
        />

        <FormField
          label="Description"
          name="description"
          type="textarea"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter Pod description"
          error={errors.description}
          rows={3}
          disabled={loading}
        />
      </div>

      {/* Employee selection is available during creation */}
      {!isEditing && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-700">
            Assign Employees
          </h3>

          <p className="mb-3 text-xs text-slate-500">
            Select active employees who are not currently assigned to a Pod.
          </p>

          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
            {availableEmployees.length === 0 ? (
              <p className="text-sm text-slate-500">
                No unassigned active employees available.
              </p>
            ) : (
              availableEmployees.map((employee) => (
                <label
                  key={employee._id}
                  className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={formData.employeeIds.includes(employee._id)}
                    onChange={() => handleEmployeeSelection(employee._id)}
                    disabled={loading}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />

                  <span className="text-sm text-slate-700">
                    {employee.firstName} {employee.lastName}
                    <span className="ml-2 text-xs text-slate-400">
                      {employee.employeeCode}
                    </span>
                  </span>
                </label>
              ))
            )}
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Selected employees: {formData.employeeIds.length}
          </p>

          {errors.employeeIds && (
            <p className="mt-1 text-xs text-red-600">{errors.employeeIds}</p>
          )}
        </div>
      )}

      {/* Existing members while editing */}
      {isEditing && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-700">
            Assigned Employees ({assignedEmployees.length})
          </h3>

          {assignedEmployees.length === 0 ? (
            <p className="text-sm text-slate-500">
              No employees assigned to this Pod.
            </p>
          ) : (
            <div className="space-y-2 rounded-lg border border-slate-200 p-3">
              {assignedEmployees.map((employee) => (
                <p key={employee._id} className="text-sm text-slate-700">
                  {employee.firstName} {employee.lastName}
                  <span className="ml-2 text-xs text-slate-400">
                    {employee.employeeCode}
                  </span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Pod"}
        </button>
      </div>
    </form>
  );
};

export default PodForm;
