import { CalendarDays, ClipboardList, AlertTriangle } from "lucide-react";

import SummaryCard from "../common/SummaryCard";

const RosterSummaryCards = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <SummaryCard
        title="Total Days"
        count={summary?.totalDays ?? 0}
        icon={CalendarDays}
        color="bg-blue-50 text-blue-600"
      />

      <SummaryCard
        title="Total Assignments"
        count={summary?.totalAssignments ?? 0}
        icon={ClipboardList}
        color="bg-green-50 text-green-600"
      />

      <SummaryCard
        title="Total Conflicts"
        count={summary?.totalConflicts ?? 0}
        icon={AlertTriangle}
        color="bg-red-50 text-red-600"
      />
    </div>
  );
};

export default RosterSummaryCards;
