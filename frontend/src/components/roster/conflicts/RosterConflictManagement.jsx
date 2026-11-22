import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Loader2,
  CheckCircle,
} from "lucide-react";

import SummaryCard from "../../common/SummaryCard";

import ConflictFilters from "./ConflictFilters";
import ConflictTable from "./ConflictTable";
import ConflictDetailsModal from "./ConflictDetailsModal";
import Modal from "../../common/Modal";
import RosterConflictForm from "./RosterConflictForm";

import {
  fetchRosterConflicts,
  validateRoster,
  clearEligibleEmployees,
  resolveRosterConflict,
} from "../../../utils/redux/slices/rosterConflictSlice";

const RosterConflictManagement = ({ rosterId }) => {
  const dispatch = useDispatch();

  /* --------------------------------------------------
     Redux State
  -------------------------------------------------- */

  const { conflicts, statusCounts, loading, validating, resolving, error } =
    useSelector((state) => state.rosterConflict);

  /* --------------------------------------------------
     Local State
  -------------------------------------------------- */

  const [filters, setFilters] = useState({
    status: "",
    type: "",
    date: "",
  });

  const [selectedConflict, setSelectedConflict] = useState(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

  //  Get Active Filters

  const getActiveFilters = () => {
    const activeFilters = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        activeFilters[key] = value;
      }
    });

    return activeFilters;
  };

  //  Fetch Conflicts

  useEffect(() => {
    console.log("Roster ID:", rosterId);
    console.log("Current Filters:", filters);

    if (!rosterId) {
      console.log("Roster ID is missing. API not called.");
      return;
    }

    const activeFilters = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        activeFilters[key] = value;
      }
    });

    console.log("Fetching roster conflicts with:", activeFilters);

    dispatch(
      fetchRosterConflicts({
        rosterId,
        filters: activeFilters,
      }),
    );
  }, [rosterId, filters, dispatch]);

  //  Refresh Conflicts

  const handleRefresh = () => {
    if (!rosterId) return;

    dispatch(
      fetchRosterConflicts({
        rosterId,
        filters: getActiveFilters(),
      }),
    );
  };

  //  Validate Roster

  const handleValidateRoster = async () => {
    if (!rosterId) return;

    try {
      await dispatch(validateRoster(rosterId)).unwrap();

      handleRefresh();
    } catch (error) {
      console.error("Roster validation failed:", error);
    }
  };

  //  Filters

  const handleFilterChange = (updatedFilters) => {
    setFilters(updatedFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      status: "",
      type: "",
      date: "",
    });
  };

  //  View Conflict Details

  const handleViewDetails = (conflict) => {
    setSelectedConflict(conflict);

    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);

    setSelectedConflict(null);
  };

  //  Resolve Conflict

  const handleResolveConflict = (conflict) => {
    setSelectedConflict(conflict);

    dispatch(clearEligibleEmployees());

    setIsResolveModalOpen(true);
  };

  const handleCloseResolveModal = () => {
    setIsResolveModalOpen(false);

    setSelectedConflict(null);

    dispatch(clearEligibleEmployees());
  };

  //  Submit Conflict Resolution
  const handleSubmitResolution = async ({ employeeId, resolutionNotes }) => {
    if (!selectedConflict?._id || !employeeId) {
      return;
    }

    try {
      await dispatch(
        resolveRosterConflict({
          conflictId: selectedConflict._id,
          employeeId,
          resolutionNotes,
        }),
      ).unwrap();

      handleCloseResolveModal();

      handleRefresh();
    } catch (error) {
      console.error("Conflict resolution failed:", error);
    }
  };

  //  No Roster Selected
  if (!rosterId) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
        <AlertTriangle size={32} className="mx-auto mb-3 text-amber-500" />

        <p className="font-medium text-slate-700">
          Please select a roster to manage conflicts.
        </p>
      </div>
    );
  }

  //  UI
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Conflict Management
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Monitor, validate, and resolve roster conflicts.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Refresh */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          {/* Validate Roster */}
          <button
            type="button"
            onClick={handleValidateRoster}
            disabled={validating}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {validating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ShieldCheck size={16} />
            )}

            {validating ? "Validating..." : "Validate Roster"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Open Conflicts"
          count={statusCounts?.OPEN || 0}
          icon={AlertTriangle}
          color="bg-red-50 text-red-600"
        />

        <SummaryCard
          title="Resolved"
          count={statusCounts?.RESOLVED || 0}
          icon={ShieldCheck}
          color="bg-green-50 text-green-600"
        />

        <SummaryCard
          title="Ignored"
          count={statusCounts?.IGNORED || 0}
          icon={AlertTriangle}
          color="bg-slate-100 text-slate-600"
        />

        <SummaryCard
          title="Total Conflicts"
          count={
            (statusCounts?.OPEN || 0) +
            (statusCounts?.RESOLVED || 0) +
            (statusCounts?.IGNORED || 0)
          }
          icon={AlertTriangle}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Filters */}
      <ConflictFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Conflict Table */}
      <ConflictTable
        conflicts={conflicts}
        loading={loading}
        onViewDetails={handleViewDetails}
        onResolve={handleResolveConflict}
      />

      {/* Details Modal */}
      <ConflictDetailsModal
        isOpen={isDetailsModalOpen}
        conflict={selectedConflict}
        onClose={handleCloseDetailsModal}
      />

      {/* Resolve Conflict Modal */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={handleCloseResolveModal}
        title="Resolve Conflict"
        description="Select an eligible employee to resolve the staffing conflict."
        size="lg"
        footer={
          <>
            {/* Cancel */}
            <button
              type="button"
              onClick={handleCloseResolveModal}
              disabled={resolving}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            {/* Submit Resolution */}
            <button
              type="submit"
              form="rosterConflictForm"
              disabled={resolving}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resolving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Resolving...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Resolve Conflict
                </>
              )}
            </button>
          </>
        }
      >
        <RosterConflictForm
          conflict={selectedConflict}
          onSubmit={handleSubmitResolution}
        />
      </Modal>
    </div>
  );
};

