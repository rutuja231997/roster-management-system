import { Filter, CalendarDays, RotateCcw } from "lucide-react";

const ConflictFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const handleChange = (field, value) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-500" />

          <h3 className="font-semibold text-slate-800">Filter Conflicts</h3>
        </div>

        <button
          type="button"
          onClick={onClearFilters}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors"
        >
          <RotateCcw size={14} />
          Clear Filters
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Status Filter */}
        <div>
          <label
            htmlFor="conflict-status"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Status
          </label>

          <select
            id="conflict-status"
            value={filters.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Conflict Type
          </label>

          <select
            id="conflict-type"
            value={filters.type}
            onChange={(e) => handleChange("type", e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Conflict Types</option>

            <option value="INSUFFICIENT_STAFFING">Insufficient Staffing</option>

            <option value="OVERLAPPING_ASSIGNMENT">
              Overlapping Assignment
            </option>

            <option value="WEEKLY_OFF_CONFLICT">Weekly Off</option>

            <option value="WORKING_RULE_VIOLATION">
              Working Rule Violation
            </option>
          </select>
        </div>

        {/* Date Filter */}
        <div>
          <label
            htmlFor="conflict-date"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Conflict Date
          </label>

          <div className="relative">
            <CalendarDays
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />

            <input
              id="conflict-date"
              type="date"
              value={filters.date}
              onChange={(e) => handleChange("date", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConflictFilters;
