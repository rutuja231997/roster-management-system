const rosterViews = [
  {
    label: "Company-wide",
    value: "company",
  },
  {
    label: "Pod-wise",
    value: "pod",
  },
  {
    label: "Brand-wise",
    value: "brand",
  },
  {
    label: "Process-wise",
    value: "process",
  },
  {
    label: "Employee-wise",
    value: "employee",
  },
];

const RosterViewSelector = ({ selectedView, onViewChange }) => {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
      <h2 className="mb-4 text-base font-semibold text-[#0F172A]">
        Roster View
      </h2>

      <div className="flex flex-wrap gap-2">
        {rosterViews.map((view) => (
          <button
            key={view.value}
            onClick={() => onViewChange(view.value)}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              selectedView === view.value
                ? "bg-[#2563EB] text-white"
                : "border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]"
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RosterViewSelector;
