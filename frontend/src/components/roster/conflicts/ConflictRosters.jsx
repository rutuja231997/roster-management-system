import { Filter, CalendarDays, RotateCcw } from "lucide-react";

const conflictTypeOptions = [
  {
    value: "INSUFFICIENT_STAFFING",
    label: "Insufficient Staffing",
  },
  {
    value: "OVERLAPPING_ASSIGNMENT",
    label: "Overlapping Assignment",
  },
  {
    value: "WEEKLY_OFF_CONFLICT",
    label: "Weekly Off Conflict",
  },
  {
    value: "WORKING_RULE_VIOLATION",
    label: "Working Rule Violation",
  },
];

const ConflictFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const handleChange = (field, value) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  const hasActiveFilters = filters.status || filters.type || filters.date;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center gap-2">
        <Filter size={18} className="text-slate-500" />

        <h3 className="font-medium text-slate-900">Filter Conflicts</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Status Filter */}
        <div>
          <label
            htmlFor="conflict-status"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Status
          </label>

          <select
            id="conflict-status"
            value={filters.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="RESOLVED">Resolved</option>
            <option value="IGNORED">Ignored</option>
          </select>
        </div>

        {/* Conflict Type Filter */}
        <div>
          <label
            htmlFor="conflict-type"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Conflict Type
          </label>

          <select
            id="conflict-type"
            value={filters.type}
            onChange={(e) => handleChange("type", e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Types</option>

            {conflictTypeOptions.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div>
          <label
            htmlFor="conflict-date"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Date
          </label>

          <div className="relative">
            <CalendarDays
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="conflict-date"
              type="date"
              value={filters.date}
              onChange={(e) => handleChange("date", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Clear Filters */}
        <div className="flex items-end">
          <button
            type="button"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw size={16} />
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictFilters;
