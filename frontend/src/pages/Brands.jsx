import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Plus, Pencil, Tags } from "lucide-react";

import Modal from "../components/common/Modal";
import SummaryCard from "../components/common/SummaryCard";
import StatusBadge from "../components/common/StatusBadge";
import BrandForm from "../components/brands/BrandForm";

import {
  getAllBrands,
  createBrand,
  updateBrand,
} from "../utils/redux/slices/brandSlice";

export default function Brands() {
  const dispatch = useDispatch();

  const { brands, loading, error, mutationLoading, mutationError } =
    useSelector((state) => state.brands);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    dispatch(getAllBrands());
  }, [dispatch]);

  const activeBrands = brands.filter(
    (brand) => brand.status === "ACTIVE",
  ).length;

  const inactiveBrands = brands.filter(
    (brand) => brand.status === "INACTIVE",
  ).length;

  const handleAddBrand = () => {
    setSelectedBrand(null);
    setActionError("");
    setIsModalOpen(true);
  };

  const handleEditBrand = (brand) => {
    setSelectedBrand(brand);
    setActionError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (mutationLoading) return;

    setIsModalOpen(false);
    setSelectedBrand(null);
    setActionError("");
  };

  const handleSubmit = async (formData) => {
    setActionError("");

    try {
      if (selectedBrand) {
        await dispatch(
          updateBrand({
            brandId: selectedBrand._id,
            brandData: formData,
          }),
        ).unwrap();
      } else {
        await dispatch(createBrand(formData)).unwrap();
      }

      setIsModalOpen(false);
      setSelectedBrand(null);

      // Refresh the list with the latest backend data.
      dispatch(getAllBrands());
    } catch (err) {
      setActionError(
        typeof err === "string"
          ? err
          : "Unable to save brand. Please try again.",
      );
    }
  };

  if (loading && brands.length === 0) {
    return <p className="text-slate-500">Loading brands...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Brands</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage client brands and their details.
          </p>
        </div>

        <button
          onClick={handleAddBrand}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={17} />
          Add Brand
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Brands"
          count={brands.length}
          icon={Tags}
          color="bg-blue-50 text-blue-600"
        />

        <SummaryCard
          title="Active Brands"
          count={activeBrands}
          icon={Tags}
          color="bg-green-50 text-green-600"
        />

        <SummaryCard
          title="Inactive Brands"
          count={inactiveBrands}
          icon={Tags}
          color="bg-red-50 text-red-600"
        />
      </div>

      {/* Fetch Error */}
      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {/* Brands List */}
      {brands.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <Tags className="mx-auto mb-3 text-slate-400" size={28} />

          <h2 className="font-medium text-slate-800">No brands found</h2>

          <p className="mt-1 text-sm text-slate-500">
            Add your first brand to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {brands.map((brand) => (
            <div
              key={brand._id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">{brand.name}</h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {brand.description || "No description provided."}
                  </p>
                </div>

                <StatusBadge status={brand.status} />
              </div>

              <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
                <button
                  onClick={() => handleEditBrand(brand)}
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

      {/* Add / Edit Brand Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedBrand ? "Edit Brand" : "Add Brand"}
        description={
          selectedBrand
            ? "Update the brand details."
            : "Enter the details to create a new brand."
        }
        size="md"
      >
        {(actionError || mutationError) && (
          <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {actionError || mutationError}
          </p>
        )}

        <BrandForm
          brand={selectedBrand}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          loading={mutationLoading}
        />
      </Modal>
    </div>
  );
}
