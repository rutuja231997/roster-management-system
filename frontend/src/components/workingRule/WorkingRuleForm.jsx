import { useEffect, useState } from "react";
import { workingRuleSchema } from "../../utils/validations/workingRuleValidation";
import FormField from "../common/FormField";

const days = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const getId = (value) =>
  typeof value === "object" && value !== null ? value._id || "" : value || "";

const getInitialData = (workingRule) => ({
  brandId: getId(workingRule?.brandId),
  processId: getId(workingRule?.processId),
  operatingDays: Array.isArray(workingRule?.operatingDays)
    ? workingRule.operatingDays
    : [],
  operatesOnPublicHolidays: workingRule?.operatesOnPublicHolidays ?? false,
  minimumStaffing: Array.isArray(workingRule?.minimumStaffing)
    ? workingRule.minimumStaffing
    : [],
  status: workingRule?.status || "ACTIVE",
});

const WorkingRuleForm = ({
  workingRule = null,
  brands = [],
  processes = [],
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState(() => getInitialData(workingRule));

  const [errors, setErrors] = useState({});

  // Load existing data whenever the selected working rule changes.
  useEffect(() => {
    function runWorking() {
      setFormData(getInitialData(workingRule));
      setErrors({});
    }
    runWorking();
  }, [workingRule]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add/remove operating days.
  const handleDayChange = (day, checked) => {
    setFormData((prev) => ({
      ...prev,

      operatingDays: checked
        ? prev.operatingDays.includes(day)
          ? prev.operatingDays
          : [...prev.operatingDays, day]
        : prev.operatingDays.filter((item) => item !== day),

      // Remove staffing configuration if the day is unchecked.
      minimumStaffing: checked
        ? prev.minimumStaffing
        : prev.minimumStaffing.filter((item) => item.day !== day),
    }));
  };

  // Update minimum staffing for a selected operating day.
  const handleStaffingChange = (day, value) => {
    setFormData((prev) => {
      const existing = prev.minimumStaffing.filter((item) => item.day !== day);

      // Remove configuration when input is cleared.
      if (value === "") {
        return {
          ...prev,
          minimumStaffing: existing,
        };
      }

      return {
        ...prev,
        minimumStaffing: [
          ...existing,
          {
            day,
            requiredEmployees: Number(value),
          },
        ],
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const result = workingRuleSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = {};

      result.error.issues.forEach((issue) => {
        const field = issue.path[0];

        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      });

      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onSubmit(result.data);
  };

  const brandOptions = brands.map((brand) => ({
    value: brand._id,
    label: brand.name,
  }));

  const processOptions = processes.map((process) => ({
    value: process._id,
    label: process.name,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Brand and Process */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Brand"
          name="brandId"
          type="select"
          value={formData.brandId}
          onChange={handleChange}
          options={brandOptions}
          placeholder="Select brand"
          error={errors.brandId}
          disabled={!!workingRule || loading}
          required
        />

        <FormField
          label="Process"
          name="processId"
          type="select"
          value={formData.processId}
          onChange={handleChange}
          options={processOptions}
          placeholder="Select process"
          error={errors.processId}
          disabled={!!workingRule || loading}
          required
        />
      </div>

      {/* Operating Days */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Operating Days <span className="text-red-500">*</span>
        </label>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {days.map((day) => (
            <label
              key={day}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={formData.operatingDays.includes(day)}
                onChange={(e) => handleDayChange(day, e.target.checked)}
                disabled={loading}
                className="h-4 w-4 accent-blue-600"
              />

              <span className="text-slate-700">
                {day.charAt(0) + day.slice(1).toLowerCase()}
              </span>
            </label>
          ))}
        </div>

        {errors.operatingDays && (
          <p className="mt-1 text-xs text-red-500">{errors.operatingDays}</p>
        )}
      </div>

      {/* Minimum Staffing */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Minimum Staffing Requirements
        </label>

        {formData.operatingDays.length === 0 ? (
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
            Select operating days to configure minimum staffing.
          </p>
        ) : (
          <div className="space-y-3">
            {days
              .filter((day) => formData.operatingDays.includes(day))
              .map((day) => {
                const staffing = formData.minimumStaffing.find(
                  (item) => item.day === day,
                );

                return (
                  <div
                    key={day}
                    className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-3"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {day.charAt(0) + day.slice(1).toLowerCase()}
                    </span>

                    <div className="w-28">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Employees"
                        value={staffing?.requiredEmployees ?? ""}
                        onChange={(e) =>
                          handleStaffingChange(day, e.target.value)
                        }
                        disabled={loading}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {errors.minimumStaffing && (
          <p className="mt-1 text-xs text-red-500">{errors.minimumStaffing}</p>
        )}
      </div>

      {/* Public Holiday Operations */}
      <div className="rounded-lg border border-slate-200 p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={formData.operatesOnPublicHolidays}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                operatesOnPublicHolidays: e.target.checked,
              }))
            }
            disabled={loading}
            className="mt-1 h-4 w-4 accent-blue-600"
          />

          <span>
            <span className="block text-sm font-medium text-slate-700">
              Operates on public holidays
            </span>

            <span className="mt-1 block text-xs text-slate-500">
              Enable this if this Brand and Process operate on public holidays.
            </span>
          </span>
        </label>
      </div>

      {/* Status */}
      <FormField
        label="Status"
        name="status"
        type="select"
        value={formData.status}
        onChange={handleChange}
        options={[
          { value: "ACTIVE", label: "Active" },
          { value: "INACTIVE", label: "Inactive" },
        ]}
        error={errors.status}
        disabled={loading}
        required
      />

      {/* Actions */}
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
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Saving..."
            : workingRule
              ? "Update Working Rule"
              : "Create Working Rule"}
        </button>
      </div>
    </form>
  );
};

export default WorkingRuleForm;
