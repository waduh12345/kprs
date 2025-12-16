"use client";

import { AssetDepresiasi } from "@/services/admin/modul/asset/depresiasi.service";
import { formatRupiahWithRp, displayDate } from "@/lib/format-utils";

interface DepreciationDetailProps {
  isOpen: boolean;
  onClose: () => void;
  data: AssetDepresiasi | null;
}

export default function DepreciationDetailModal({
  isOpen,
  onClose,
  data,
}: DepreciationDetailProps) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Detail Penyusutan Asset
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &#x2715;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informasi Asset */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 border-b pb-1">
              Informasi Asset
            </h3>

            <div>
              <label className="text-xs text-gray-500 block">Kode & Nama</label>
              <p className="font-medium text-gray-900">
                {data.code} - {data.name}
              </p>
            </div>

            <div>
              <label className="text-xs text-gray-500 block">Kategori</label>
              <p className="text-sm text-gray-700">
                {data.asset_category_name} ({data.asset_category_code})
              </p>
            </div>

            <div>
              <label className="text-xs text-gray-500 block">Lokasi</label>
              <p className="text-sm text-gray-700">
                {data.asset_location_name} ({data.asset_location_code})
              </p>
            </div>

            <div>
              <label className="text-xs text-gray-500 block">PIC</label>
              <p className="text-sm text-gray-700">{data.pic_name || "-"}</p>
            </div>

            <div>
              <label className="text-xs text-gray-500 block">
                Kondisi & Status
              </label>
              <div className="flex gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                  {data.condition}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    data.status
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {data.status ? "Aktif" : "Non-Aktif"}
                </span>
              </div>
            </div>
          </div>

          {/* Informasi Keuangan & Penyusutan */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 border-b pb-1">
              Nilai & Penyusutan
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block">
                  Tgl Perolehan
                </label>
                <p className="text-sm text-gray-700">
                  {displayDate(data.acquired_at)}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 block">Metode</label>
                <p className="text-sm text-gray-700 capitalize">
                  {data.depreciation_method.replace("_", " ")}
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 block">
                Nilai Perolehan
              </label>
              <p className="font-medium text-gray-900">
                {formatRupiahWithRp(data.acquired_value)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block">
                  Umur Ekonomis
                </label>
                <p className="text-sm text-gray-700">
                  {data.useful_life_years} Tahun
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 block">
                  Nilai Residu
                </label>
                <p className="text-sm text-gray-700">
                  {formatRupiahWithRp(data.salvage_value)}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-dashed"></div>

            <div>
              <label className="text-xs text-gray-500 block">
                Total Penyusutan
              </label>
              <p className="font-bold text-red-600">
                - {formatRupiahWithRp(data.depreciation_total)}
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
              <label className="text-xs text-slate-500 block font-bold uppercase">
                Nilai Buku Saat Ini
              </label>
              <p className="text-lg font-bold text-slate-900">
                {formatRupiahWithRp(data.current_value)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-slate-900 px-6 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}