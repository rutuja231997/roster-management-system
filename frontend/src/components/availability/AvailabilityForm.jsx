import { useEffect, useState } from "react";
import FormField from "../common/FormField";

const availabilityTypes = [
  { value: "LEAVE", label: "Leave" },
  { value: "UNAVAILABLE", label: "Unavailable" },
  { value: "SICK_LEAVE", label: "Sick Leave" },
  { value: "PERSONAL", label: "Personal" },
];

const AvailabilityForm = ({
  availability,
  employees,
  onSubmit,
  onCancel,
  loading,
}) => {
  const [formData, setFormData] = useState({
    employeeId: "",
    type: "LEAVE",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    function handleSubmit() {
      if (availability) {
        setFormData({
          employeeId:
            availability.employeeId?._id || availability.employeeId || "",
          type: availability.type || "LEAVE",
          startDate: availability.startDate
            ? new Date(availability.startDate).toISOString().split("T")[0]
            : "",
          endDate: availability.endDate
            ? new Date(availability.endDate).toISOString().split("T")[0]
            : "",
          reason: availability.reason || "",
        });
      } else {
        setFormData({
          employeeId: "",
          type: "LEAVE",
          startDate: "",
          endDate: "",
          reason: "",
        });
      }

      setErrors({});
    }
    handleSubmit();
  }, [availability]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.employeeId) {
      newErrors.employeeId = "Please select an employee.";
    }

    if (!formData.type) {
      newErrors.type = "Availability type is required.";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required.";
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required.";
    }

    if (
      formData.startDate &&
      formData.endDate &&
      formData.endDate < formData.startDate
    ) {
      newErrors.endDate = "End date cannot be before start date.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    onSubmit(formData);
  };

  const employeeOptions = employees
    .filter((employee) => employee.status === "ACTIVE")
    .map((employee) => ({
      value: employee._id,
      label: `${employee.firstName} ${employee.lastName} (${employee.employeeCode})`,
    }));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormField
        type="select"
        label="Employee"
        name="employeeId"
        value={formData.employeeId}
        onChange={handleChange}
        options={employeeOptions}
        placeholder="Select employee"
        error={errors.employeeId}
        required
        disabled={!!availability}
      />

      <FormField
        type="select"
        label="Availability Type"
        name="type"
        value={formData.type}
        onChange={handleChange}
        options={availabilityTypes}
        placeholder="Select availability type"
        error={errors.type}
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          type="date"
          label="Start Date"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
          error={errors.startDate}
          required
        />

        <FormField
          type="date"
          label="End Date"
          name="endDate"
          value={formData.endDate}
          onChange={handleChange}
          error={errors.endDate}
          required
        />
      </div>

      <FormField
        type="textarea"
        label="Reason"
        name="reason"
        value={formData.reason}
        onChange={handleChange}
        placeholder="Enter reason for availability request..."
        rows={3}
      />

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {loading
            ? "Saving..."
            : availability
              ? "Update Request"
              : "Create Request"}
        </button>
      </div>
    </form>
  );
};

export default AvailabilityForm;
