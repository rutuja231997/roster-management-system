const baseClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100";

export default function FormField({
  type = "text",
  label,
  name,
  value,
  onChange,
  placeholder = "",
  error,
  options = [],
  rows = 3,
  required = false,
  disabled = false,
}) {
  const hasError = Boolean(error);

  const fieldClass = `${baseClass} ${
    hasError ? "border-red-500 focus:border-red-500 focus:ring-red-100" : ""
  }`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={name}
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {label}
          {required && <span className="ml-1 text-red-600">*</span>}
        </label>
      )}

      {type === "select" ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={fieldClass}
        >
          <option value="">Select {label?.toLowerCase() || "an option"}</option>

          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={fieldClass}
        />
      ) : (
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={fieldClass}
        />
      )}

      {hasError && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
