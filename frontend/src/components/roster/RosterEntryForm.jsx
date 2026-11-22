import { useEffect, useState } from "react";
import Modal from "../common/Modal";
import FormField from "../common/FormField";

const RosterEntryForm = ({
  isOpen,
  assignment,
  employees = [],
  brands = [],
  processes = [],
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    employeeId: "",
    brandId: "",
    processId: "",
    date: "",
    shiftStart: "",
    shiftEnd: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});

  // Populate form with existing assignment data
  useEffect(() => {
    if (!assignment) return;

    function formData() {
      setFormData({
        employeeId: assignment.employeeId?._id || "",
        brandId: assignment.brandId?._id || "",
        processId: assignment.processId?._id || "",
        date: assignment.date
          ? new Date(assignment.date).toISOString().split("T")[0]
          : "",
        shiftStart: assignment.shiftStart || "",
        shiftEnd: assignment.shiftEnd || "",
        notes: assignment.notes || "",
      });

      setErrors({});
    }
    formData();
  }, [assignment]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error when user changes its value
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

    if (!formData.brandId) {
      newErrors.brandId = "Please select a brand.";
    }

    if (!formData.processId) {
      newErrors.processId = "Please select a process.";
    }

    if (!formData.date) {
      newErrors.date = "Please select an assignment date.";
    }

    if (formData.shiftStart && !formData.shiftEnd) {
      newErrors.shiftEnd = "Shift end time is required.";
    }

    if (!formData.shiftStart && formData.shiftEnd) {
      newErrors.shiftStart = "Shift start time is required.";
    }

    if (formData.shiftStart && formData.shiftEnd) {
      if (formData.shiftEnd <= formData.shiftStart) {
        newErrors.shiftEnd =
          "Shift end time must be later than shift start time.";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    onSubmit(formData);
  };

  const employeeOptions = employees.map((employee) => ({
    value: employee._id,
    label: `${employee.firstName} ${employee.lastName} (${employee.employeeCode})`,
  }));

  const brandOptions = brands.map((brand) => ({
    value: brand._id,
    label: brand.name,
  }));

  const processOptions = processes.map((process) => ({
    value: process._id,
    label: process.name,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Roster Assignment"
      description="Update employee scheduling and assignment details."
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="roster-entry-form"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Updating..." : "Save Changes"}
          </button>
        </div>
      }
    >
      <form
        id="roster-entry-form"
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* Employee */}
        <FormField
          type="select"
          label="Employee"
          name="employeeId"
          value={formData.employeeId}
          onChange={handleChange}
          options={employeeOptions}
          error={errors.employeeId}
          required
          disabled={loading}
        />

        {/* Brand */}
        <FormField
          type="select"
          label="Brand"
          name="brandId"
          value={formData.brandId}
          onChange={handleChange}
          options={brandOptions}
          error={errors.brandId}
          required
          disabled={loading}
        />

        {/* Process */}
        <FormField
          type="select"
          label="Process"
          name="processId"
          value={formData.processId}
          onChange={handleChange}
          options={processOptions}
          error={errors.processId}
          required
          disabled={loading}
        />

        {/* Assignment Date */}
        <FormField
          type="date"
          label="Assignment Date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          error={errors.date}
          required
          disabled={loading}
        />

        {/* Shift Timing */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            type="time"
            label="Shift Start"
            name="shiftStart"
            value={formData.shiftStart}
            onChange={handleChange}
            error={errors.shiftStart}
            disabled={loading}
          />

          <FormField
            type="time"
            label="Shift End"
            name="shiftEnd"
            value={formData.shiftEnd}
            onChange={handleChange}
            error={errors.shiftEnd}
            disabled={loading}
          />
        </div>

        {/* Notes */}
        <FormField
          type="textarea"
          label="Notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Add any additional notes..."
          rows={3}
          disabled={loading}
        />
      </form>
    </Modal>
  );
};

export default RosterEntryForm;
