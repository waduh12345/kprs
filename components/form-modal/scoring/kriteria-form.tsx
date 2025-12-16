"use client";

import { useEffect, useState } from "react";
import {
  useCreateKriteriaMutation,
  useUpdateKriteriaMutation,
} from "@/services/admin/modul/scoring/kriteria.service";
import { Kriteria } from "@/types/admin/modul/scoring/kriteria";
import Swal from "sweetalert2";

interface KriteriaFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Kriteria | null;
  isDetail?: boolean;
}

export default function KriteriaForm({
  isOpen,
  onClose,
  initialData,
  isDetail = false,
}: KriteriaFormProps) {
  // State form
  const [formData, setFormData] = useState({
    category: "",
    parameter: "",
    weight: "", // Menggunakan string untuk input, nanti dikonversi ke number saat submit
  });

  // RTK Query Hooks
  const [createKriteria, { isLoading: isCreating }] =
    useCreateKriteriaMutation();
  const [updateKriteria, { isLoading: isUpdating }] =
    useUpdateKriteriaMutation();

  // Populate data
  useEffect(() => {
    if (initialData) {
      setFormData({
        category: initialData.category,
        parameter: initialData.parameter,
        weight: String(initialData.weight),
      });
    } else {
      setFormData({
        category: "",
        parameter: "",
        weight: "",
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDetail) return;

    // Payload preparation
    const payload = {
      category: formData.category,
      parameter: formData.parameter,
      weight: Number(formData.weight),
    };

    try {
      if (initialData) {
        // Mode Update
        await updateKriteria({ id: initialData.id, payload }).unwrap();

        await Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Data kriteria berhasil diperbarui.",
          confirmButtonColor: "#0f172a",
          timer: 1500,
        });
      } else {
        // Mode Create
        await createKriteria(payload).unwrap();

        await Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Data kriteria berhasil ditambahkan.",
          confirmButtonColor: "#0f172a",
          timer: 1500,
        });
      }
      onClose();
      setFormData({ category: "", parameter: "", weight: "" });
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: "Terjadi kesalahan saat menyimpan data.",
        confirmButtonColor: "#0f172a",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold text-gray-800">
          {isDetail
            ? "Detail Kriteria"
            : initialData
            ? "Edit Kriteria"
            : "Tambah Kriteria"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Input Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Kategori
              </label>
              {/* Contoh menggunakan Select jika opsinya terbatas, atau Input Text jika bebas */}
              <input
                type="text"
                required
                disabled={isDetail}
                className={`mt-1 block w-full rounded-md border p-2 text-sm focus:border-slate-900 focus:outline-none ${
                  isDetail
                    ? "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-600"
                    : "border-gray-300"
                }`}
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                placeholder="Contoh: Capacity"
              />
            </div>

            {/* Input Parameter */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Parameter
              </label>
              <input
                type="text"
                required
                disabled={isDetail}
                className={`mt-1 block w-full rounded-md border p-2 text-sm focus:border-slate-900 focus:outline-none ${
                  isDetail
                    ? "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-600"
                    : "border-gray-300"
                }`}
                value={formData.parameter}
                onChange={(e) =>
                  setFormData({ ...formData, parameter: e.target.value })
                }
                placeholder="Contoh: Usia"
              />
            </div>

            {/* Input Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Bobot (Weight)
              </label>
              <div className="relative mt-1">
                <input
                  type="number"
                  required
                  disabled={isDetail}
                  className={`block w-full rounded-md border p-2 pr-8 text-sm focus:border-slate-900 focus:outline-none ${
                    isDetail
                      ? "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-600"
                      : "border-gray-300"
                  }`}
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: e.target.value })
                  }
                  placeholder="10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  %
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Masukkan nilai bobot dalam angka.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 transition-colors"
            >
              {isDetail ? "Tutup" : "Batal"}
            </button>

            {!isDetail && (
              <button
                type="submit"
                disabled={isCreating || isUpdating}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {isCreating || isUpdating ? "Menyimpan..." : "Simpan"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}