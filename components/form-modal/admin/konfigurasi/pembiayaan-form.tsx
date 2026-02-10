"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Pembiayaan, InterestCalculationMethod, LateInterestType } from "@/types/admin/konfigurasi/pembiayaan";
import { formatRupiah, parseRupiah } from "@/lib/format-utils";

interface FormPinjamanCategoryProps {
  form: Partial<Pembiayaan>;
  setForm: (data: Partial<Pembiayaan>) => void;
  onCancel: () => void;
  onSubmit: () => void;
  readonly?: boolean;
  isLoading?: boolean;
}

export default function FormPembiayaan({
  form,
  setForm,
  onCancel,
  onSubmit,
  readonly = false,
  isLoading = false,
}: FormPinjamanCategoryProps) {
  // State untuk tipe perhitungan (Admin atau Margin)
  const [calculationType, setCalculationType] = useState<"admin" | "admin+margin">("admin");

  // Effect untuk inisialisasi data default dan deteksi tipe berdasarkan data yang ada
  useEffect(() => {
    // Set default status jika baru buat
    if (!form.id && form.status === undefined) {
      setForm({ ...form, status: 1 });
    }

    // Deteksi tipe berdasarkan data yang ada (untuk mode Edit)
    if (form.margin && form.margin > 0) {
      setCalculationType("admin+margin");
    } else if (form.admin_fee && form.admin_fee > 0) {
      setCalculationType("admin");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.id, form.status]);

  // Handler saat tipe diganti
  const handleTypeChange = (type: "admin" | "admin+margin") => {
    setCalculationType(type);
    
    // Optional: Reset nilai lawannya jadi 0 agar data bersih
    // if (type === "admin") {
    //   setForm({ ...form, margin: 0 }); 
    // } else {
    //   setForm({ ...form, admin_fee: 0 });
    // }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 sm:p-6 w-full max-w-2xl space-y-6 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900 z-10 pb-2 border-b mb-4">
        <h2 className="text-lg font-semibold">
          {readonly
            ? "Detail Produk Pinjaman"
            : form.id
            ? "Edit Produk Pinjaman"
            : "Tambah Produk Pinjaman"}
        </h2>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          ✕
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-y-1.5 col-span-1 sm:col-span-2">
          <Label>Nama</Label>
          <Input
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            readOnly={readonly}
            placeholder="Contoh: Pinjaman Wajib"
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-y-1.5 col-span-1 sm:col-span-2">
          <Label>Kode</Label>
          <Input
            value={form.code || ""}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            readOnly={readonly}
            placeholder="Contoh: SWJ"
            className="w-full"
          />
        </div>

        {/* Input Pilihan Tipe */}
        <div className="flex flex-col gap-y-1.5">
          <Label>Tipe Perhitungan</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={calculationType}
            onChange={(e) => {
                handleTypeChange(e.target.value as "admin" | "admin+margin");
                setForm({
                  ...form,
                  type: e.target.value as "admin" | "admin+margin",
                });
            }}
            disabled={readonly}
          >
            <option value="admin">Admin Fee</option>
            <option value="admin+margin">Admin + Margin</option>
          </select>
        </div>

        {/* Conditional Rendering: Admin Fee vs Margin */}
        {calculationType === "admin" && (
          <div className="flex flex-col gap-y-1.5">
            <Label>Admin Fee</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={formatRupiah(form.admin_fee ?? "")}
              onChange={(e) => {
            const raw = e.target.value;
            const parsed = parseRupiah(raw);
            setForm({
              ...form,
              admin_fee: raw === "" ? undefined : parsed,
              margin: 0, // Pastikan margin 0 jika user input admin fee (safety)
            });
              }}
              readOnly={readonly}
              placeholder="Rp 0"
              className="w-full"
            />
          </div>
        )}

        {calculationType === "admin+margin" && (
          <>
            <div className="flex flex-col gap-y-1.5">
              <Label>Admin Fee</Label>
              <Input
            type="text"
            inputMode="numeric"
            value={formatRupiah(form.admin_fee ?? "")}
            onChange={(e) => {
              const raw = e.target.value;
              const parsed = parseRupiah(raw);
              setForm({
                ...form,
                admin_fee: raw === "" ? undefined : parsed,
              });
            }}
            readOnly={readonly}
            placeholder="Rp 0"
            className="w-full"
              />
            </div>
            <div className="flex flex-col gap-y-1.5">
              <Label>Margin (%)</Label>
              <Input
            type="number"
            inputMode="decimal"
            value={form.margin ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              setForm({
                ...form,
                margin: raw === "" ? undefined : Number(raw),
              });
            }}
            readOnly={readonly}
            placeholder="0"
            className="w-full"
              />
            </div>
          </>
        )}

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
            readOnly={readonly}
            placeholder="0"
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-y-1.5">
          <Label>Metode Perhitungan Bunga</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={form.interest_calculation_method || "anuitas"}
            onChange={(e) =>
              setForm({
                ...form,
                interest_calculation_method: e.target.value as InterestCalculationMethod,
              })
            }
            disabled={readonly}
            aria-label="Metode perhitungan bunga"
          >
            <option value="flat">Flat</option>
            <option value="efektif">Efektif</option>
            <option value="anuitas">Anuitas</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Default: Anuitas
          </p>
        </div>

        <div className="flex flex-col gap-y-1.5">
          <Label>Tipe Denda Keterlambatan</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={form.late_interest_type ?? "percent"}
            onChange={(e) =>
              setForm({
                ...form,
                late_interest_type: e.target.value as LateInterestType,
              })
            }
            disabled={readonly}
            aria-label="Tipe denda keterlambatan"
          >
            <option value="percent">Persen (%)</option>
            <option value="fixed">Nominal (Rp)</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Denda dihitung per hari keterlambatan
          </p>
        </div>

        <div className="flex flex-col gap-y-1.5">
          <Label>
            Nilai Denda Keterlambatan{" "}
            {form.late_interest_type === "fixed" ? "(Rp)" : "(%)"}
          </Label>
          {form.late_interest_type === "fixed" ? (
            <Input
              type="text"
              inputMode="numeric"
              value={formatRupiah(form.late_interest_value ?? "")}
              onChange={(e) => {
                const raw = e.target.value;
                const parsed = parseRupiah(raw);
                setForm({
                  ...form,
                  late_interest_value: raw === "" ? undefined : parsed,
                });
              }}
              readOnly={readonly}
              placeholder="Rp 0"
              className="w-full"
            />
          ) : (
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              value={form.late_interest_value ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                setForm({
                  ...form,
                  late_interest_value: raw === "" ? undefined : Number(raw),
                });
              }}
              readOnly={readonly}
              placeholder="0"
              className="w-full"
            />
          )}
          <p className="text-xs text-muted-foreground">
            {form.late_interest_type === "fixed"
              ? "Nominal denda per hari (contoh: Rp 10.000)"
              : "Persentase dari angsuran per hari (contoh: 0.1)"}
          </p>
        </div>

        <div className="flex flex-col gap-y-1.5">
          <Label>Status</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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