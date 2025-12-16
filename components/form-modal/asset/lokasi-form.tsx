"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  useCreateLocationMutation,
  useUpdateLocationMutation,
} from "@/services/admin/modul/asset/location.service";
import { Location } from "@/types/admin/modul/assset/location";
import Swal from "sweetalert2";

interface LocationFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Location | null; // Jika ada data, berarti mode Edit
  isDetail?: boolean; // Prop baru untuk mode read-only
}

export default function LocationForm({
  isOpen,
  onClose,
  initialData,
  isDetail = false, // Default false jika tidak dikirim
}: LocationFormProps) {
  // Ambil data session
  const { data: session } = useSession();

  // State form
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    latitude: "",
    longitude: "",
  });

  // RTK Query Hooks
  const [createLocation, { isLoading: isCreating }] =
    useCreateLocationMutation();
  const [updateLocation, { isLoading: isUpdating }] =
    useUpdateLocationMutation();

  // Populate data jika mode edit atau detail
  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code,
        name: initialData.name,
        description: initialData.description,
        latitude: initialData.latitude,
        longitude: initialData.longitude,
      });
    } else {
      setFormData({
        code: "",
        name: "",
        description: "",
        latitude: "",
        longitude: "",
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Cegah submit jika mode detail
    if (isDetail) return;

    const userId = session?.user?.id;

    if (!userId) {
      Swal.fire({
        icon: "error",
        title: "Akses Ditolak",
        text: "Sesi pengguna tidak valid. Silakan login ulang.",
      });
      return;
    }

    // Siapkan payload dengan pic_id dari session
    const payload = {
      ...formData,
      pic_id: Number(userId), // Pastikan format number
    };

    try {
      if (initialData) {
        // Mode Update
        await updateLocation({ id: initialData.id, payload }).unwrap();

        await Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Data lokasi berhasil diperbarui.",
          confirmButtonColor: "#0f172a",
          timer: 1500,
        });
      } else {
        // Mode Create
        await createLocation(payload).unwrap();

        await Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Data lokasi berhasil ditambahkan.",
          confirmButtonColor: "#0f172a",
          timer: 1500,
        });
      }
      onClose();
      setFormData({
        code: "",
        name: "",
        description: "",
        latitude: "",
        longitude: "",
      });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-xl font-bold text-gray-800">
          {/* Logic Judul Modal */}
          {isDetail
            ? "Detail Lokasi Asset"
            : initialData
            ? "Edit Lokasi Asset"
            : "Tambah Lokasi Asset"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Input Kode */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Kode Lokasi
              </label>
              <input
                type="text"
                required
                disabled={isDetail} // Read only jika detail
                className={`mt-1 block w-full rounded-md border p-2 text-sm focus:border-blue-500 focus:ring-blue-500 ${
                  isDetail
                    ? "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-600"
                    : "border-gray-300"
                }`}
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="Contoh: 001"
              />
            </div>

            {/* Input Nama */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nama Lokasi
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
                placeholder="Contoh: Warehouse Cimahi"
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
                rows={2}
                disabled={isDetail}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Deskripsi singkat lokasi..."
              />
            </div>

            {/* Grid Latitude & Longitude */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Latitude
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
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData({ ...formData, latitude: e.target.value })
                  }
                  placeholder="-6.899541"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Longitude
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
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData({ ...formData, longitude: e.target.value })
                  }
                  placeholder="107.533867"
                />
              </div>
            </div>

            {!isDetail && (
              <p className="text-xs text-gray-500 italic">
                *PIC ID akan otomatis diambil dari user yang login saat ini.
              </p>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              {isDetail ? "Tutup" : "Batal"}
            </button>

            {/* Sembunyikan tombol simpan jika sedang mode detail */}
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