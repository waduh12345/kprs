"use client";

import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SimpananBerjangka } from "@/types/admin/konfigurasi/simpanan-berjangka";
import { formatRupiah, parseRupiah } from "@/lib/format-utils";

interface FormPinjamanCategoryProps {
  form: Partial<SimpananBerjangka>;
  setForm: (data: Partial<SimpananBerjangka>) => void;
  onCancel: () => void;
  onSubmit: () => void;
  readonly?: boolean;
  isLoading?: boolean;
}

export default function FormSimpananBerjangka({
  form,
  setForm,
  onCancel,
  onSubmit,
  readonly = false,
  isLoading = false,
}: FormPinjamanCategoryProps) {
  useEffect(() => {
    if (!form.id && form.status === undefined) {
      setForm({
        ...form,
        status: 1,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.id, form.status]);

  return (
    // Container utama: Full width di mobile, max-width di desktop, scrollable jika overflow
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 sm:p-6 w-full max-w-2xl space-y-6 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900 z-10 pb-2 border-b mb-4">
        <h2 className="text-lg font-semibold">
          {readonly
            ? "Detail Produk Simpanan Berjangka"
            : form.id
            ? "Edit Produk Simpanan Berjangka"
            : "Tambah Produk Simpanan Berjangka"}
        </h2>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          ✕
        </Button>
      </div>

      {/* Grid Layout: 1 kolom di Mobile, 2 kolom di layar >= sm (640px) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-y-1.5 col-span-1 sm:col-span-2">
          <Label>Nama</Label>
          <Input
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            readOnly={readonly}
            placeholder="Contoh: SimpananBerjangka Wajib"
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-y-1.5">
          <Label>Kode</Label>
          <Input
            value={form.code || ""}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            readOnly={readonly}
            placeholder="Contoh: SWJ"
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-y-1.5">
          <Label>Nominal</Label>
          <Input
            type="text"
            inputMode="numeric"
            value={formatRupiah(form.nominal ?? "")}
            onChange={(e) => {
              const raw = e.target.value;
              const parsed = parseRupiah(raw);
              setForm({
                ...form,
                nominal: raw === "" ? undefined : parsed,
              });
            }}
            placeholder="Rp 0"
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-y-1.5">
          <Label>Bunga (%)</Label>
          <Input
            type="number"
            inputMode="decimal"
            value={form.interest_rate ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              setForm({
                ...form,
                interest_rate: raw === "" ? undefined : Number(raw),
              });
            }}
            placeholder="0"
            className="w-full"
          />
        </div>

        {/* Status dibuat full width di mobile, dan 1 kolom di desktop (sejajar grid) */}
        <div className="flex flex-col gap-y-1.5">
          <Label>Status</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={form.status ?? 1}
            onChange={(e) => {
              const newStatus = Number(e.target.value);
              setForm({ ...form, status: newStatus });
            }}
            disabled={readonly}
            aria-label="Status kategori pinjaman"
          >
            <option value={1}>Aktif</option>
            <option value={0}>Nonaktif</option>
          </select>
        </div>

        {/* Deskripsi mengambil full width di mobile dan desktop (col-span-2) */}
        <div className="flex flex-col gap-y-1.5 col-span-1 sm:col-span-2">
          <Label>Deskripsi</Label>
          <Textarea
            value={form.description || ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            readOnly={readonly}
            placeholder="Keterangan tambahan..."
            rows={4}
            className="resize-none"
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