export default RosterConflictManagement;

// const RosterConflictManagement = ({ rosterId }) => {
//   const dispatch = useDispatch();

//   const { conflicts, statusCounts, loading, validating, error } = useSelector(
//     (state) => state.rosterConflict,
//   );

//   const [filters, setFilters] = useState({
//     status: "",
//     type: "",
//     date: "",
//   });

//   const [selectedConflict, setSelectedConflict] = useState(null);

//   const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

//   const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

//   /* --------------------------------------------------
//      Get Active Filters
//   -------------------------------------------------- */

//   const getActiveFilters = () => {
//     const activeFilters = {};

//     Object.entries(filters).forEach(([key, value]) => {
//       if (value) {
//         activeFilters[key] = value;
//       }
//     });

//     return activeFilters;
//   };

//   /* --------------------------------------------------
//      Fetch Conflicts
//   -------------------------------------------------- */
//   /* --------------------------------------------------
//    Fetch Conflicts
// -------------------------------------------------- */

//   useEffect(() => {
//     console.log("Roster ID:", rosterId);
//     console.log("Current Filters:", filters);

//     if (!rosterId) {
//       console.log("Roster ID is missing. API not called.");
//       return;
//     }

//     const activeFilters = {};

//     Object.entries(filters).forEach(([key, value]) => {
//       if (value) {
//         activeFilters[key] = value;
//       }
//     });

//     console.log("Fetching roster conflicts with:", activeFilters);

//     dispatch(
//       fetchRosterConflicts({
//         rosterId,
//         filters: activeFilters,
//       }),
//     );
//   }, [rosterId, filters, dispatch]);

//   /* --------------------------------------------------
//      Refresh Conflicts
//   -------------------------------------------------- */

//   const handleRefresh = () => {
//     if (!rosterId) return;

//     dispatch(
//       fetchRosterConflicts({
//         rosterId,
//         filters: getActiveFilters(),
//       }),
//     );
//   };

//   /* --------------------------------------------------
//      Validate Roster
//   -------------------------------------------------- */

//   const handleValidateRoster = async () => {
//     if (!rosterId) return;

//     try {
//       await dispatch(validateRoster(rosterId)).unwrap();

//       handleRefresh();
//     } catch (error) {
//       console.error("Roster validation failed:", error);
//     }
//   };

//   /* --------------------------------------------------
//      Filters
//   -------------------------------------------------- */

//   const handleFilterChange = (updatedFilters) => {
//     setFilters(updatedFilters);
//   };

