"use client";

import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { MasterTarifBunga } from "@/types/admin/konfigurasi/master-simpanan-berjangka";

type TenorBulan = 3 | 6 | 12;

interface FormTarifBungaProps {
  form: Partial<MasterTarifBunga>;
  setForm: (data: Partial<MasterTarifBunga>) => void;
  onCancel: () => void;
  onSubmit: () => void;
  readonly?: boolean;
  isLoading?: boolean;
}

const TENOR_OPTIONS: { value: TenorBulan; label: string }[] = [
  { value: 3, label: "3 Bulan" },
  { value: 6, label: "6 Bulan" },
  { value: 12, label: "12 Bulan" },
];

export default function FormTarifBunga({
  form,
  setForm,
  onCancel,
  onSubmit,
  readonly = false,
  isLoading = false,
}: FormTarifBungaProps) {
  useEffect(() => {
    if (!form.id && form.tenor_bulan === undefined) {
      setForm({ ...form, tenor_bulan: 3 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.id]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 sm:p-6 w-full max-w-2xl space-y-6 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900 z-10 pb-2 border-b mb-4">
        <h2 className="text-lg font-semibold">
          {readonly
            ? "Detail Tarif Bunga"
            : form.id
              ? "Edit Tarif Bunga"
              : "Tambah Tarif Bunga"}
        </h2>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          ✕
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-y-1.5">
          <Label>Kode Bunga</Label>
          <Input
            value={form.kode_bunga ?? ""}
            onChange={(e) => setForm({ ...form, kode_bunga: e.target.value })}
            readOnly={readonly}
            placeholder="Contoh: TB-3"
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-y-1.5">
          <Label>Tenor (Teks)</Label>
          <Input
            value={form.tenor ?? ""}
            onChange={(e) => setForm({ ...form, tenor: e.target.value })}
            readOnly={readonly}
            placeholder="Contoh: 3 Bulan"
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-y-1.5">
          <Label>Tenor (Bulan)</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={form.tenor_bulan ?? 3}
            onChange={(e) =>
              setForm({
                ...form,
                tenor_bulan: Number(e.target.value) as TenorBulan,
              })
            }
            disabled={readonly}
            aria-label="Tenor dalam bulan"
          >
            {TENOR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-y-1.5">
          <Label>Rate / Bunga (%)</Label>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            value={form.rate ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              setForm({
                ...form,
                rate: raw === "" ? undefined : Number(raw),
              });
            }}
            readOnly={readonly}
            placeholder="0"
            className="w-full"
          />
        </div>
      </div>

      {!readonly && (
        <div className="pt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t mt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            Batal
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      )}
    </div>
  );
}
