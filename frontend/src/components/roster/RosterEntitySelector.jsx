const RosterEntitySelector = ({
  view,
  entities = [],
  selectedEntityId,
  onSelect,
  loading = false,
}) => {
  if (view === "company") return null;

  const getEntityName = (entity) => {
    switch (view) {
      case "pod":
        return entity.name;

      case "brand":
        return entity.name;

      case "process":
        return entity.name;

      case "employee":
        return `${entity.firstName} ${entity.lastName}`;

      default:
        return "Unknown";
    }
  };

  const getEntitySubtitle = (entity) => {
    switch (view) {
      case "pod":
        return entity.lead
          ? `Lead: ${entity.lead.firstName} ${entity.lead.lastName}`
          : "Employee Pod";

      case "brand":
        return entity.description || "Brand";

      case "process":
        return entity.description || "Process";

      case "employee":
        return entity.employeeCode || "Employee";

      default:
        return "";
    }
  };

  const getEntityIcon = () => {
    switch (view) {
      case "pod":
        return "👥";

      case "brand":
        return "🏢";

      case "process":
        return "⚙️";

      case "employee":
        return "👤";

      default:
        return "📋";
    }
  };

  const getTitle = () => {
    switch (view) {
      case "pod":
        return "Select Pod";

      case "brand":
        return "Select Brand";

      case "process":
        return "Select Process";

      case "employee":
        return "Select Employee";

      default:
        return "Select Entity";
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
        <p className="text-sm text-[#64748B]">Loading {view}s...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-[#0F172A]">{getTitle()}</h2>

        <p className="mt-1 text-sm text-[#64748B]">
          Select an entity to view its roster.
        </p>
      </div>

      {entities.length === 0 ? (
        <div className="rounded-lg bg-[#F8FAFC] p-6 text-center">
          <p className="text-sm text-[#64748B]">No {view}s found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {entities.map((entity) => {
            const entityId = entity._id;

            const isSelected = selectedEntityId === entityId;

            return (
              <button
                key={entityId}
                type="button"
                onClick={() => onSelect(entityId)}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? "border-[#2563EB] bg-[#EFF6FF] ring-1 ring-[#2563EB]"
                    : "border-[#E2E8F0] bg-white hover:border-[#93C5FD] hover:bg-[#F8FAFC]"
                }`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl ${
                    isSelected ? "bg-[#DBEAFE]" : "bg-[#F1F5F9]"
                  }`}
                >
                  {getEntityIcon()}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm font-medium ${
                      isSelected ? "text-[#1D4ED8]" : "text-[#0F172A]"
                    }`}
                  >
                    {getEntityName(entity)}
                  </p>

                  <p className="mt-1 truncate text-xs text-[#64748B]">
                    {getEntitySubtitle(entity)}
                  </p>
                </div>

                {isSelected && (
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-xs text-white">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RosterEntitySelector;
