"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  useCreateAssetDataMutation,
  useUpdateAssetDataMutation,
} from "@/services/admin/modul/asset/data.service";
import { useGetAssetCategoryListQuery } from "@/services/admin/modul/asset/kategori.service";
import { useGetLocationListQuery } from "@/services/admin/modul/asset/location.service";
import { DataAsset } from "@/types/admin/modul/assset/data";
import Swal from "sweetalert2";
import { Combobox } from "@/components/ui/combo-box";
import { formatRupiah, parseRupiah, formatDateForInput } from "@/lib/format-utils";

interface DataAssetFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: DataAsset | null;
  isDetail?: boolean;
}

export default function DataAssetForm({
  isOpen,
  onClose,
  initialData,
  isDetail = false,
}: DataAssetFormProps) {
  const { data: session } = useSession();

  // State Form
  const [formData, setFormData] = useState({
    asset_category_id: 0,
    asset_location_id: 0,
    code: "",
    name: "",
    description: "",
    acquired_at: "",
    acquired_value: 0, // Dalam number murni
    depreciation_method: "straight_line",
    useful_life_years: 0,
    salvage_value: 0, // Dalam number murni
    condition: "Good",
    status: true, // boolean
  });

  // State tampilan untuk input currency (string terformat)
  const [displayAcquiredValue, setDisplayAcquiredValue] = useState("");
  const [displaySalvageValue, setDisplaySalvageValue] = useState("");

  // RTK Query Hooks
  const [createAsset, { isLoading: isCreating }] = useCreateAssetDataMutation();
  const [updateAsset, { isLoading: isUpdating }] = useUpdateAssetDataMutation();

  // Load Data Kategori & Lokasi untuk Combobox
  // Kita ambil semua data (paginate besar) atau buat endpoint khusus 'list' tanpa pagination di backend
  // Di sini kita contohkan ambil paginate 100 agar cukup banyak
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useGetAssetCategoryListQuery({ page: 1, paginate: 100 });
  const { data: locationsData, isLoading: isLoadingLocations } =
    useGetLocationListQuery({ page: 1, paginate: 100 });

  // Populate Data saat Edit/Detail
  useEffect(() => {
    if (initialData) {
      setFormData({
        asset_category_id: initialData.asset_category_id,
        asset_location_id: initialData.asset_location_id,
        code: initialData.code,
        name: initialData.name,
        description: initialData.description,
        acquired_at: formatDateForInput(initialData.acquired_at),
        acquired_value: initialData.acquired_value,
        depreciation_method: initialData.depreciation_method,
        useful_life_years: initialData.useful_life_years,
        salvage_value: initialData.salvage_value,
        condition: initialData.condition,
        status: Boolean(initialData.status),
      });

      // Set display value untuk rupiah
      setDisplayAcquiredValue(formatRupiah(initialData.acquired_value));
      setDisplaySalvageValue(formatRupiah(initialData.salvage_value));
    } else {
      // Reset form
      setFormData({
        asset_category_id: 0,
        asset_location_id: 0,
        code: "",
        name: "",
        description: "",
        acquired_at: "",
        acquired_value: 0,
        depreciation_method: "straight_line",
        useful_life_years: 0,
        salvage_value: 0,
        condition: "Good",
        status: true,
      });
      setDisplayAcquiredValue("");
      setDisplaySalvageValue("");
    }
  }, [initialData, isOpen]);

  // Handlers Input Rupiah
  const handleAcquiredValueChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const raw = e.target.value;
    const parsed = parseRupiah(raw);
    setFormData((prev) => ({ ...prev, acquired_value: parsed }));
    setDisplayAcquiredValue(formatRupiah(raw));
  };

  const handleSalvageValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = parseRupiah(raw);
    setFormData((prev) => ({ ...prev, salvage_value: parsed }));
    setDisplaySalvageValue(formatRupiah(raw));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDetail) return;

    const userId = session?.user?.id;

    if (!userId) {
      Swal.fire({
        icon: "error",
        title: "Akses Ditolak",
        text: "Sesi pengguna tidak valid.",
      });
      return;
    }

    // Validasi Combobox
    if (!formData.asset_category_id || !formData.asset_location_id) {
      Swal.fire({
        icon: "warning",
        title: "Data Tidak Lengkap",
        text: "Mohon pilih Kategori dan Lokasi Asset.",
      });
      return;
    }

    const payload = {
      ...formData,
      pic_id: Number(userId),
    };

    try {
      if (initialData) {
        await updateAsset({ id: initialData.id, payload }).unwrap();
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Data asset berhasil diperbarui.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await createAsset(payload).unwrap();
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Data asset berhasil ditambahkan.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving asset:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: "Terjadi kesalahan saat menyimpan data.",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="mb-6 text-xl font-bold text-gray-800 border-b pb-2">
          {isDetail
            ? "Detail Data Asset"
            : initialData
            ? "Edit Data Asset"
            : "Tambah Data Asset"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kolom Kiri */}
            <div className="space-y-4">
              {/* Kategori (Combobox) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori Asset
                </label>
                <Combobox
                  value={formData.asset_category_id || null}
                  onChange={(val) =>
                    setFormData({ ...formData, asset_category_id: val })
                  }
                  data={categoriesData?.data || []}
                  isLoading={isLoadingCategories}
                  placeholder="Pilih Kategori"
                  getOptionLabel={(item) => `${item.code} - ${item.name}`}
                  disabled={isDetail}
                />
              </div>

              {/* Lokasi (Combobox) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lokasi Asset
                </label>
                <Combobox
                  value={formData.asset_location_id || null}
                  onChange={(val) =>
                    setFormData({ ...formData, asset_location_id: val })
                  }
                  data={locationsData?.data || []}
                  isLoading={isLoadingLocations}
                  placeholder="Pilih Lokasi"
                  getOptionLabel={(item) => `${item.code} - ${item.name}`}
                  disabled={isDetail}
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kode Asset
                </label>
                <input
                  type="text"
                  required
                  disabled={isDetail}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-slate-900 focus:outline-none disabled:bg-gray-100"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="Contoh: A123456789"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Asset
                </label>
                <input
                  type="text"
                  required
                  disabled={isDetail}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-slate-900 focus:outline-none disabled:bg-gray-100"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Contoh: Laptop Model X"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  disabled={isDetail}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-slate-900 focus:outline-none disabled:bg-gray-100"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Deskripsi singkat..."
                />
              </div>
            </div>

            {/* Kolom Kanan */}
            <div className="space-y-4">
              {/* Acquired At */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Perolehan
                </label>
                <input
                  type="date"
                  required
                  disabled={isDetail}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-slate-900 focus:outline-none disabled:bg-gray-100"
                  value={formData.acquired_at}
                  onChange={(e) =>
                    setFormData({ ...formData, acquired_at: e.target.value })
                  }
                />
              </div>

              {/* Acquired Value (Rupiah) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nilai Perolehan (Rp)
                </label>
                <input
                  type="text"
                  required
                  disabled={isDetail}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-slate-900 focus:outline-none disabled:bg-gray-100"
                  value={displayAcquiredValue}
                  onChange={handleAcquiredValueChange}
                  placeholder="0"
                />
              </div>

              {/* Depreciation Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metode Penyusutan
                </label>
                <select
                  disabled={isDetail}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-slate-900 focus:outline-none disabled:bg-gray-100"
                  value={formData.depreciation_method}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      depreciation_method: e.target.value,
                    })
                  }
                >
                  <option value="straight_line">
                    Straight Line (Garis Lurus)
                  </option>
                  <option value="declining_balance">
                    Declining Balance (Saldo Menurun)
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Useful Life */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Umur Ekonomis (Thn)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    disabled={isDetail}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-slate-900 focus:outline-none disabled:bg-gray-100"
                    value={formData.useful_life_years}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        useful_life_years: Number(e.target.value),
                      })
                    }
                  />
                </div>

                {/* Salvage Value (Rupiah) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nilai Residu (Rp)
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isDetail}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-slate-900 focus:outline-none disabled:bg-gray-100"
                    value={displaySalvageValue}
                    onChange={handleSalvageValueChange}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Condition */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kondisi
                  </label>
                  <select
                    disabled={isDetail}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-slate-900 focus:outline-none disabled:bg-gray-100"
                    value={formData.condition}
                    onChange={(e) =>
                      setFormData({ ...formData, condition: e.target.value })
                    }
                  >
                    <option value="Excellent">Excellent (Sangat Baik)</option>
                    <option value="Good">Good (Baik)</option>
                    <option value="Fair">Fair (Cukup)</option>
                    <option value="Poor">Poor (Buruk)</option>
                    <option value="Broken">Broken (Rusak)</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status Aktif
                  </label>
                  <select
                    disabled={isDetail}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-slate-900 focus:outline-none disabled:bg-gray-100"
                    value={formData.status ? "true" : "false"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value === "true",
                      })
                    }
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Tidak Aktif</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t pt-4">
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