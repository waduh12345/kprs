"use client";

import { useEffect, useState } from "react";
import {
  useCreateRuleMutation,
  useUpdateRuleMutation,
} from "@/services/admin/modul/scoring/rule.service";
import { useGetKriteriaListQuery } from "@/services/admin/modul/scoring/kriteria.service";
import { Rule } from "@/types/admin/modul/scoring/rule";
import { Combobox } from "@/components/ui/combo-box";
import Swal from "sweetalert2";

interface RuleFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Rule | null;
  isDetail?: boolean;
}

export default function RuleForm({
  isOpen,
  onClose,
  initialData,
  isDetail = false,
}: RuleFormProps) {
  // State form
  const [formData, setFormData] = useState({
    scoring_criteria_id: 0,
    operator: ">",
    min_value: 0,
    max_value: 0,
    score: 0,
    description: "",
  });

  // RTK Query Hooks
  const [createRule, { isLoading: isCreating }] = useCreateRuleMutation();
  const [updateRule, { isLoading: isUpdating }] = useUpdateRuleMutation();

  // Ambil data Kriteria untuk Combobox
  const { data: criteriaData, isLoading: isLoadingCriteria } =
    useGetKriteriaListQuery({ page: 1, paginate: 100 });

  // Populate data
  useEffect(() => {
    if (initialData) {
      setFormData({
        scoring_criteria_id: initialData.scoring_criteria_id,
        operator: initialData.operator,
        min_value: initialData.min_value,
        max_value: initialData.max_value,
        score: initialData.score,
        description: initialData.description,
      });
    } else {
      setFormData({
        scoring_criteria_id: 0,
        operator: ">",
        min_value: 0,
        max_value: 0,
        score: 0,
        description: "",
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDetail) return;

    if (!formData.scoring_criteria_id) {
      Swal.fire({
        icon: "warning",
        title: "Data Belum Lengkap",
        text: "Silakan pilih Kriteria terlebih dahulu.",
      });
      return;
    }

    try {
      if (initialData) {
        await updateRule({ id: initialData.id, payload: formData }).unwrap();
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Aturan berhasil diperbarui.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await createRule(formData).unwrap();
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Aturan berhasil ditambahkan.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
      onClose();
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
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
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-xl font-bold text-gray-800">
          {isDetail
            ? "Detail Aturan Scoring"
            : initialData
            ? "Edit Aturan Scoring"
            : "Tambah Aturan Scoring"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Kriteria (Combobox) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kriteria
              </label>
              <Combobox
                value={formData.scoring_criteria_id || null}
                onChange={(val) =>
                  setFormData({ ...formData, scoring_criteria_id: val })
                }
                data={criteriaData?.data || []}
                isLoading={isLoadingCriteria}
                placeholder="Pilih Kriteria"
                getOptionLabel={(item) =>
                  `${item.category} - ${item.parameter}`
                }
                disabled={isDetail}
              />
            </div>

            {/* Operator */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operator
              </label>
              <select
                required
                disabled={isDetail}
                className={`w-full rounded-md border p-2 text-sm focus:border-slate-900 focus:outline-none ${
                  isDetail ? "bg-gray-100" : "border-gray-300"
                }`}
                value={formData.operator}
                onChange={(e) =>
                  setFormData({ ...formData, operator: e.target.value })
                }
              >
                <option value=">">Lebih Besar (&gt;)</option>
                <option value="<">Lebih Kecil (&lt;)</option>
                <option value=">=">Lebih Besar Sama Dengan (&ge;)</option>
                <option value="<=">Lebih Kecil Sama Dengan (&le;)</option>
                <option value="=">Sama Dengan (=)</option>
                <option value="range">Rentang (Range)</option>
              </select>
            </div>

            {/* Min Value & Max Value */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nilai Min / Value
                </label>
                <input
                  type="number"
                  required
                  disabled={isDetail}
                  className={`w-full rounded-md border p-2 text-sm focus:border-slate-900 focus:outline-none ${
                    isDetail ? "bg-gray-100" : "border-gray-300"
                  }`}
                  value={formData.min_value}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_value: Number(e.target.value),
                    })
                  }
                />
                {formData.operator !== "range" && !isDetail && (
                  <p className="text-[10px] text-gray-500 mt-1">
                    Gunakan ini sebagai nilai utama.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nilai Max
                </label>
                <input
                  type="number"
                  // Max value wajib hanya jika operator range
                  required={formData.operator === "range"}
                  disabled={isDetail || formData.operator !== "range"}
                  className={`w-full rounded-md border p-2 text-sm focus:border-slate-900 focus:outline-none ${
                    isDetail || formData.operator !== "range"
                      ? "bg-gray-100 text-gray-400"
                      : "border-gray-300"
                  }`}
                  value={formData.max_value}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_value: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            {/* Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skor (Score)
              </label>
              <input
                type="number"
                required
                disabled={isDetail}
                className={`w-full rounded-md border p-2 text-sm focus:border-slate-900 focus:outline-none ${
                  isDetail ? "bg-gray-100" : "border-gray-300"
                }`}
                value={formData.score}
                onChange={(e) =>
                  setFormData({ ...formData, score: Number(e.target.value) })
                }
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
                className={`w-full rounded-md border p-2 text-sm focus:border-slate-900 focus:outline-none ${
                  isDetail ? "bg-gray-100" : "border-gray-300"
                }`}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Contoh: Kondisi sangat baik"
              />
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