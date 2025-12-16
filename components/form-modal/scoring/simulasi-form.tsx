"use client";

import { useEffect, useState } from "react";
import { useCreateScoringSimulationMutation } from "@/services/admin/modul/scoring/simulasi.service";
import { ScoringSimulation } from "@/services/admin/modul/scoring/simulasi.service";
import { useGetPinjamanCategoryListQuery } from "@/services/master/pinjaman-category.service";
import { useGetAnggotaListQuery } from "@/services/koperasi-service/anggota.service";
import { Combobox } from "@/components/ui/combo-box";
import Swal from "sweetalert2";
import { formatRupiah, parseRupiah } from "@/lib/format-utils";
import { AnggotaKoperasi } from "@/types/koperasi-types/anggota";

interface SimulationFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ScoringSimulation | null;
  isDetail?: boolean;
}

export default function SimulationForm({
  isOpen,
  onClose,
  initialData,
  isDetail = false,
}: SimulationFormProps) {
  const [formData, setFormData] = useState({
    pinjaman_category_id: 0,
    user_id: 0,
    tenor: 0,
    nominal: 0,
    gaji: 0,
  });

  const [displayNominal, setDisplayNominal] = useState("");
  const [displayGaji, setDisplayGaji] = useState("");

  const [createSimulation, { isLoading: isCreating }] =
    useCreateScoringSimulationMutation();

  const { data: categoryData, isLoading: isLoadingCategory } =
    useGetPinjamanCategoryListQuery({ page: 1, paginate: 100 });
  const { data: anggotaData, isLoading: isLoadingAnggota } =
    useGetAnggotaListQuery({ page: 1, paginate: 100 });

  useEffect(() => {
    if (initialData) {
      setFormData({
        pinjaman_category_id: initialData.pinjaman_category_id,
        user_id: initialData.user_id,
        tenor: initialData.tenor,
        nominal: initialData.nominal,
        gaji: initialData.gaji,
      });
      setDisplayNominal(formatRupiah(initialData.nominal));
      setDisplayGaji(formatRupiah(initialData.gaji));
    } else {
      setFormData({
        pinjaman_category_id: 0,
        user_id: 0,
        tenor: 0,
        nominal: 0,
        gaji: 0,
      });
      setDisplayNominal("");
      setDisplayGaji("");
    }
  }, [initialData, isOpen]);

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = parseRupiah(raw);
    setFormData((prev) => ({ ...prev, nominal: parsed }));
    setDisplayNominal(formatRupiah(raw));
  };

  const handleGajiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = parseRupiah(raw);
    setFormData((prev) => ({ ...prev, gaji: parsed }));
    setDisplayGaji(formatRupiah(raw));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDetail) return;

    if (!formData.pinjaman_category_id || !formData.user_id) {
      Swal.fire({
        icon: "warning",
        title: "Data Belum Lengkap",
        text: "Mohon pilih Kategori Pinjaman dan Anggota.",
      });
      return;
    }

    try {
      const result = await createSimulation(formData).unwrap();

      Swal.fire({
        icon: "success",
        title: "Simulasi Berhasil!",
        html: `
            <div class="text-left text-sm space-y-2 mt-2">
                <p><strong>Skor:</strong> <span class="text-lg font-bold ${
                  result.score >= 75 ? "text-green-600" : "text-red-600"
                }">${result.score}</span></p>
                <p><strong>Rasio Hutang (DTI):</strong> ${result.debt_to_income_ratio.toFixed(
                  2
                )}%</p>
                <p><strong>Usia:</strong> ${result.usia} Tahun</p>
            </div>
        `,
        confirmButtonColor: "#0f172a",
      });

      onClose();
    } catch (error) {
      console.error("Gagal simulasi:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: "Terjadi kesalahan saat memproses simulasi.",
        confirmButtonColor: "#0f172a",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="mb-6 text-xl font-bold text-gray-800 border-b pb-2">
          {isDetail ? "Detail Hasil Simulasi" : "Buat Simulasi Baru"}
        </h2>

        {isDetail && initialData && (
          <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">
                Total Skor
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {initialData.score}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">
                Status Karyawan
              </p>
              <p className="text-sm font-medium">
                {initialData.status_karyawan || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Usia</p>
              <p className="text-sm font-medium">{initialData.usia} Tahun</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">
                Lama Gabung
              </p>
              <p className="text-sm font-medium">
                {initialData.joinning_duration} Tahun
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">
                DTI Ratio
              </p>
              <p className="text-sm font-medium">
                {initialData.debt_to_income_ratio.toFixed(2)}%
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategori Pinjaman
              </label>
              <Combobox
                value={formData.pinjaman_category_id || null}
                onChange={(val) =>
                  setFormData({ ...formData, pinjaman_category_id: val })
                }
                data={categoryData?.data || []}
                isLoading={isLoadingCategory}
                placeholder="Pilih Kategori Pinjaman"
                getOptionLabel={(item) => item.name}
                disabled={isDetail}
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anggota
              </label>
              <Combobox<AnggotaKoperasi>
                value={
                  anggotaData?.data.find((a) => a.user_id === formData.user_id)
                    ?.id ?? 0
                }
                onChange={(val) => {
                  const selectedAnggota = anggotaData?.data.find(
                    (a) => a.id === val
                  );
                  if (selectedAnggota && selectedAnggota.user_id) {
                    setFormData({
                      ...formData,
                      user_id: selectedAnggota.user_id,
                    });
                  }
                }}
                data={anggotaData?.data || []}
                isLoading={isLoadingAnggota}
                placeholder="Cari Anggota (Nama/Ref/Email)..."
                getOptionLabel={(item: AnggotaKoperasi) => {
                  const name = item.individu_name || "Tanpa Nama";
                  const detail =
                    item.reference || item.email || item.phone || "-";
                  return `${name} - ${detail}`;
                }}
                disabled={isDetail}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tenor (Bulan)
              </label>
              <input
                type="number"
                min="1"
                required
                disabled={isDetail}
                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-slate-900 focus:outline-none disabled:bg-gray-100"
                value={formData.tenor}
                onChange={(e) =>
                  setFormData({ ...formData, tenor: Number(e.target.value) })
                }
                placeholder="Contoh: 12"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nominal Pinjaman
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  Rp
                </span>
                <input
                  type="text"
                  required
                  disabled={isDetail}
                  className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-slate-900 focus:outline-none disabled:bg-gray-100"
                  value={displayNominal}
                  onChange={handleNominalChange}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gaji / Penghasilan Bulanan
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  Rp
                </span>
                <input
                  type="text"
                  required
                  disabled={isDetail}
                  className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-slate-900 focus:outline-none disabled:bg-gray-100"
                  value={displayGaji}
                  onChange={handleGajiChange}
                  placeholder="0"
                />
              </div>
              {!isDetail && (
                <p className="text-[10px] text-gray-500 mt-1">
                  Digunakan untuk menghitung rasio hutang.
                </p>
              )}
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
                disabled={isCreating}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {isCreating ? "Memproses..." : "Hitung Simulasi"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}