const RosterAssignmentsTable = ({
  assignments = [],
  formatDate,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-225 text-left text-sm">
        {/* Table Header */}
        <thead className="bg-[#F8FAFC] text-xs uppercase text-[#64748B]">
          <tr>
            <th className="px-5 py-3 font-medium">Date</th>
            <th className="px-5 py-3 font-medium">Employee</th>
            <th className="px-5 py-3 font-medium">Employee Code</th>
            <th className="px-5 py-3 font-medium">Brand</th>
            <th className="px-5 py-3 font-medium">Process</th>
            <th className="px-5 py-3 font-medium">Shift</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Actions</th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-[#E2E8F0]">
          {assignments.map((assignment) => (
            <tr key={assignment._id} className="transition hover:bg-[#F8FAFC]">
              {/* Date */}
              <td className="whitespace-nowrap px-5 py-4 text-[#475569]">
                {formatDate
                  ? formatDate(assignment.date)
                  : new Date(assignment.date).toLocaleDateString("en-IN")}
              </td>

              {/* Employee */}
              <td className="whitespace-nowrap px-5 py-4 font-medium text-[#0F172A]">
                {assignment.employeeId?.firstName}{" "}
                {assignment.employeeId?.lastName}
              </td>

              {/* Employee Code */}
              <td className="whitespace-nowrap px-5 py-4 text-[#64748B]">
                {assignment.employeeId?.employeeCode || "-"}
              </td>

              {/* Brand */}
              <td className="whitespace-nowrap px-5 py-4 text-[#334155]">
                {assignment.brandId?.name || "-"}
              </td>

              {/* Process */}
              <td className="whitespace-nowrap px-5 py-4 text-[#334155]">
                {assignment.processId?.name || "-"}
              </td>

              {/* Shift */}
              <td className="whitespace-nowrap px-5 py-4 text-[#475569]">
                {assignment.shiftStart && assignment.shiftEnd
                  ? `${assignment.shiftStart} - ${assignment.shiftEnd}`
                  : "Not assigned"}
              </td>

              {/* Status */}
              <td className="whitespace-nowrap px-5 py-4">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                    assignment.status === "SCHEDULED"
                      ? "bg-green-50 text-green-700"
                      : assignment.status === "CANCELLED"
                        ? "bg-red-50 text-red-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {assignment.status}
                </span>
              </td>

              {/* Actions */}
              <td className="whitespace-nowrap px-5 py-4">
                <div className="flex items-center gap-2">
                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => onEdit?.(assignment)}
                    disabled={assignment.status !== "SCHEDULED" || !onEdit}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Edit
                  </button>

                  {/* Delete */}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(assignment)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}

          {/* Empty State */}
          {assignments.length === 0 && (
            <tr>
              <td
                colSpan={8}
                className="px-5 py-10 text-center text-sm text-[#64748B]"
              >
                No roster assignments found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RosterAssignmentsTable;
