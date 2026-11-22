const RosterPagination = ({
  pagination,
  limit,
  loading = false,
  onPageChange,
  onLimitChange,
}) => {
  if (!pagination?.totalRecords) {
    return null;
  }

  const startRecord = (pagination.currentPage - 1) * pagination.limit + 1;

  const endRecord = Math.min(
    pagination.currentPage * pagination.limit,
    pagination.totalRecords,
  );

  return (
    <div className="flex flex-col justify-between gap-4 border-t border-[#E2E8F0] p-4 sm:flex-row sm:items-center">
      {/* Records Information */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <p className="text-sm text-[#64748B]">
          Showing{" "}
          <span className="font-medium text-[#0F172A]">{startRecord}</span> to{" "}
          <span className="font-medium text-[#0F172A]">{endRecord}</span> of{" "}
          <span className="font-medium text-[#0F172A]">
            {pagination.totalRecords}
          </span>{" "}
          assignments
        </p>

        {/* Page Size */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-[#64748B]">Rows:</label>

          <select
            value={limit}
            onChange={(e) => onLimitChange(e.target.value)}
            className="rounded-lg border border-[#E2E8F0] bg-white px-2 py-1.5 text-sm text-[#334155] outline-none focus:border-[#2563EB]"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <button
          onClick={() => onPageChange(pagination.currentPage - 1)}
          disabled={!pagination.hasPreviousPage || loading}
          className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#334155] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        <span className="whitespace-nowrap text-sm text-[#64748B]">
          Page{" "}
          <span className="font-medium text-[#0F172A]">
            {pagination.currentPage}
          </span>{" "}
          of{" "}
          <span className="font-medium text-[#0F172A]">
            {pagination.totalPages}
          </span>
        </span>

        <button
          onClick={() => onPageChange(pagination.currentPage + 1)}
          disabled={!pagination.hasNextPage || loading}
          className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#334155] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default RosterPagination;
