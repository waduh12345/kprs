"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { InputSimpanan } from "@/types/admin/simpanan/input-simpanan";
import { Combobox } from "@/components/ui/combo-box";
import type React from "react";

type CategoryItem = { id: number; name: string; code?: string | null };
type AnggotaItem = { id: number; name?: string; email?: string };

type Props = {
  form: Partial<InputSimpanan>;
  setForm: (data: Partial<InputSimpanan>) => void;
  onCancel: () => void;
  onSubmit: () => void;
  readonly?: boolean;
  isLoading?: boolean;
  categories: CategoryItem[];
  showAllCategories: boolean;
  setShowAllCategories: (v: boolean) => void;
  anggota?: AnggotaItem[]; // passed from page
  anggotaLoading?: boolean;
};

export default function FormSimpanan({
  form,
  setForm,
  onCancel,
  onSubmit,
  readonly = false,
  isLoading = false,
  categories,
  showAllCategories,
  setShowAllCategories,
  anggota = [],
  anggotaLoading = false,
}: Props) {
  // show first 6 categories, apabila lebih tampilkan tombol +N
  const visibleCategories = showAllCategories
    ? categories
    : categories.slice(0, 6);
  const remainingCount = Math.max(0, categories.length - 6);
  const isCreateMode = typeof form.id === "undefined" || form.id === null;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 w-full max-w-2xl space-y-6 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          {readonly
            ? "Detail Simpanan"
            : isCreateMode
            ? "Tambah Simpanan"
            : "Edit Simpanan"}
        </h2>
        <Button variant="ghost" onClick={onCancel} aria-label="Tutup">
          ✕
        </Button>
      </div>

      {/* CREATE MODE: pilih anggota + kategori (reference_id) */}
      {isCreateMode ? (
        <div className="space-y-4">
          <div>
            <Label>Anggota *</Label>
            <Combobox
              value={typeof form.user_id === "number" ? form.user_id : null}
              onChange={(v) => setForm({ ...form, user_id: v })}
              onSearchChange={() => {}}
              data={anggota}
              isLoading={anggotaLoading}
              placeholder="Pilih anggota"
              getOptionLabel={(item) =>
                `${item.name ?? "User"} (${item.email ?? "-"})`
              }
            />
          </div>

          <div>
            <Label className="block">Produk Simpanan *</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {visibleCategories.map((c) => {
                const active = form.reference_id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={readonly}
                    onClick={() => setForm({ ...form, reference_id: c.id })}
                    className={[
                      "h-12 rounded-2xl border text-sm font-semibold shadow-sm transition-all",
                      active
                        ? "border-neutral-800 bg-neutral-900 text-white"
                        : "border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50",
                      "disabled:opacity-60",
                    ].join(" ")}
                  >
                    {c.name}
                  </button>
                );
              })}

              {remainingCount > 0 && !showAllCategories && (
                <button
                  type="button"
                  onClick={() => setShowAllCategories(true)}
                  className="h-12 rounded-2xl border border-dashed text-sm font-semibold shadow-sm bg-white"
                  title={`Tampilkan ${remainingCount} kategori lainnya`}
                >
                  +{remainingCount}
                </button>
              )}

              {showAllCategories && remainingCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllCategories(false)}
                  className="h-12 rounded-2xl border text-sm font-semibold shadow-sm bg-white"
                >
                  Tampilkan sedikit
                </button>
              )}
            </div>
          </div>

          <div className="text-sm text-neutral-600">
            Pilih anggota dan kategori. Setelah klik <b>Simpan</b>, sistem akan
            membuat wallet (simpan).
          </div>
        </div>
      ) : (
        // UPDATE / DETAIL mode: tampilkan editable fields (name, account_number, description)
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label>Nama Simpanan</Label>
            <Input
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              readOnly={readonly}
              placeholder="Contoh: Simpanan Wajib"
              className="h-10 rounded"
            />
          </div>

          <div>
            <Label>No. Rekening</Label>
            <Input
              value={form.account_number ?? ""}
              onChange={(e) =>
                setForm({ ...form, account_number: e.target.value })
              }
              readOnly={readonly}
              placeholder="Contoh: 00117633xxxx"
              className="h-10 rounded"
            />
          </div>

          <div>
            <Label>Deskripsi (opsional)</Label>
            <Textarea
              value={form.description ?? ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              readOnly={readonly}
              rows={4}
            />
          </div>

          <div>
            <Label>Anggota</Label>
            <div className="text-sm text-neutral-700">
              {form.user?.name ?? `User ID: ${form.user_id ?? "-"}`}
            </div>
          </div>

          <div>
            <Label>Kategori</Label>
            <div className="text-sm text-neutral-700">
              {form.reference
                ? form.reference.name
                : `ID: ${form.reference_id ?? "-"}`}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
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

      {readonly && (
        <div className="pt-4 flex justify-end">
          <Button onClick={onCancel}>Tutup</Button>
        </div>
      )}
    </div>
  );
}