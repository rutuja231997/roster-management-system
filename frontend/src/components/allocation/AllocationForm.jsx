import { useEffect, useState } from "react";
import FormField from "../common/FormField";
import { allocationSchema } from "../../utils/validations/allocationValidation";

const initialFormData = {
  employeeId: "",
  brandId: "",
  processId: "",
  isActive: true,
};

export default function AllocationForm({
  allocation = null,
  employees = [],
  brands = [],
  processes = [],
  onSubmit,
  onCancel,
  loading = false,
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function runAllocation() {
      if (allocation) {
        setFormData({
          employeeId: allocation.employeeId?._id || allocation.employeeId || "",
          brandId: allocation.brandId?._id || allocation.brandId || "",
          processId: allocation.processId?._id || allocation.processId || "",
          isActive: allocation.isActive ?? true,
        });
      } else {
        setFormData(initialFormData);
      }

      setErrors({});
    }
    runAllocation();
  }, [allocation]);

  // Only active entities should be available for new allocations.
  const activeEmployees = employees.filter(
    (employee) => employee.status === "ACTIVE",
  );

  const activeBrands = brands.filter((brand) => brand.status === "ACTIVE");

  const activeProcesses = processes.filter(
    (process) => process.status === "ACTIVE",
  );

  const employeeOptions = activeEmployees.map((employee) => ({
    value: employee._id,
    label: `${employee.firstName} ${employee.lastName} (${employee.employeeCode})`,
  }));

  const brandOptions = activeBrands.map((brand) => ({
    value: brand._id,
    label: brand.name,
  }));

  const processOptions = activeProcesses.map((process) => ({
    value: process._id,
    label: process.name,
  }));

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "isActive" ? value === "true" : value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const result = allocationSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = {};

      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0];

        if (fieldName) {
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
      />

      <FormField
        type="select"
        label="Brand"
        name="brandId"
        value={formData.brandId}
        onChange={handleChange}
        options={brandOptions}
        placeholder="Select brand"
        error={errors.brandId}
        required
      />

      <FormField
        type="select"
        label="Process"
        name="processId"
        value={formData.processId}
        onChange={handleChange}
        options={processOptions}
        placeholder="Select process"
        error={errors.processId}
        required
      />

      <FormField
        type="select"
        label="Allocation Status"
        name="isActive"
        value={String(formData.isActive)}
        onChange={handleChange}
        options={[
          { value: "true", label: "Active" },
          { value: "false", label: "Inactive" },
        ]}
        error={errors.isActive}
        required
      />

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Saving..."
            : allocation
              ? "Update Allocation"
              : "Create Allocation"}
        </button>
      </div>
    </form>
  );
}
