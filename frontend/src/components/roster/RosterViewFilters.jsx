const RosterViewFilter = ({
  selectedView,
  pods = [],
  brands = [],
  processes = [],
  employees = [],
  selectedEntityId,
  onEntityChange,
  loading = false,
}) => {
  let label = "";
  let options = [];

  switch (selectedView) {
    case "pod":
      label = "Select Pod";
      options = pods.map((pod) => ({
        value: pod._id,
        label: pod.name,
      }));
      break;

    case "brand":
      label = "Select Brand";
      options = brands.map((brand) => ({
        value: brand._id,
        label: brand.name,
      }));
      break;

    case "process":
      label = "Select Process";
      options = processes.map((process) => ({
        value: process._id,
        label: process.name,
      }));
      break;

    case "employee":
      label = "Select Employee";
      options = employees.map((employee) => ({
        value: employee._id,
        label: `${employee.firstName} ${employee.lastName} (${employee.employeeCode})`,
      }));
      break;

    default:
      return null;
  }

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
      <label className="mb-2 block text-sm font-medium text-[#334155]">
        {label}
      </label>

      <select
        value={selectedEntityId || ""}
        onChange={(e) => onEntityChange(e.target.value)}
        disabled={loading}
        className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] disabled:cursor-not-allowed disabled:bg-slate-50"
      >
        <option value="">
          {loading ? "Loading..." : `Choose ${label.replace("Select ", "")}`}
        </option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default RosterViewFilter;