//   const handleClearFilters = () => {
//     setFilters({
//       status: "",
//       type: "",
//       date: "",
//     });
//   };

//   /* --------------------------------------------------
//      View Conflict Details
//   -------------------------------------------------- */

//   const handleViewDetails = (conflict) => {
//     setSelectedConflict(conflict);
//     setIsDetailsModalOpen(true);
//   };

//   const handleCloseDetailsModal = () => {
//     setIsDetailsModalOpen(false);
//     setSelectedConflict(null);
//   };

//   /* --------------------------------------------------
//      Resolve Conflict
//   -------------------------------------------------- */

//   const handleResolveConflict = (conflict) => {
//     setSelectedConflict(conflict);

//     dispatch(clearEligibleEmployees());

//     setIsResolveModalOpen(true);
//   };

//   const handleCloseResolveModal = () => {
//     setIsResolveModalOpen(false);
//     setSelectedConflict(null);

//     dispatch(clearEligibleEmployees());
//   };

//   const handleResolutionSuccess = () => {
//     handleRefresh();
//   };

//   /* --------------------------------------------------
//      No Roster Selected
//   -------------------------------------------------- */

//   if (!rosterId) {
//     return (
//       <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
//         <AlertTriangle size={32} className="mx-auto mb-3 text-amber-500" />

//         <p className="font-medium text-slate-700">
//           Please select a roster to manage conflicts.
//         </p>
//       </div>
//     );
//   }

//   /* --------------------------------------------------
//      UI
//   -------------------------------------------------- */

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h2 className="text-xl font-semibold text-slate-900">
//             Conflict Management
//           </h2>

//           <p className="mt-1 text-sm text-slate-500">
//             Monitor, validate, and resolve roster conflicts.
//           </p>
//         </div>

//         <div className="flex flex-wrap gap-2">
//           {/* Refresh */}
//           <button
//             type="button"
//             onClick={handleRefresh}
//             disabled={loading}
//             className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
//           >
//             <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
//             Refresh
//           </button>

//           {/* Validate Roster */}
//           <button
//             type="button"
//             onClick={handleValidateRoster}
//             disabled={validating}
//             className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
//           >
//             <ShieldCheck size={16} />

//             {validating ? "Validating..." : "Validate Roster"}
//           </button>
//         </div>
//       </div>

//       {/* Summary Cards */}
//       <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
//         <SummaryCard
//           title="Open Conflicts"
//           count={statusCounts?.OPEN || 0}
//           icon={AlertTriangle}
//           color="bg-red-50 text-red-600"
//         />

//         <SummaryCard
//           title="Resolved"
//           count={statusCounts?.RESOLVED || 0}
//           icon={ShieldCheck}
//           color="bg-green-50 text-green-600"
//         />

//         <SummaryCard
//           title="Ignored"
//           count={statusCounts?.IGNORED || 0}
//           icon={AlertTriangle}
//           color="bg-slate-100 text-slate-600"
//         />

//         <SummaryCard
//           title="Total Conflicts"
//           count={
//             (statusCounts?.OPEN || 0) +
//             (statusCounts?.RESOLVED || 0) +
//             (statusCounts?.IGNORED || 0)
//           }
//           icon={AlertTriangle}
//           color="bg-amber-50 text-amber-600"
//         />
//       </div>

//       {/* Filters */}
//       <ConflictFilters
//         filters={filters}
//         onFilterChange={handleFilterChange}
//         onClearFilters={handleClearFilters}
//       />

//       {/* Error */}
//       {error && (
//         <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
//           {error}
//         </div>
//       )}

//       {/* Conflict Table */}
//       <ConflictTable
//         conflicts={conflicts}
//         loading={loading}
//         onViewDetails={handleViewDetails}
//         onResolve={handleResolveConflict}
//       />

//       {/* Details Modal */}
//       <ConflictDetailsModal
//         isOpen={isDetailsModalOpen}
//         conflict={selectedConflict}
//         onClose={handleCloseDetailsModal}
//       />

//       {/* Resolve Modal */}
//       <ResolveConflictModal
//         isOpen={isResolveModalOpen}
//         conflict={selectedConflict}
//         onClose={handleCloseResolveModal}
//         onResolved={handleResolutionSuccess}
//       />
//     </div>
//   );
// };

// export default RosterConflictManagement;
