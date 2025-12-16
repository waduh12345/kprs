"use client";

import { useState } from "react";
import { useGetAssetDepreciationListQuery } from "@/services/admin/modul/asset/depresiasi.service";
import { useGetAssetDataListQuery } from "@/services/admin/modul/asset/data.service";
import { AssetDepresiasi } from "@/services/admin/modul/asset/depresiasi.service";
import DepreciationDetailModal from "@/components/form-modal/asset/depresiasi-detail";
import { IconFilter } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combo-box";
import { formatRupiahWithRp } from "@/lib/format-utils";

export default function AssetDepreciationPage() {
  // State
  const [page, setPage] = useState(1);
  const [assetIdFilter, setAssetIdFilter] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AssetDepresiasi | null>(
    null
  );

  // RTK Query: Main Data (Depreciation)
  const {
    data: depreciationData,
    isLoading,
    refetch,
  } = useGetAssetDepreciationListQuery({
    page,
    paginate: 10,
    asset_id: assetIdFilter || undefined, // Kirim undefined jika null agar tidak terkirim param kosong
  });

  // RTK Query: Helper Data for Filter (List of Assets)
  // Ambil list asset untuk combobox filter
  const { data: assetsList, isLoading: isLoadingAssets } =
    useGetAssetDataListQuery({
      page: 1,
      paginate: 100, // Ambil cukup banyak untuk filter
    });

  // Handlers
  const handleDetail = (item: AssetDepresiasi) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const handleReset = () => {
    setAssetIdFilter(null);
    setPage(1);
    refetch();
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen font-sans">
      {/* --- Section Header Filter --- */}
      <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Filter Asset menggunakan Combobox */}
          <div className="w-full md:w-1/3">
            <label className="text-xs text-gray-500 mb-1 block ml-1">
              Filter Berdasarkan Asset
            </label>
            <Combobox
              value={assetIdFilter}
              onChange={(val) => {
                setAssetIdFilter(val);
                setPage(1); // Reset ke halaman 1 saat filter berubah
              }}
              data={assetsList?.data || []}
              isLoading={isLoadingAssets}
              placeholder="Cari & Pilih Asset..."
              getOptionLabel={(item) => `${item.code} - ${item.name}`}
              buttonClassName="w-full"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto self-end">
            {/* Tombol Reset */}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors h-10"
            >
              <IconFilter size={16} />
              Reset Filter
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
                <th className="px-6 py-4 w-[100px]">Aksi</th>
                <th className="px-6 py-4">Asset</th>
                <th className="px-6 py-4">Kategori & Lokasi</th>
                <th className="px-6 py-4 text-right">Nilai Perolehan</th>
                <th className="px-6 py-4 text-right">Total Penyusutan</th>
                <th className="px-6 py-4 text-right">Nilai Buku</th>
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
              ) : depreciationData?.data && depreciationData.data.length > 0 ? (
                depreciationData.data.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Kolom Aksi */}
                    <td className="px-6 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDetail(item)}
                        className="h-8 border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      >
                        Detail
                      </Button>
                    </td>

                    {/* Data Asset */}
                    <td className="px-6 py-3">
                      <div className="font-medium text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500">{item.code}</div>
                    </td>

                    {/* Kategori & Lokasi */}
                    <td className="px-6 py-3">
                      <div className="text-gray-900">
                        {item.asset_category_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.asset_location_name}
                      </div>
                    </td>

                    {/* Nilai Perolehan */}
                    <td className="px-6 py-3 text-right font-medium text-gray-900">
                      {formatRupiahWithRp(item.acquired_value)}
                    </td>

                    {/* Total Penyusutan */}
                    <td className="px-6 py-3 text-right text-red-600">
                      ({formatRupiahWithRp(item.depreciation_total)})
                    </td>

                    {/* Nilai Buku (Current Value) */}
                    <td className="px-6 py-3 text-right font-bold text-slate-900 bg-slate-50/50">
                      {formatRupiahWithRp(item.current_value)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Tidak ada data penyusutan ditemukan.
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
              {depreciationData?.currentPage || 1}
            </span>{" "}
            dari{" "}
            <span className="font-bold text-gray-900">
              {depreciationData?.pageTotal || 1}
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
                  Math.min(prev + 1, depreciationData?.pageTotal || 1)
                )
              }
              disabled={page === (depreciationData?.pageTotal || 1)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <DepreciationDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        data={selectedItem}
      />
    </div>
  );
}