import {
  X,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Building2,
  Briefcase,
  CalendarDays,
  FileText,
} from "lucide-react";

const ConflictDetailsModal = ({ isOpen, conflict, onClose }) => {
  if (!isOpen || !conflict) return null;

  const formatConflictType = (type) => {
    if (!type) return "Unknown Conflict";

    return type
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getEmployeeName = (employee) => {
    if (!employee) return "Not specified";

    return (
      `${employee.firstName || ""} ${employee.lastName || ""}`.trim() ||
      employee.employeeCode ||
      "Not specified"
    );
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

  const isStaffingConflict = conflict.type === "INSUFFICIENT_STAFFING";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-orange-100 rounded-xl">
              <AlertTriangle size={22} className="text-orange-600" />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Conflict Details
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {formatConflictType(conflict.type)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status and Severity */}
          <div className="flex flex-wrap gap-3">
            <span
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusStyle(
                conflict.status,
              )}`}
            >
              {conflict.status || "Unknown Status"}
            </span>

            <span
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${getSeverityStyle(
                conflict.severity,
              )}`}
            >
              {conflict.severity || "Unknown Severity"}
            </span>
          </div>

          {/* Description */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={18} className="text-gray-500" />

              <h3 className="font-medium text-gray-800">Description</h3>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              {conflict.description ||
                "No description available for this conflict."}
            </p>
          </div>

          {/* Basic Information */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">
              Conflict Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Employee */}
              <InfoCard
                icon={<User size={18} />}
                label="Employee"
                value={getEmployeeName(conflict.employeeId)}
                subValue={conflict.employeeId?.employeeCode}
              />

              {/* Brand */}
              <InfoCard
                icon={<Building2 size={18} />}
                label="Brand"
                value={conflict.brandId?.name || "Not specified"}
              />

              {/* Process */}
              <InfoCard
                icon={<Briefcase size={18} />}
                label="Process"
                value={conflict.processId?.name || "Not specified"}
              />

              {/* Date */}
              <InfoCard
                icon={<CalendarDays size={18} />}
                label="Conflict Date"
                value={formatDate(conflict.date)}
              />
            </div>
          </div>

          {/* Staffing Details */}
          {isStaffingConflict && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">
                Staffing Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StaffingCard
                  label="Required"
                  value={conflict.requiredEmployees ?? 0}
                  color="blue"
                />

                <StaffingCard
                  label="Available"
                  value={conflict.availableEmployees ?? 0}
                  color="green"
                />

                <StaffingCard
                  label="Shortage"
                  value={
                    conflict.shortage ??
                    Math.max(
                      0,
                      (conflict.requiredEmployees || 0) -
                        (conflict.availableEmployees || 0),
                    )
                  }
                  color="red"
                />
              </div>
            </div>
          )}

          {/* Resolution Information */}
          {conflict.status === "RESOLVED" && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={18} className="text-green-600" />

                <h3 className="font-semibold text-green-800">
                  Resolution Information
                </h3>
              </div>

              <div className="space-y-2 text-sm">
                {conflict.resolvedAt && (
                  <div className="flex justify-between gap-4">
                    <span className="text-green-700">Resolved At</span>

                    <span className="font-medium text-green-800">
                      {formatDate(conflict.resolvedAt)}
                    </span>
                  </div>
                )}

                {conflict.resolvedBy && (
                  <div className="flex justify-between gap-4">
                    <span className="text-green-700">Resolved By</span>

                    <span className="font-medium text-green-800">
                      {typeof conflict.resolvedBy === "object"
                        ? getEmployeeName(conflict.resolvedBy)
                        : conflict.resolvedBy}
                    </span>
                  </div>
                )}

                {conflict.resolutionNotes && (
                  <div className="pt-2 border-t border-green-200">
                    <p className="text-green-700 mb-1">Resolution Notes</p>

                    <p className="text-green-800">{conflict.resolutionNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ignored Information */}
          {conflict.status === "IGNORED" && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={18} className="text-gray-600" />

                <h3 className="font-semibold text-gray-800">
                  Conflict Ignored
                </h3>
              </div>

              {conflict.resolutionNotes && (
                <p className="text-sm text-gray-600">
                  {conflict.resolutionNotes}
                </p>
              )}
            </div>
          )}

          {/* Escalation Information */}
          {conflict.isEscalated && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-orange-600" />

                <h3 className="font-semibold text-orange-800">
                  Escalated to Operations Manager
                </h3>
              </div>

              <p className="text-sm text-orange-700 mt-2">
                This conflict requires attention from the operations manager.
              </p>
            </div>
          )}

          {/* Created At */}
          {conflict.createdAt && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock size={14} />

              <span>
                Conflict detected on{" "}
                {new Date(conflict.createdAt).toLocaleString("en-IN")}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------- Reusable Info Card -------------------- */

const InfoCard = ({ icon, label, value, subValue }) => {
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 text-gray-500 mb-2">
        {icon}

        <span className="text-sm">{label}</span>
      </div>

      <p className="font-medium text-gray-800">{value}</p>

      {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
    </div>
  );
};

/* -------------------- Staffing Card -------------------- */

const StaffingCard = ({ label, value, color }) => {
  const colorStyles = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    red: "bg-red-50 border-red-200 text-red-700",
  };

  return (
    <div className={`border rounded-xl p-4 text-center ${colorStyles[color]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>

      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
};

export default ConflictDetailsModal;
