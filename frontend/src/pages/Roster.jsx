import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  generateMonthlyRoster,
  getMonthlyRoster,
  getAllRosters,
  clearMonthlyRosterError,
} from "../utils/redux/slices/monthlyRosterSlice";

import { getAllPods } from "../utils/redux/slices/podSlice.js";
import { getAllProcesses } from "../utils/redux/slices/processSlice.js";
import { getAllBrands } from "../utils/redux/slices/brandSlice.js";
import { getAllEmployees } from "../utils/redux/slices/employeeSlice.js";

import RosterSummaryCards from "../components/roster/RosterSummaryCard";

import RosterEntitySelector from "../components/roster/RosterEntitySelector.jsx";
import RosterViewSelector from "../components/roster/RosterViewSelector";

import PodRosterView from "../components/roster/views/PodRosterView.jsx";
import EmployeeRosterView from "../components/roster/views/EmployeeRosterView.jsx";
import BrandRosterView from "../components/roster/views/BrandRosterView.jsx";
import ProcessRosterView from "../components/roster/views/ProcessRosterView.jsx";
import CompanyRosterView from "../components/roster/views/CompanyRosterView.jsx";

const Roster = () => {
  const dispatch = useDispatch();

  // ======================================================
  // ROSTER STATE
  // ======================================================

  const {
    roster,
    rosters,
    summary,
    rostersLoading,
    generating,
    generationError,
  } = useSelector((state) => state.monthlyRoster);

  // ======================================================
  // ENTITY DATA
  // ======================================================

  const pods = useSelector((state) => state.pods?.pods || []);

  const brands = useSelector((state) => state.brands?.brands || []);

  const processes = useSelector((state) => state.processes?.processes || []);

  const employees = useSelector((state) => state.employees?.employees || []);

  // ======================================================
  // LOCAL STATE
  // ======================================================

  const currentDate = new Date();

  const [month, setMonth] = useState(currentDate.getMonth() + 1);

  const [year, setYear] = useState(currentDate.getFullYear());

  const [selectedView, setSelectedView] = useState("company");

  const [selectedEntityId, setSelectedEntityId] = useState("");

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // ======================================================
  // FETCH INITIAL DATA
  // ======================================================

  useEffect(() => {
    dispatch(getAllRosters());
    dispatch(getAllPods());
    dispatch(getAllBrands());
    dispatch(getAllProcesses());
    dispatch(getAllEmployees());
  }, [dispatch]);

  // ======================================================
  // AUTOMATICALLY LOAD LATEST ROSTER
  // ======================================================

  useEffect(() => {
    if (rosters.length > 0 && !roster?._id) {
      dispatch(
        getMonthlyRoster({
          id: rosters[0]._id,
          page: 1,
          limit: 10,
        }),
      );
    }
  }, [rosters, roster?._id, dispatch]);

  // ======================================================
  // GENERATE MONTHLY ROSTER
  // ======================================================

  const handleGenerateRoster = async () => {
    dispatch(clearMonthlyRosterError());

    const result = await dispatch(
      generateMonthlyRoster({
        month: Number(month),
        year: Number(year),
      }),
    );

    if (generateMonthlyRoster.fulfilled.match(result)) {
      setSelectedView("company");
      setSelectedEntityId("");

      // Refresh roster list
      await dispatch(getAllRosters());

      // Load newly generated roster
      await dispatch(
        getMonthlyRoster({
          id: result.payload.rosterId,
          page: 1,
          limit: 10,
        }),
      );
    }
  };

  // ======================================================
  // SELECT EXISTING ROSTER
  // ======================================================

  const handleRosterChange = (id) => {
    setSelectedView("company");
    setSelectedEntityId("");

    if (!id) return;

    dispatch(
      getMonthlyRoster({
        id,
        page: 1,
        limit: 10,
      }),
    );
  };

  // ======================================================
  // CHANGE ROSTER VIEW
  // ======================================================

  const handleViewChange = (view) => {
    setSelectedView(view);
    setSelectedEntityId("");
  };

  // ======================================================
  // SELECT ENTITY
  // ======================================================

  const handleEntitySelect = (entityId) => {
    setSelectedEntityId(entityId);
  };

  // ======================================================
  // CURRENT ENTITY LIST
  // ======================================================

  const currentEntities =
    selectedView === "pod"
      ? pods
      : selectedView === "brand"
        ? brands
        : selectedView === "process"
          ? processes
          : selectedView === "employee"
            ? employees
            : [];

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* PAGE HEADER */}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-[#0F172A]">
              Monthly Roster
            </h1>

            <p className="mt-1 text-sm text-[#64748B]">
              Generate and manage monthly employee schedules.
            </p>
          </div>

          <button
            onClick={handleGenerateRoster}
            disabled={generating}
            className="rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? "Generating..." : "Generate Roster"}
          </button>
        </div>

        {/* ROSTER PERIOD */}

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-[#0F172A]">
            Roster Period
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* MONTH */}

            <div>
              <label className="mb-2 block text-sm font-medium text-[#334155]">
                Month
              </label>

              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
              >
                {months.map((item, index) => (
                  <option key={item} value={index + 1}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* YEAR */}

            <div>
              <label className="mb-2 block text-sm font-medium text-[#334155]">
                Year
              </label>

              <input
                type="number"
                min="2020"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB]"
              />
            </div>

            {/* EXISTING ROSTERS */}

            <div>
              <label className="mb-2 block text-sm font-medium text-[#334155]">
                Existing Rosters
              </label>

              <select
                value={roster?._id || ""}
                onChange={(e) => handleRosterChange(e.target.value)}
                disabled={rostersLoading}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] disabled:bg-slate-50"
              >
                <option value="">
                  {rostersLoading ? "Loading rosters..." : "Select a roster"}
                </option>

                {rosters.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* GENERATION ERROR */}

        {generationError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {generationError}
          </div>
        )}

        {/* ROSTER VIEW SELECTOR */}

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-[#0F172A]">
            Roster View
          </h2>

          <RosterViewSelector
            selectedView={selectedView}
            onViewChange={handleViewChange}
          />
        </div>

        {/* ENTITY SELECTOR */}

        {selectedView !== "company" && (
          <RosterEntitySelector
            view={selectedView}
            entities={currentEntities}
            selectedEntityId={selectedEntityId}
            onSelect={handleEntitySelect}
          />
        )}

        {/* COMPANY-WIDE SUMMARY */}

        {selectedView === "company" && <RosterSummaryCards summary={summary} />}

        {/* COMPANY-WIDE VIEW */}

        {selectedView === "company" && roster?._id && (
          <CompanyRosterView
            rosterId={roster._id}
            roster={roster}
            employees={employees}
            brands={brands}
            processes={processes}
          />
        )}

        {/* POD-WISE VIEW */}

        {selectedView === "pod" && roster?._id && selectedEntityId && (
          <PodRosterView
            rosterId={roster._id}
            podId={selectedEntityId}
            employees={employees}
            brands={brands}
            processes={processes}
          />
        )}

        {/* BRAND-WISE VIEW */}

        {selectedView === "brand" && roster?._id && selectedEntityId && (
          <BrandRosterView
            rosterId={roster._id}
            brandId={selectedEntityId}
            employees={employees}
            brands={brands}
            processes={processes}
          />
        )}

        {/* PROCESS-WISE VIEW */}

        {selectedView === "process" && roster?._id && selectedEntityId && (
          <ProcessRosterView
            rosterId={roster._id}
            processId={selectedEntityId}
            employees={employees}
            brands={brands}
            processes={processes}
          />
        )}

        {/* EMPLOYEE-WISE VIEW */}

        {selectedView === "employee" && roster?._id && selectedEntityId && (
          <EmployeeRosterView
            rosterId={roster._id}
            employeeId={selectedEntityId}
            employees={employees}
            brands={brands}
            processes={processes}
          />
        )}
      </div>
    </div>
  );
};

export default Roster;
