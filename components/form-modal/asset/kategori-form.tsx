"use client";

import { useEffect, useState } from "react";
import {
  useCreateAssetCategoryMutation,
  useUpdateAssetCategoryMutation,
} from "@/services/admin/modul/asset/kategori.service";
import { KategoriAsset } from "@/types/admin/modul/assset/kategori";
// Import SweetAlert2
import Swal from "sweetalert2";

interface AssetCategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: KategoriAsset | null; // Jika ada data, berarti mode Edit
  isDetail?: boolean; // Prop baru untuk mode detail (read only)
}

export default function AssetCategoryForm({
  isOpen,
  onClose,
  initialData,
  isDetail = false, // Default false
}: AssetCategoryFormProps) {
  // State form
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
  });

  // RTK Query Hooks
  const [createAsset, { isLoading: isCreating }] =
    useCreateAssetCategoryMutation();
  const [updateAsset, { isLoading: isUpdating }] =
    useUpdateAssetCategoryMutation();

  // Populate data jika mode edit/detail
  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code,
        name: initialData.name,
        description: initialData.description,
      });
    } else {
      setFormData({ code: "", name: "", description: "" });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Jika mode detail, tidak boleh submit
    if (isDetail) return;

    try {
      if (initialData) {
        // Mode Update
        await updateAsset({ id: initialData.id, payload: formData }).unwrap();

        await Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Data berhasil diperbarui.",
          confirmButtonColor: "#0f172a", // Slate-900
          timer: 1500, // Otomatis tutup setelah 1.5 detik (opsional)
        });
      } else {
        // Mode Create
        await createAsset(formData).unwrap();

        await Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Data berhasil ditambahkan.",
          confirmButtonColor: "#0f172a", // Slate-900
          timer: 1500,
        });
      }
      onClose(); // Tutup modal setelah sukses
      setFormData({ code: "", name: "", description: "" }); // Reset form
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: "Terjadi kesalahan saat menyimpan data.",
        confirmButtonColor: "#0f172a", // Slate-900
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold text-gray-800">
          {isDetail
            ? "Detail Kategori Asset"
            : initialData
            ? "Edit Kategori Asset"
            : "Tambah Kategori Asset"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Input Kode */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Kode Kategori
              </label>
              <input
                type="text"
                required
                disabled={isDetail}
                className={`mt-1 block w-full rounded-md border p-2 text-sm focus:border-blue-500 focus:ring-blue-500 ${
                  isDetail
                    ? "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-600"
                    : "border-gray-300"
                }`}
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="Contoh: ELK"
              />
            </div>

            {/* Input Nama */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nama Kategori
              </label>
              <input
                type="text"
                required
                disabled={isDetail}
                className={`mt-1 block w-full rounded-md border p-2 text-sm focus:border-blue-500 focus:ring-blue-500 ${
                  isDetail
                    ? "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-600"
                    : "border-gray-300"
                }`}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Contoh: Elektronik"
              />
            </div>

            {/* Input Deskripsi */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Deskripsi
              </label>
              <textarea
                className={`mt-1 block w-full rounded-md border p-2 text-sm focus:border-blue-500 focus:ring-blue-500 ${
                  isDetail
                    ? "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-600"
                    : "border-gray-300"
                }`}
                rows={3}
                disabled={isDetail}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Deskripsi singkat..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              {isDetail ? "Tutup" : "Batal"}
            </button>

            {!isDetail && (
              <button
                type="submit"
                disabled={isCreating || isUpdating}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
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