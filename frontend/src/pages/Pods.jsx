import {
  getAllPods,
  createPod,
  updatePod,
} from "../utils/redux/slices/podSlice";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Users, UserCheck, UserX, Pencil } from "lucide-react";

import Modal from "../components/common/Modal";
import SummaryCard from "../components/common/SummaryCard";
import StatusBadge from "../components/common/StatusBadge";
import PodForm from "../components/pod/PodForm";
import PodEmployeesModal from "../components/pod/PodEmployeesModal";

import {
  getAllEmployees,
  assignEmployeeToPod,
} from "../utils/redux/slices/employeeSlice";

export default function Pods() {
  const dispatch = useDispatch();

  // Redux state
  const { pods, loading, error } = useSelector((state) => state.pods);

  const { employees, mutationLoading } = useSelector(
    (state) => state.employees,
  );

  // Add/Edit Pod modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPod, setSelectedPod] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  // Manage Employees modal state
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employeePod, setEmployeePod] = useState(null);
  const [assignmentError, setAssignmentError] = useState("");

  // Fetch Pods and Employees
  useEffect(() => {
    dispatch(getAllPods());
    dispatch(getAllEmployees());
  }, [dispatch]);

  // Summary counts
  const activePods = pods.filter((pod) => pod.status === "ACTIVE");

  const inactivePods = pods.filter((pod) => pod.status === "INACTIVE");

  // Add/Edit Pod handlers

  const handleAddPod = () => {
    setSelectedPod(null);
    setActionError("");
    setIsModalOpen(true);
  };

  const handleEditPod = (pod) => {
    setSelectedPod(pod);
    setActionError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (submitting) return;

    setIsModalOpen(false);
    setSelectedPod(null);
    setActionError("");
  };

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setActionError("");

    try {
      if (selectedPod) {
        const { ...podData } = formData;

        await dispatch(
          updatePod({
            podId: selectedPod._id,
            podData,
          }),
        ).unwrap();
      } else {
        // Create Pod with selected employees
        await dispatch(createPod(formData)).unwrap();
      }

      await Promise.all([dispatch(getAllPods()), dispatch(getAllEmployees())]);

      setIsModalOpen(false);
      setSelectedPod(null);
    } catch (err) {
      setActionError(
        typeof err === "string"
          ? err
          : err?.message || "Unable to save Pod. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Manage Employees handlers
  const handleManageEmployees = (pod) => {
    setEmployeePod(pod);
    setAssignmentError("");
    setIsEmployeeModalOpen(true);
  };

  const handleCloseEmployeeModal = () => {
    if (mutationLoading) return;

    setIsEmployeeModalOpen(false);
    setEmployeePod(null);
    setAssignmentError("");
  };

  // Assign employee to selected Pod
  const handleAssignEmployee = async (employeeId) => {
    setAssignmentError("");

    try {
      await dispatch(
        assignEmployeeToPod({
          employeeId,
          podId: employeePod._id,
        }),
      ).unwrap();

      await Promise.all([dispatch(getAllPods()), dispatch(getAllEmployees())]);

      return true;
    } catch (err) {
      setAssignmentError(
        typeof err === "string"
          ? err
          : err?.message || "Failed to assign employee.",
      );

      return false;
    }
  };
  // Remove employee from selected Pod

  const handleRemoveEmployee = async (employeeId) => {
    setAssignmentError("");

    try {
      await dispatch(
        assignEmployeeToPod({
          employeeId,
          podId: null,
        }),
      ).unwrap();

      await Promise.all([dispatch(getAllPods()), dispatch(getAllEmployees())]);
    } catch (err) {
      setAssignmentError(
        typeof err === "string"
          ? err
          : err?.message || "Failed to remove employee.",
      );
    }
  };

  // --------------------------------
  // Loading and error states
  // --------------------------------

  if (loading && pods.length === 0) {
    return <p className="p-6 text-slate-500">Loading Pods...</p>;
  }

  if (error && pods.length === 0) {
    return <p className="p-6 text-red-600">{error}</p>;
  }

  // --------------------------------
  // Main UI
  // --------------------------------

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Pods</h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage teams and their employee assignments.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddPod}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={17} />
          Add Pod
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Pods"
          count={pods.length}
          icon={Users}
          color="bg-blue-50 text-blue-600"
        />

        <SummaryCard
          title="Active Pods"
          count={activePods.length}
          icon={UserCheck}
          color="bg-green-50 text-green-600"
        />

        <SummaryCard
          title="Inactive Pods"
          count={inactivePods.length}
          icon={UserX}
          color="bg-red-50 text-red-600"
        />
      </div>

      {/* Pod list */}
      {pods.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <Users className="mx-auto mb-3 text-slate-400" size={32} />

          <h2 className="font-medium text-slate-800">No Pods created yet</h2>

          <p className="mt-1 text-sm text-slate-500">
            Create your first Pod to organize employees into teams.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pods.map((pod) => (
            <div
              key={pod._id}
              className="rounded-lg border border-slate-200 bg-white p-5"
            >
              {/* Pod details */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">{pod.name}</h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {pod.description || "No description provided"}
                  </p>
                </div>

                <StatusBadge status={pod.status} />
              </div>

              {/* Pod actions */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Users size={17} />

                  <span>{pod.employeeCount || 0} Employees</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleManageEmployees(pod)}
                    className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                  >
                    <Users size={15} />
                    Manage
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEditPod(pod)}
                    className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                  >
                    <Pencil size={15} />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Pod modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedPod ? "Edit Pod" : "Create Pod"}
        description={
          selectedPod
            ? "Update the Pod details."
            : "Create a Pod and assign employees to it."
        }
        size="lg"
      >
        {actionError && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {actionError}
          </p>
        )}

        <PodForm
          pod={selectedPod}
          employees={employees}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          loading={submitting}
        />
      </Modal>

      {/* Manage Employees modal */}
      <PodEmployeesModal
        isOpen={isEmployeeModalOpen}
        onClose={handleCloseEmployeeModal}
        pod={employeePod}
        employees={employees}
        onAssign={handleAssignEmployee}
        onRemove={handleRemoveEmployee}
        loading={mutationLoading}
        error={assignmentError}
      />
    </div>
  );
}
