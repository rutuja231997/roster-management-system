import { useEffect, useState } from "react";
import FormField from "../common/FormField";
import { brandSchema } from "../../utils/validations/brandValidation";

const initialFormData = {
  name: "",
  description: "",
  status: "ACTIVE",
};

export default function BrandForm({
  brand = null,
  onSubmit,
  onCancel,
  loading = false,
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function runBrand() {
      if (brand) {
        setFormData({
          name: brand.name || "",
          description: brand.description || "",
          status: brand.status || "ACTIVE",
        });
      } else {
        setFormData(initialFormData);
      }

      setErrors({});
    }
    runBrand();
  }, [brand]);

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

    const result = brandSchema.safeParse(formData);

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
        label="Brand Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Enter brand name"
        error={errors.name}
        required
      />

      <FormField
        type="textarea"
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Enter brand description"
        rows={3}
        error={errors.description}
      />

      <FormField
        type="select"
        label="Status"
        name="status"
        value={formData.status}
        onChange={handleChange}
        options={[
          { value: "ACTIVE", label: "Active" },
          { value: "INACTIVE", label: "Inactive" },
        ]}
        error={errors.status}
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
          {loading ? "Saving..." : brand ? "Update Brand" : "Create Brand"}
        </button>
      </div>
    </form>
  );
}
