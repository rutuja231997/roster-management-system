/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import FormField from "../common/FormField";
import { employeeSchema } from "../../utils/validations/employeeValidations";

const EmployeeForm = ({
  employee = null,
  pods = [],
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    employeeCode: "",
    status: "ACTIVE",
    podId: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData({
      firstName: employee?.firstName || "",
      lastName: employee?.lastName || "",
      email: employee?.email || "",
      employeeCode: employee?.employeeCode || "",
      status: employee?.status || "ACTIVE",
      podId: employee?.podId?._id || employee?.podId || "",
    });

    setErrors({});
  }, [employee]);

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

  const handleSubmit = (event) => {
    event.preventDefault();

    const result = employeeSchema.safeParse({
      ...formData,
      podId: formData.podId || null,
    });

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="First Name"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          placeholder="Enter first name"
          error={errors.firstName}
          required
          disabled={loading}
        />

        <FormField
          label="Last Name"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          placeholder="Enter last name"
          error={errors.lastName}
          required
          disabled={loading}
        />

        <FormField
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter email address"
          error={errors.email}
          required
          disabled={loading}
        />

        <FormField
          label="Employee Code"
          name="employeeCode"
          value={formData.employeeCode}
          onChange={handleChange}
          placeholder="e.g. EMP031"
          error={errors.employeeCode}
          required
          disabled={loading}
        />

        <FormField
          label="Pod"
          name="podId"
          type="select"
          value={formData.podId}
          onChange={handleChange}
          options={pods.map((pod) => ({
            value: pod._id,
            label: pod.name,
          }))}
          disabled={loading}
        />

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
          required
          disabled={loading}
        />
      </div>

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
          {loading
            ? "Saving..."
            : employee
              ? "Save Changes"
              : "Create Employee"}
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm;
