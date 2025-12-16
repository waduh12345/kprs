"use client";

import { useState } from "react";
import {
  useGetAssetCategoryListQuery,
  useDeleteAssetCategoryMutation,
} from "@/services/admin/modul/asset/kategori.service";
import AssetCategoryForm from "@/components/form-modal/asset/kategori-form";
import { KategoriAsset } from "@/types/admin/modul/assset/kategori";
import { IconFilter, IconPlus } from "@tabler/icons-react";
// Import Button dari Shadcn
import { Button } from "@/components/ui/button";
// Import SweetAlert2
import Swal from "sweetalert2";

export default function AssetCategoryPage() {
  // State
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<KategoriAsset | null>(null);
  // State baru untuk mode detail
  const [isDetailMode, setIsDetailMode] = useState(false);

  // RTK Query: Get Data
  const {
    data: categoryData,
    isLoading,
    refetch,
  } = useGetAssetCategoryListQuery({
    page,
    paginate: 10,
  });

  // RTK Query: Delete
  const [deleteCategory] = useDeleteAssetCategoryMutation();

  // Handlers
  const handleCreate = () => {
    setSelectedData(null);
    setIsDetailMode(false); // Pastikan bukan mode detail
    setIsFormOpen(true);
  };

  const handleEdit = (item: KategoriAsset) => {
    setSelectedData(item);
    setIsDetailMode(false); // Pastikan bukan mode detail
    setIsFormOpen(true);
  };

  const handleDetail = (item: KategoriAsset) => {
    setSelectedData(item);
    setIsDetailMode(true); // Aktifkan mode detail
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    // SweetAlert Konfirmasi
    const result = await Swal.fire({
      title: "Apakah Anda yakin?",
      text: "Data yang dihapus tidak dapat dikembalikan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626", // Merah (Tailwind red-600)
      cancelButtonColor: "#6b7280", // Abu (Tailwind gray-500)
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        // Gunakan unwrap() untuk menangkap promise resolve/reject
        await deleteCategory(id).unwrap();

        Swal.fire({
          title: "Terhapus!",
          text: "Data berhasil dihapus.",
          icon: "success",
          confirmButtonColor: "#0f172a", // Slate-900
        });
      } catch (error) {
        console.error("Gagal menghapus:", error);
        Swal.fire({
          title: "Gagal!",
          text: "Terjadi kesalahan saat menghapus data.",
          icon: "error",
          confirmButtonColor: "#0f172a",
        });
      }
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen font-sans">
      {/* --- Section Header Filter --- */}
      <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-1/3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Cari data..."
              className="w-full rounded-md border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {/* Dropdown Filter */}
            <select className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 focus:border-slate-500 focus:outline-none w-full md:w-auto">
              <option>Ketik min. 2 huruf...</option>
              <option value="code">Kode</option>
              <option value="name">Nama</option>
            </select>

            {/* Tombol Tambah */}
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
            >
              <IconPlus size={16} />
              Tambah
            </button>

            {/* Tombol Reset */}
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              <IconFilter size={16} />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* --- Section Table --- */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-bold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 w-[240px]">Aksi</th>
                <th className="px-6 py-4">Kode</th>
                <th className="px-6 py-4">Nama Kategori</th>
                <th className="px-6 py-4">Deskripsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : categoryData?.data && categoryData.data.length > 0 ? (
                categoryData.data.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Kolom Aksi dengan Shadcn Button */}
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        {/* Tombol Detail (Baru) */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDetail(item)}
                          className="h-8 border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        >
                          Detail
                        </Button>

                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          className="h-8 bg-slate-900 text-xs font-medium hover:bg-slate-800"
                        >
                          Edit
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="h-8 bg-red-600 text-xs font-medium hover:bg-red-700"
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>

                    <td className="px-6 py-3 font-medium text-gray-900">
                      {item.code}
                    </td>
                    <td className="px-6 py-3 text-gray-700">{item.name}</td>
                    <td className="px-6 py-3 text-gray-500 truncate max-w-xs">
                      {item.description || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- Pagination --- */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
          <p className="text-sm text-gray-600 font-medium">
            Halaman{" "}
            <span className="font-bold text-gray-900">
              {categoryData?.currentPage || 1}
            </span>{" "}
            dari{" "}
            <span className="font-bold text-gray-900">
              {categoryData?.pageTotal || 1}
            </span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <button
              onClick={() =>
                setPage((prev) =>
                  Math.min(prev + 1, categoryData?.pageTotal || 1)
                )
              }
              disabled={page === (categoryData?.pageTotal || 1)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {/* Modal Form dengan prop isDetail */}
      <AssetCategoryForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={selectedData}
        isDetail={isDetailMode}
      />
    </div>
  );
}