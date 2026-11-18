import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Layers,
  CheckCircle,
  XCircle,
} from "lucide-react";

import Modal from "../components/common/Modal";
import SummaryCard from "../components/common/SummaryCard";
import StatusBadge from "../components/common/StatusBadge";
import WorkingRuleForm from "../components/workingRule/WorkingRuleForm";

import {
  getAllWorkingRules,
  createWorkingRule,
  updateWorkingRule,
  clearWorkingRuleError,
} from "../utils/redux/slices/workingRuleSlice";

import { getAllBrands } from "../utils/redux/slices/brandSlice";
import { getAllProcesses } from "../utils/redux/slices/processSlice";

const getName = (value) =>
  typeof value === "object" && value !== null ? value.name || "-" : "-";

const formatDay = (day) => day.charAt(0) + day.slice(1).toLowerCase();

const WorkingRule = () => {
  const dispatch = useDispatch();

  const { workingRules, loading, error, mutationLoading, mutationError } =
    useSelector((state) => state.workingRules);

  const { brands } = useSelector((state) => state.brands);
  const { processes } = useSelector((state) => state.processes);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionError, setActionError] = useState("");

  const fetchPageData = useCallback(() => {
    dispatch(getAllWorkingRules());
    dispatch(getAllBrands());
    dispatch(getAllProcesses());
  }, [dispatch]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const activeCount = workingRules.filter(
    (rule) => rule.status === "ACTIVE",
  ).length;

  const inactiveCount = workingRules.filter(
    (rule) => rule.status === "INACTIVE",
  ).length;

  const filteredRules = useMemo(() => {
    return workingRules.filter((rule) => {
      const brandName = getName(rule.brandId);
      const processName = getName(rule.processId);

      const matchesSearch =
        brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        processName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || rule.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [workingRules, searchTerm, statusFilter]);

  const handleAdd = () => {
    setSelectedRule(null);
    setActionError("");
    dispatch(clearWorkingRuleError());
    setIsModalOpen(true);
  };

  const handleEdit = (rule) => {
    setSelectedRule(rule);
    setActionError("");
    dispatch(clearWorkingRuleError());
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (mutationLoading) return;

    setIsModalOpen(false);
    setSelectedRule(null);
    setActionError("");
  };

  const handleSubmit = async (formData) => {
    setActionError("");

    try {
      if (selectedRule) {
        await dispatch(
          updateWorkingRule({
            workingRuleId: selectedRule._id,
            workingRuleData: formData,
          }),
        ).unwrap();
      } else {
        await dispatch(createWorkingRule(formData)).unwrap();
      }

      setIsModalOpen(false);
      setSelectedRule(null);

      dispatch(getAllWorkingRules());
    } catch (err) {
      setActionError(
        typeof err === "string"
          ? err
          : "Unable to save working rule. Please try again.",
      );
    }
  };

  const formatStaffing = (staffing = []) => {
    if (staffing.length === 0) return "Not configured";

    return staffing
      .map((item) => `${formatDay(item.day)}: ${item.requiredEmployees}`)
      .join(", ");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Working Rules
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure operating days and staffing requirements for each brand
            and process.
          </p>
        </div>

        <button
          onClick={handleAdd}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Working Rule
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Rules"
          count={workingRules.length}
          icon={Layers}
          color="bg-blue-50 text-blue-600"
        />

        <SummaryCard
          title="Active Rules"
          count={activeCount}
          icon={CheckCircle}
          color="bg-green-50 text-green-600"
        />

        <SummaryCard
          title="Inactive Rules"
          count={inactiveCount}
          icon={XCircle}
          color="bg-red-50 text-red-600"
        />
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search by brand or process..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        <button
          onClick={fetchPageData}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Working Rules Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading working rules...
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={fetchPageData}
              className="mt-3 text-sm font-medium text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="p-10 text-center">
            <Layers className="mx-auto mb-3 text-slate-300" size={32} />
            <p className="font-medium text-slate-700">No working rules found</p>
            <p className="mt-1 text-sm text-slate-500">
              Add a working rule or change your search filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-275 text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    {[
                      "Brand",
                      "Process",
                      "Operating Days",
                      "Public Holidays",
                      "Minimum Staffing",
                      "Status",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredRules.map((rule) => (
                    <tr key={rule._id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 text-sm font-medium text-slate-800">
                        {getName(rule.brandId)}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {getName(rule.processId)}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        <div className="flex max-w-xs flex-wrap gap-1">
                          {rule.operatingDays?.map((day) => (
                            <span
                              key={day}
                              className="rounded-md bg-slate-100 px-2 py-1 text-xs"
                            >
                              {formatDay(day)}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm">
                        {rule.operatesOnPublicHolidays ? (
                          <span className="text-green-600">Yes</span>
                        ) : (
                          <span className="text-slate-500">No</span>
                        )}
                      </td>

                      <td className="max-w-xs px-5 py-4 text-sm text-slate-600">
                        {formatStaffing(rule.minimumStaffing)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={rule.status} />
                      </td>

                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleEdit(rule)}
                          title="Edit working rule"
                          className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
              Showing {filteredRules.length} of {workingRules.length} working
              rules
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedRule ? "Edit Working Rule" : "Add Working Rule"}
        description="Configure the operating schedule and staffing requirements."
        size="lg"
      >
        {actionError && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {actionError}
          </div>
        )}

        {mutationError && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {mutationError}
          </div>
        )}

        <WorkingRuleForm
          workingRule={selectedRule}
          brands={brands}
          processes={processes}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          loading={mutationLoading}
        />
      </Modal>
    </div>
  );
};

export default WorkingRule;
