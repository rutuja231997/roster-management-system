const SummaryCard = ({ title, count, icon: Icon, color, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="rounded-lg border border-slate-200 bg-white p-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">
            {count}
          </h2>
        </div>

        {Icon && (
          <div
            className={`rounded-lg p-3 ${color || "bg-blue-50 text-blue-600"}`}
          >
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;
