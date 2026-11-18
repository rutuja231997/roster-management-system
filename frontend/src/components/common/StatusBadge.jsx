const StatusBadge = ({ status }) => {
  const styles = {
    ACTIVE: "bg-green-50 text-green-700",
    INACTIVE: "bg-red-50 text-red-700",
    PENDING: "bg-yellow-50 text-yellow-700",
    APPROVED: "bg-green-50 text-green-700",
    REJECTED: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status || "UNKNOWN"}
    </span>
  );
};

export default StatusBadge;
