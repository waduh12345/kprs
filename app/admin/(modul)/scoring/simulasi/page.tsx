"use client";

import { useState } from "react";
import {
  useGetScoringSimulationListQuery,
  useDeleteScoringSimulationMutation,
} from "@/services/admin/modul/scoring/simulasi.service";
import { ScoringSimulation } from "@/services/admin/modul/scoring/simulasi.service";
import SimulationForm from "@/components/form-modal/scoring/simulasi-form";
import { IconFilter, IconPlus, IconCalculator } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import { formatRupiahWithRp, displayDate } from "@/lib/format-utils";

export default function ScoringSimulationPage() {
  // State
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<ScoringSimulation | null>(
    null
  );
  const [isDetailMode, setIsDetailMode] = useState(false);

  // RTK Query: Get Data
  const {
    data: simulationData,
    isLoading,
    refetch,
  } = useGetScoringSimulationListQuery({
    page,
    paginate: 10,
    orderBy: "scoring_simulations.created_at",
    order: "desc",
  });

  // RTK Query: Delete
  const [deleteSimulation] = useDeleteScoringSimulationMutation();

  // Handlers
  const handleCreate = () => {
    setSelectedData(null);
    setIsDetailMode(false);
    setIsFormOpen(true);
  };

  const handleDetail = (item: ScoringSimulation) => {
    setSelectedData(item);
    setIsDetailMode(true);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Apakah Anda yakin?",
      text: "Riwayat simulasi ini akan dihapus permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        await deleteSimulation(id).unwrap();
        Swal.fire({
          title: "Terhapus!",
          text: "Data simulasi berhasil dihapus.",
          icon: "success",
          confirmButtonColor: "#0f172a",
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
              placeholder="Cari anggota / ref..."
              className="w-full rounded-md border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {/* Tombol Tambah / Simulate */}
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
            >
              <IconCalculator size={16} />
              Simulasi Baru
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
                <th className="px-6 py-4 w-[150px]">Aksi</th>
                <th className="px-6 py-4">Anggota</th>
                <th className="px-6 py-4">Kategori & Tenor</th>
                <th className="px-6 py-4 text-right">Nominal</th>
                <th className="px-6 py-4 text-right">Skor Akhir</th>
                <th className="px-6 py-4 text-right">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : simulationData?.data && simulationData.data.length > 0 ? (
                simulationData.data.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Kolom Aksi */}
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDetail(item)}
                          className="h-8 border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        >
                          Detail
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

                    {/* Anggota */}
                    <td className="px-6 py-3">
                      <div className="font-medium text-gray-900">
                        {item.anggota_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.anggota_reference}
                      </div>
                    </td>

                    {/* Kategori & Tenor */}
                    <td className="px-6 py-3 text-gray-700">
                      <div>{item.pinjaman_category_name}</div>
                      <div className="text-xs text-gray-500">
                        {item.tenor} Bulan
                      </div>
                    </td>

                    {/* Nominal */}
                    <td className="px-6 py-3 text-right font-medium text-gray-900">
                      {formatRupiahWithRp(item.nominal)}
                    </td>

                    {/* Skor */}
                    <td className="px-6 py-3 text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          item.score >= 70
                            ? "bg-green-100 text-green-800"
                            : item.score >= 50
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {item.score}
                      </span>
                    </td>

                    {/* Tanggal */}
                    <td className="px-6 py-3 text-right text-gray-500 text-xs">
                      {displayDate(item.created_at)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Belum ada riwayat simulasi.
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
              {simulationData?.currentPage || 1}
            </span>{" "}
            dari{" "}
            <span className="font-bold text-gray-900">
              {simulationData?.pageTotal || 1}
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
                  Math.min(prev + 1, simulationData?.pageTotal || 1)
                )
              }
              disabled={page === (simulationData?.pageTotal || 1)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      <SimulationForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={selectedData}
        isDetail={isDetailMode}
      />
    </div>
  );
}