import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Plus, Pencil, Workflow } from "lucide-react";

import Modal from "../components/common/Modal";
import SummaryCard from "../components/common/SummaryCard";
import StatusBadge from "../components/common/StatusBadge";
import ProcessForm from "../components/process/ProcessForm";

import {
  getAllProcesses,
  createProcess,
  updateProcess,
} from "../utils/redux/slices/processSlice";

export default function Processes() {
  const dispatch = useDispatch();

  const { processes, loading, error, mutationLoading, mutationError } =
    useSelector((state) => state.processes);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    dispatch(getAllProcesses());
  }, [dispatch]);

  const activeProcesses = processes.filter(
    (process) => process.status === "ACTIVE",
  ).length;

  const inactiveProcesses = processes.filter(
    (process) => process.status === "INACTIVE",
  ).length;

  const handleAddProcess = () => {
    setSelectedProcess(null);
    setActionError("");
    setIsModalOpen(true);
  };

  const handleEditProcess = (process) => {
    setSelectedProcess(process);
    setActionError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (mutationLoading) return;

    setIsModalOpen(false);
    setSelectedProcess(null);
    setActionError("");
  };

  const handleSubmit = async (formData) => {
    setActionError("");

    try {
      if (selectedProcess) {
        await dispatch(
          updateProcess({
            processId: selectedProcess._id,
            processData: formData,
          }),
        ).unwrap();
      } else {
        await dispatch(createProcess(formData)).unwrap();
      }

      setIsModalOpen(false);
      setSelectedProcess(null);

      dispatch(getAllProcesses());
    } catch (err) {
      console.error("Save Process Error:", err);

      setActionError(
        typeof err === "string"
          ? err
          : err?.message || "Unable to save process.",
      );
    }
  };

  if (loading && processes.length === 0) {
    return <p className="text-slate-500">Loading processes...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Processes</h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage the processes handled by your teams.
          </p>
        </div>

        <button
          onClick={handleAddProcess}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={17} />
          Add Process
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Processes"
          count={processes.length}
          icon={Workflow}
          color="bg-blue-50 text-blue-600"
        />

        <SummaryCard
          title="Active Processes"
          count={activeProcesses}
          icon={Workflow}
          color="bg-green-50 text-green-600"
        />

        <SummaryCard
          title="Inactive Processes"
          count={inactiveProcesses}
          icon={Workflow}
          color="bg-red-50 text-red-600"
        />
      </div>

      {/* Fetch Error */}
      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {/* Process List */}
      {processes.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <Workflow className="mx-auto mb-3 text-slate-400" size={28} />

          <h2 className="font-medium text-slate-800">No processes found</h2>

          <p className="mt-1 text-sm text-slate-500">
            Add your first process to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {processes.map((process) => (
            <div
              key={process._id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    {process.name}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {process.description || "No description provided."}
                  </p>
                </div>

                <StatusBadge status={process.status} />
              </div>

              <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
                <button
                  onClick={() => handleEditProcess(process)}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  <Pencil size={15} />
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Process Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedProcess ? "Edit Process" : "Add Process"}
        description={
          selectedProcess
            ? "Update the process details."
            : "Enter the details to create a new process."
        }
        size="md"
      >
        {(actionError || mutationError) && (
          <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {actionError || mutationError}
          </p>
        )}

        <ProcessForm
          process={selectedProcess}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          loading={mutationLoading}
        />
      </Modal>
    </div>
  );
}
