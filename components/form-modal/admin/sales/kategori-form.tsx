"use client";

import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Kategori } from "@/types/admin/sales/kategori";

interface FormSalesCategoryProps {
  form: Partial<Kategori>;
  setForm: (data: Partial<Kategori>) => void;
  onCancel: () => void;
  onSubmit: () => void;
  readonly?: boolean;
  isLoading?: boolean;
}

export default function FormKategori({
  form,
  setForm,
  onCancel,
  onSubmit,
  readonly = false,
  isLoading = false,
}: FormSalesCategoryProps) {
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
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 w-full max-w-2xl space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          {readonly
            ? "Detail Kategori Sales"
            : form.id
            ? "Edit Kategori Sales"
            : "Tambah Kategori Sales"}
        </h2>
        <Button variant="ghost" onClick={onCancel}>
          ✕
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-y-1 col-span-2">
          <Label>Kode</Label>
          <Input
            value={form.code || ""}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            readOnly={readonly}
            placeholder="Masukkan kode kategori"
          />
        </div>

        <div className="flex flex-col gap-y-1 col-span-2">
          <Label>Nama</Label>
          <Input
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            readOnly={readonly}
            placeholder="Masukkan nama kategori"
          />
        </div>

        <div className="flex flex-col gap-y-1 col-span-2">
          <Label>Status</Label>
          <select
            className="border rounded-md px-3 py-2 text-sm bg-white dark:bg-zinc-800"
            value={typeof form.status === "boolean" ? (form.status ? 1 : 0) : form.status ?? 1}
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

        <div className="flex flex-col gap-y-1 col-span-2">
          <Label>Deskripsi</Label>
          <Textarea
            value={form.description || ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            readOnly={readonly}
            placeholder="Masukkan deskripsi kategori"
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
