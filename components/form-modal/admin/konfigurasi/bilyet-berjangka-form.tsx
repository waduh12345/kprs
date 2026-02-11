"use client";

import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MasterBilyetBerjangka } from "@/types/admin/konfigurasi/master-simpanan-berjangka";
import { formatRupiah, parseRupiah } from "@/lib/format-utils";

type TenorBulan = 3 | 6 | 12;
type HariTenor = 90 | 180 | 360;

interface FormBilyetBerjangkaProps {
  form: Partial<MasterBilyetBerjangka>;
  setForm: (data: Partial<MasterBilyetBerjangka>) => void;
  onCancel: () => void;
  onSubmit: () => void;
  readonly?: boolean;
  isLoading?: boolean;
}

const TENOR_BULAN_OPTIONS: { value: TenorBulan; label: string }[] = [
  { value: 3, label: "3 Bulan" },
  { value: 6, label: "6 Bulan" },
  { value: 12, label: "12 Bulan" },
];

const HARI_TENOR_OPTIONS: { value: HariTenor; label: string }[] = [
  { value: 90, label: "90 Hari" },
  { value: 180, label: "180 Hari" },
  { value: 360, label: "360 Hari" },
];

const METODE_PEMBAYARAN_OPTIONS: { value: "akhir_tenor" | "bulanan"; label: string }[] = [
  { value: "akhir_tenor", label: "Akhir Tenor" },
  { value: "bulanan", label: "Bulanan" },
];

export default function FormBilyetBerjangka({
  form,
  setForm,
  onCancel,
  onSubmit,
  readonly = false,
  isLoading = false,
}: FormBilyetBerjangkaProps) {
  useEffect(() => {
    if (!form.id) {
      if (form.status === undefined) setForm({ ...form, status: 1 });
      if (form.tenor_bulan === undefined) setForm({ ...form, tenor_bulan: 3 });
      if (form.hari_tenor === undefined) setForm({ ...form, hari_tenor: 90 });
      if (form.penalti_cair_awal === undefined) setForm({ ...form, penalti_cair_awal: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.id]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 sm:p-6 w-full max-w-2xl space-y-6 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900 z-10 pb-2 border-b mb-4">
        <h2 className="text-lg font-semibold">
          {readonly
            ? "Detail Bilyet Berjangka"
            : form.id
              ? "Edit Bilyet Berjangka"
              : "Tambah Bilyet Berjangka"}
        </h2>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          ✕
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-y-1.5 col-span-1 sm:col-span-2">
          <Label>Nama Produk</Label>
          <Input
            value={form.nama_produk ?? ""}
            onChange={(e) => setForm({ ...form, nama_produk: e.target.value })}
            readOnly={readonly}
            placeholder="Contoh: Deposito 3 Bulan"
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-y-1.5">
          <Label>Kode Bilyet</Label>
          <Input
            value={form.kode_bilyet ?? ""}
            onChange={(e) => setForm({ ...form, kode_bilyet: e.target.value })}
            readOnly={readonly}
            placeholder="Contoh: BB-3"
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
            {TENOR_BULAN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-y-1.5">
          <Label>Hari Tenor</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={form.hari_tenor ?? 90}
            onChange={(e) =>
              setForm({
                ...form,
                hari_tenor: Number(e.target.value) as HariTenor,
              })
            }
            disabled={readonly}
            aria-label="Hari tenor"
          >
            {HARI_TENOR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-y-1.5">
          <Label>Bunga Tahunan (%)</Label>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            value={form.bunga_tahunan ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              setForm({
                ...form,
                bunga_tahunan: raw === "" ? undefined : Number(raw),
              });
            }}
            readOnly={readonly}
            placeholder="0"
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-y-1.5">
          <Label>Metode Bunga</Label>
          <Input
            value={form.metode_bunga ?? "akrual_harian"}
            onChange={(e) => setForm({ ...form, metode_bunga: e.target.value })}
            readOnly={true}
            placeholder="Contoh: Tetap"
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-y-1.5">
          <Label>Metode Pembayaran</Label>
          <Select
            value={form.metode_pembayaran ?? ""}
            onValueChange={(value) =>
              setForm({
                ...form,
                metode_pembayaran: value as "akhir_tenor" | "bulanan",
              })
            }
            disabled={readonly}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih metode pembayaran" />
            </SelectTrigger>
            <SelectContent>
              {METODE_PEMBAYARAN_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-y-1.5">
          <Label>Minimal Simpanan (Rp)</Label>
          <Input
            type="text"
            inputMode="numeric"
            value={formatRupiah(form.minimal_simpanan ?? "")}
            onChange={(e) => {
              const raw = e.target.value;
              const parsed = parseRupiah(raw);
              setForm({
                ...form,
                minimal_simpanan: raw === "" ? undefined : parsed,
              });
            }}
            readOnly={readonly}
            placeholder="Rp 0"
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-y-1.5">
          <Label>Penalti Cair Awal (Rp)</Label>
          <Input
            type="text"
            inputMode="numeric"
            value={formatRupiah(form.penalti_cair_awal ?? "")}
            onChange={(e) => {
              const raw = e.target.value;
              const parsed = parseRupiah(raw);
              setForm({
                ...form,
                penalti_cair_awal: raw === "" ? undefined : parsed,
              });
            }}
            readOnly={readonly}
            placeholder="Rp 0"
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">Opsional</p>
        </div>

        <div className="flex flex-col gap-y-1.5">
          <Label>Status</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={form.status ?? 1}
            onChange={(e) =>
              setForm({ ...form, status: Number(e.target.value) })
            }
            disabled={readonly}
            aria-label="Status"
          >
            <option value={1}>Aktif</option>
            <option value={0}>Nonaktif</option>
          </select>
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
