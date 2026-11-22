import { Eye, CheckCircle, AlertTriangle, Clock } from "lucide-react";

const ConflictTable = ({
  conflicts = [],
  loading = false,
  onViewDetails,
  onResolve,
}) => {
  const getStatusStyle = (status) => {
    switch (status) {
      case "OPEN":
        return "bg-red-100 text-red-700";

      case "RESOLVED":
        return "bg-green-100 text-green-700";

      case "IGNORED":
        return "bg-gray-100 text-gray-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getSeverityStyle = (severity) => {
    switch (severity?.toUpperCase()) {
      case "HIGH":
        return "bg-red-100 text-red-700";

      case "MEDIUM":
        return "bg-yellow-100 text-yellow-700";

      case "LOW":
        return "bg-blue-100 text-blue-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatConflictType = (type) => {
    if (!type) return "Unknown";

    return type
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getEmployeeName = (employee) => {
    if (!employee) return "-";

    return (
      `${employee.firstName || ""} ${employee.lastName || ""}`.trim() ||
      employee.employeeCode ||
      "-"
    );
  };

  const isResolvable = (conflict) => {
    return (
      conflict.status === "OPEN" && conflict.type === "INSUFFICIENT_STAFFING"
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
        <div className="flex justify-center mb-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>

        <p className="text-gray-500 text-sm">Loading conflicts...</p>
      </div>
    );
  }

  if (!conflicts.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
        <CheckCircle size={40} className="mx-auto text-green-500 mb-3" />

        <h3 className="text-lg font-semibold text-gray-800">
          No conflicts found
        </h3>

        <p className="text-gray-500 text-sm mt-1">
          There are no conflicts matching the selected filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Table Header */}
      <div className="px-5 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Conflict Records</h3>

          <span className="text-sm text-gray-500">
            {conflicts.length} records
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Conflict
              </th>

              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Employee
              </th>

              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Brand
              </th>

              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Process
              </th>

              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Date
              </th>

              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Severity
              </th>

              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Status
              </th>

              <th className="px-4 py-3 text-center font-medium text-gray-600">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {conflicts.map((conflict) => (
              <tr
                key={conflict._id}
                className="hover:bg-gray-50 transition-colors"
              >
                {/* Conflict Type */}
                <td className="px-4 py-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      size={16}
                      className="text-orange-500 mt-0.5 shrink-0"
                    />

                    <div>
                      <p className="font-medium text-gray-800">
                        {formatConflictType(conflict.type)}
                      </p>

                      <p className="text-xs text-gray-500 mt-1 max-w-55">
                        {conflict.description || "No description available"}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Employee */}
                <td className="px-4 py-4">
                  <div>
                    <p className="font-medium text-gray-800">
                      {getEmployeeName(conflict.employeeId)}
                    </p>

                    <p className="text-xs text-gray-500">
                      {conflict.employeeId?.employeeCode || "-"}
                    </p>
                  </div>
                </td>

                {/* Brand */}
                <td className="px-4 py-4 text-gray-700">
                  {conflict.brandId?.name || "-"}
                </td>

                {/* Process */}
                <td className="px-4 py-4 text-gray-700">
                  {conflict.processId?.name || "-"}
                </td>

                {/* Date */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={14} />

                    {formatDate(conflict.date)}
                  </div>
                </td>

                {/* Severity */}
                <td className="px-4 py-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${getSeverityStyle(
                      conflict.severity,
                    )}`}
                  >
                    {conflict.severity || "N/A"}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                      conflict.status,
                    )}`}
                  >
                    {conflict.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-4">
                  <div className="flex items-center justify-center gap-2">
                    {/* View Details */}
                    <button
                      type="button"
                      onClick={() => onViewDetails(conflict)}
                      title="View details"
                      className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Eye size={16} />
                    </button>

                    {/* Resolve Conflict */}
                    {isResolvable(conflict) && (
                      <button
                        type="button"
                        onClick={() => onResolve(conflict)}
                        title="Resolve conflict"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100"
                      >
                        <CheckCircle size={16} />
                        Resolve
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ConflictTable;
