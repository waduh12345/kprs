"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Pinjaman } from "@/types/admin/pinjaman";
import { useGetPinjamanCategoryListQuery } from "@/services/master/pinjaman-category.service";
import { formatRupiah, parseRupiah } from "@/lib/format-utils";
import { AnggotaPicker } from "../ui/anggota-picker";
import { Combobox } from "@/components/ui/combo-box"; // Pastikan path ini sesuai

/* ===================== Anggota Picker (min 3 char, sama spt SimpananForm) ===================== */
export type Anggota = {
  id: number;
  user_id: number;
  user_name?: string | null;
  user_email?: string | null;
  status?: number | null;
};
export const MIN_CHARS = 3;
export const DEBOUNCE_MS = 350;

/* ===================== Form Utama ===================== */

type CategoryItem = { 
  id: number; 
  name: string; 
  code?: string | null;
  interest_rate?: number; // Tambahan dari API
  admin_fee?: number;     // Tambahan dari API
};

interface FormPinjamanProps {
  form: Partial<Pinjaman>;
  setForm: (data: Partial<Pinjaman>) => void;
  onCancel: () => void;
  onSubmit: () => void;
  readonly?: boolean;
  isLoading?: boolean;
}

// Memperluas tipe Form jika tipe Pinjaman belum memiliki admin_fee
type ExtendedForm = Partial<Pinjaman> & {
  admin_fee?: number;
};

export default function FormPinjaman({
  form,
  setForm,
  onCancel,
  onSubmit,
  readonly = false,
  isLoading = false,
}: FormPinjamanProps) {
  const { data: categoriesData, isLoading: isCatLoading } =
    useGetPinjamanCategoryListQuery({
      page: 1,
      paginate: 10,
    });
  const categories: CategoryItem[] = (categoriesData?.data ??
    []) as CategoryItem[];

  // Handler saat produk dipilih
  const handleCategoryChange = (id: number | null) => {
    // 1. Set ID Kategori
    const updates: ExtendedForm = { ...form, pinjaman_category_id: id ?? undefined };

    // 2. Cari data detail kategori berdasarkan ID
    const selectedCategory = categories.find((c) => c.id === id);

    if (selectedCategory) {
      // 3. Auto-fill Bunga & Admin Fee dari API
      updates.interest_rate = selectedCategory.interest_rate;
      updates.admin_fee = selectedCategory.admin_fee;
    } else {
      // Reset jika di-clear (opsional, tergantung kebutuhan)
      updates.interest_rate = undefined;
      updates.admin_fee = undefined;
    }

    setForm(updates);
  };

  // preset nominal (sama dengan SimpananForm; bebas kamu sesuaikan)
  const nominalPresets: number[] = [
    500_000, 1_000_000, 5_000_000, 10_000_000, 25_000_000, 50_000_000,
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 w-full max-w-4xl space-y-6 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          {readonly
            ? "Detail Pinjaman"
            : form.id
            ? "Edit Pinjaman"
            : "Tambah Pinjaman"}
        </h2>
        <Button variant="ghost" onClick={onCancel}>
          ✕
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ========== KATEGORI PEMBIAYAAN (DROPDOWN SEARCH) ========== */}
        <div className="md:col-span-2">
          <Label className="mb-2 block">Pembiayaan *</Label>
          <Combobox<CategoryItem>
            value={form.pinjaman_category_id ?? null}
            onChange={handleCategoryChange}
            data={categories}
            isLoading={isCatLoading}
            placeholder="Pilih atau cari kategori..."
            getOptionLabel={(item) => item.name}
            disabled={readonly}
          />
        </div>

        {/* ========== NOMINAL PEMBIAYAAN (INPUT ONLY) ========== */}
        <div className="md:col-span-2">
          <Label className="mb-2 block">Nominal Pembiayaan *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              Rp
            </span>
            <Input
              type="text"
              inputMode="numeric"
              className="pl-9 h-12 rounded-lg text-lg font-medium"
              value={formatRupiah(form.nominal ?? "")}
              onChange={(e) => {
                const raw = e.target.value;
                const parsed = parseRupiah(raw);
                setForm({
                  ...form,
                  nominal: raw === "" ? undefined : parsed,
                });
              }}
              readOnly={readonly}
              placeholder="Contoh: 10.000.000"
            />
          </div>
        </div>

        {/* ========== ANGGOTA ========== */}
        <div className="flex flex-col gap-y-2">
          <Label>Anggota *</Label>
          <AnggotaPicker
            selectedId={typeof form.user_id === "number" ? form.user_id : null}
            onChange={(u) =>
              setForm({ ...form, user_id: u ? Number(u.user_id) : undefined })
            }
            disabled={readonly}
          />
        </div>

        {/* Tanggal Pembiayaan */}
        <div className="flex flex-col gap-y-2">
          <Label>Tanggal Pembiayaan *</Label>
          <Input
            type="datetime-local"
            className="h-10 rounded-md"
            value={
              form.date ? new Date(form.date).toISOString().slice(0, 16) : ""
            }
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            readOnly={readonly}
          />
        </div>

        {/* Tenor */}
        <div className="flex flex-col gap-y-2">
          <Label>Tenor (Bulan) *</Label>
          <Input
            type="number"
            value={form.tenor ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                tenor:
                  e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            readOnly={readonly}
            placeholder="Masukkan tenor dalam bulan"
            className="h-10"
          />
        </div>

        {/* Suku Bunga */}
        <div className="flex flex-col gap-y-2">
          <Label>Suku Bunga (%) *</Label>
          <Input
            type="number"
            step="0.01"
            value={form.interest_rate ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                interest_rate:
                  e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            readOnly={readonly}
            placeholder="Masukkan suku bunga"
            className="h-10"
          />
        </div>

        {/* Deskripsi */}
        <div className="flex flex-col gap-y-2 md:col-span-2">
          <Label>Deskripsi</Label>
          <Textarea
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            readOnly={readonly}
            placeholder="Masukkan deskripsi pembiayaan (opsional)"
            rows={3}
          />
        </div>
      </div>

      {!readonly && (
        <div className="pt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      )}
    </div>
  );
}