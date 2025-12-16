"use client";

import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Data } from "@/types/admin/sales/data";
import { useGetKategoriListQuery } from "@/services/admin/sales/kategori.service";

// Pastikan interface Data memiliki field 'sales_category_id'
// Jika belum, tambahkan di file types Anda: sales_category_id?: number;

interface FormSalesProps {
  form: Partial<Data> & { sales_category_id?: number }; // Extended type safe
  setForm: (data: Partial<Data>) => void;
  onCancel: () => void;
  onSubmit: () => void;
  readonly?: boolean;
  isLoading?: boolean;
}

export default function FormData({
  form,
  setForm,
  onCancel,
  onSubmit,
  readonly = false,
  isLoading = false,
}: FormSalesProps) {
  
  // 1. Panggil API Kategori
  // Kita ambil page 1 dengan limit besar (misal 100) untuk dropdown
  const { data: categoryData, isLoading: isCategoryLoading } = useGetKategoriListQuery({
    page: 1,
    paginate: 100,
  });

  // Helper untuk akses list kategori dari response API
  // Path: response.data.data (berdasarkan struktur JSON yang Anda kirim)
  const categories = categoryData?.data || [];

  useEffect(() => {
    if (!form.id && form.status === undefined) {
      setForm({
        ...form,
        status: 1, // Default Aktif
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.id, form.status]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 w-full max-w-2xl space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          {readonly
            ? "Detail Data Sales"
            : form.id
            ? "Edit Data Sales"
            : "Tambah Data Sales"}
        </h2>
        <Button variant="ghost" onClick={onCancel}>
          ✕
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Input Kategori Sales (Dropdown dari API) */}
        <div className="flex flex-col gap-y-1 col-span-2">
          <Label>Kategori Sales</Label>
          <select
            className="border rounded-md px-3 py-2 text-sm bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            value={form.sales_category_id || ""}
            onChange={(e) => {
              const val = e.target.value;
              setForm({ ...form, sales_category_id: val ? Number(val) : undefined });
            }}
            disabled={readonly || isCategoryLoading}
          >
            <option value="">-- Pilih Kategori --</option>
            {isCategoryLoading ? (
              <option disabled>Memuat kategori...</option>
            ) : (
              categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.code})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex flex-col gap-y-1 col-span-2">
          <Label>Kode</Label>
          <Input
            value={form.code || ""}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            readOnly={readonly}
            placeholder="Masukkan kode sales"
          />
        </div>

        <div className="flex flex-col gap-y-1 col-span-2">
          <Label>Nama</Label>
          <Input
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            readOnly={readonly}
            placeholder="Masukkan nama lengkap"
          />
        </div>

        <div className="flex flex-col gap-y-1 col-span-2">
          <Label>No. HP</Label>
          <Input
            value={form.phone || ""}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            readOnly={readonly}
            placeholder="Masukkan nomor HP"
          />
        </div>

        <div className="flex flex-col gap-y-1 col-span-2">
          <Label>Alamat</Label>
          <Textarea
            value={form.address || ""}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            readOnly={readonly}
            placeholder="Masukkan alamat lengkap"
            rows={3}
          />
        </div>

        <div className="flex flex-col gap-y-1 col-span-2">
          <Label>Status</Label>
          <select
            className="border rounded-md px-3 py-2 text-sm bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            value={typeof form.status === "boolean" ? (form.status ? 1 : 0) : form.status ?? 1}
            onChange={(e) => {
              const newStatus = Number(e.target.value);
              setForm({ ...form, status: newStatus });
            }}
            disabled={readonly}
          >
            <option value={1}>Aktif</option>
            <option value={0}>Nonaktif</option>
          </select>
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