"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { skipToken } from "@reduxjs/toolkit/query";
import Swal from "sweetalert2";

import type { SimpananBerjangka } from "@/types/admin/simpanan/simpanan-berjangka";
import {
  useCreateSimpananBerjangkaMutation,
  useGetSimpananBerjangkaByIdQuery,
  useUpdateSimpananBerjangkaMutation,
} from "@/services/admin/simpanan/simpanan-berjangka.service";
import { useGetAnggotaListQuery } from "@/services/koperasi-service/anggota.service";
// Perhatikan: asumsikan useGetSimpananBerjangkaCategoriesListQuery tersedia di path yang sama atau path yang relevan
import { useGetSimpananBerjangkaCategoriesListQuery } from "@/services/admin/konfigurasi/simpanan-berjangka-kategori.service";

import { Combobox } from "@/components/ui/combo-box";

type Props = {
  id?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
};

// Interface Category disesuaikan untuk SimpananBerjangkaCategories
// Menambahkan properti opsional untuk mengatasi ketidakpastian struktur respons mentah
interface RawCategoryResponseItem {
  id: number;
  name?: string | null;
  category_name?: string | null;
  category_code?: string | null;
}

// Interface Category yang digunakan di Combobox
type Category = {
  id: number;
  name: string; // Menggunakan 'name' sebagai label utama yang sudah diolah
  category_code?: string | null;
};

type Anggota = {
  id: number;
  name?: string | null;
  user_name?: string | null;
  email?: string | null;
  full_name?: string | null;
};

// Response Wrapper yang umum dari API dengan Paginasi/Wrapper Data
interface PaginatedResponse<T> {
  data?: T[] | { data?: T[] };
}

export default function SimpananBerjangkaForm({
  id,
  onSuccess,
  onCancel,
}: Props) {
  // --- queries ---
  const kategoriQuery = useGetSimpananBerjangkaCategoriesListQuery({
    paginate: 100,
    page: 1,
  });
  const anggotaQuery = useGetAnggotaListQuery({ paginate: 100, page: 1 });

  // kategoriOptions (typed: Category[])
  const kategoriOptions = useMemo<Category[]>(() => {
    const resp =
      kategoriQuery.data as PaginatedResponse<RawCategoryResponseItem>;

    if (!resp || !resp.data) return [];

    const raw: RawCategoryResponseItem[] = Array.isArray(resp.data)
      ? resp.data
      : resp.data.data ?? [];

    return raw
      .map((c) => ({
        id: c.id,
        name: c.category_name || c.name || `Kategori ${c.id}`,
        category_code: c.category_code ?? null,
      }))
      .filter((c) => !!c.id && !!c.name);
  }, [kategoriQuery.data]);

  const anggotaOptions = useMemo<Anggota[]>(() => {
    const resp = anggotaQuery.data as PaginatedResponse<Anggota>;

    if (!resp || !resp.data) return [];

    return Array.isArray(resp.data) ? resp.data : resp.data.data ?? [];
  }, [anggotaQuery.data]);

  // ambil data by id kalau edit
  const byIdQuery = useGetSimpananBerjangkaByIdQuery(
    id ?? (skipToken as unknown as number),
    { skip: !id }
  );

  // State untuk form. Penting: Gunakan undefined untuk field yang boleh kosong
  const initialFormState: Partial<SimpananBerjangka> = useMemo(
    () => ({
      simpanan_berjangka_category_id: undefined,
      user_id: undefined,
      description: "",
      date: "",
      nominal: undefined,
      term_months: undefined,
      type: "manual", // Default: manual
      payment_method: undefined, // Field dari SimpananBerjangka interface
      payment_channel: undefined, // Field dari SimpananBerjangka interface
      image: null,
    }),
    []
  );

  const [form, setForm] =
    useState<Partial<SimpananBerjangka>>(initialFormState);

  // mutations
  const [createMutation, { isLoading: creating }] =
    useCreateSimpananBerjangkaMutation();
  const [updateMutation, { isLoading: updating }] =
    useUpdateSimpananBerjangkaMutation();

  // populate jika edit
  useEffect(() => {
    if (
      id &&
      byIdQuery.data &&
      "data" in byIdQuery.data &&
      byIdQuery.data.data
    ) {
      const d = byIdQuery.data.data as SimpananBerjangka;
      // Isi form dengan data yang didapat
      setForm({
        simpanan_berjangka_category_id: d.simpanan_berjangka_category_id,
        user_id: d.user_id,
        description: d.description ?? "",
        // Konversi date string agar sesuai dengan input datetime-local
        date: d.date ? d.date.substring(0, 16) : "",
        nominal: d.nominal,
        term_months: d.term_months,
        type: d.type ?? "manual",
        payment_method: d.payment_method ?? undefined, // Mengakses properti yang sudah ada di interface
        payment_channel: d.payment_channel ?? undefined, // Mengakses properti yang sudah ada di interface
        image: d.image ?? null,
      });
    } else if (!id) {
      // Reset form ke initial state saat mode tambah
      setForm(initialFormState);
    }
  }, [id, byIdQuery.data, initialFormState]);

  // helper setField
  function setField<K extends keyof Partial<SimpananBerjangka>>(
    key: K,
    value: Partial<SimpananBerjangka>[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // type guard file
  function isFile(v: unknown): v is File {
    return typeof File !== "undefined" && v instanceof File;
  }

  // validation (logika validasi tetap sama)
  function validate(): { ok: boolean; message?: string } {
    if (!form.simpanan_berjangka_category_id)
      return { ok: false, message: "Kategori wajib diisi" };
    if (!form.user_id) return { ok: false, message: "Anggota wajib diisi" };
    if (!form.date || String(form.date).trim() === "")
      return { ok: false, message: "Tanggal wajib diisi" };
    if (
      form.nominal === undefined ||
      Number.isNaN(Number(form.nominal)) ||
      Number(form.nominal) <= 0
    )
      return { ok: false, message: "Nominal harus lebih dari 0" };
    if (
      form.term_months === undefined ||
      Number.isNaN(Number(form.term_months)) ||
      Number(form.term_months) <= 0
    )
      return { ok: false, message: "Term bulan harus lebih dari 0" };

    if (form.type === "manual") {
      // Jika mode edit dan image masih berupa string (URL lama) tidak perlu validasi file
      if (
        !form.image ||
        (typeof form.image !== "string" && !isFile(form.image))
      )
        return { ok: false, message: "Image wajib untuk tipe manual" };
      if (isFile(form.image) && form.image.size > 5_120_000)
        return { ok: false, message: "Ukuran image maksimal 5 MB" };
    }

    if (form.type === "automatic") {
      // Logika untuk automatic type
      if (!form.payment_method)
        return {
          ok: false,
          message: "Payment method wajib untuk tipe automatic",
        };
      if (!form.payment_channel)
        return {
          ok: false,
          message: "Payment channel wajib untuk tipe automatic",
        };
    }

    return { ok: true };
  }

  // submit
  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault?.();
    const v = validate();
    if (!v.ok) {
      Swal.fire("Validasi", v.message ?? "Periksa form", "warning");
      return;
    }

    // Persiapan data untuk payload (menghilangkan 'as Partial<SimpananBerjangka>')
    const payload: Partial<SimpananBerjangka> = {
      simpanan_berjangka_category_id: form.simpanan_berjangka_category_id,
      user_id: form.user_id,
      description: form.description,
      date: form.date,
      nominal: form.nominal,
      term_months: form.term_months,
      type: form.type,
      payment_method: form.payment_method,
      payment_channel: form.payment_channel,
      image: form.image,
      // Hapus properti yang mungkin undefined jika tidak ingin dikirim
    };

    try {
      if (id) {
        await updateMutation({
          id,
          data: payload,
        }).unwrap();
        Swal.fire("Berhasil", "Data berhasil diubah", "success");
      } else {
        await createMutation(payload).unwrap();
        Swal.fire("Berhasil", "Data berhasil dibuat", "success");
      }
      onSuccess?.();
    } catch (error) {
      console.error("Submission Error:", error);
      Swal.fire("Gagal", "Terjadi kesalahan saat menyimpan", "error");
    }
  }

  // Combobox helpers: getOptionLabel
  const getCategoryLabel = (c: Category) =>
    `${c.name ?? c.category_code ?? `ID:${c.id}`}`;
  const getAnggotaLabel = (a: Anggota) =>
    `${a.name ?? a.full_name ?? a.user_name ?? `Anggota ${a.id}`}${
      a.email ? ` — ${a.email}` : ""
    }`;

  // refs for accessibility
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    // focus first input when form mounts
    firstInputRef.current?.focus();
  }, [id]); // Rerun effect saat id berubah (mode edit/tambah)

  // Jika sedang mode edit dan data masih loading, tampilkan loading
  const isLoadingData = id && byIdQuery.isLoading;

  if (isLoadingData) {
    return <div>Memuat data simpanan berjangka...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kategori (Combobox) */}
        <div>
          <Label htmlFor="category-select">Produk (Kategori)</Label>
          <div className="mt-1">
            <Combobox<Category>
              value={form.simpanan_berjangka_category_id ?? null}
              onChange={(v) => setField("simpanan_berjangka_category_id", v)}
              onSearchChange={undefined}
              data={kategoriOptions}
              isLoading={kategoriQuery.isLoading}
              placeholder="Pilih kategori..."
              getOptionLabel={(c) => c.name}
            />
          </div>
        </div>

        {/* Anggota (Combobox) */}
        <div>
          <Label htmlFor="anggota-select">Anggota</Label>
          <div className="mt-1">
            <Combobox<Anggota>
              value={form.user_id ?? null}
              onChange={(v) => setField("user_id", v)}
              onSearchChange={undefined}
              data={anggotaOptions}
              isLoading={anggotaQuery.isLoading}
              placeholder="Pilih anggota..."
              getOptionLabel={(a) => getAnggotaLabel(a)}
            />
          </div>
        </div>

        {/* Tanggal */}
        <div>
          <Label htmlFor="date-input">Tanggal</Label>
          <Input
            id="date-input"
            ref={firstInputRef}
            type="datetime-local"
            // Konversi date string agar sesuai dengan input datetime-local
            value={form.date ? String(form.date).substring(0, 16) : ""}
            onChange={(e) => setField("date", e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Nominal */}
        <div>
          <Label htmlFor="nominal-input">Nominal</Label>
          <Input
            id="nominal-input"
            type="number"
            value={form.nominal !== undefined ? String(form.nominal) : ""}
            onChange={(e) =>
              setField(
                "nominal",
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            className="mt-1"
            min={0}
          />
        </div>

        {/* Term */}
        <div>
          <Label htmlFor="term-input">Term (bulan)</Label>
          <Input
            id="term-input"
            type="number"
            value={
              form.term_months !== undefined ? String(form.term_months) : ""
            }
            onChange={(e) =>
              setField(
                "term_months",
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            className="mt-1"
            min={1}
          />
        </div>

        {/* Deskripsi */}
        <div>
          <Label htmlFor="description-input">Deskripsi</Label>
          <Input
            id="description-input"
            value={form.description ?? ""}
            onChange={(e) => setField("description", e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Type */}
        <div className="md:col-span-2">
          <Label>Tipe</Label>
          <div className="flex items-center gap-6 mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                checked={form.type === "manual"}
                onChange={() => setField("type", "manual")}
              />
              <span className="select-none">Manual</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                checked={form.type === "automatic"}
                onChange={() => setField("type", "automatic")}
              />
              <span className="select-none">Automatic</span>
            </label>
          </div>
        </div>

        {/* Automatic fields */}
        {form.type === "automatic" && (
          <>
            <div>
              <Label htmlFor="pm-select">Payment Method</Label>
              <select
                id="pm-select"
                value={form.payment_method ?? ""}
                onChange={(e) =>
                  setField("payment_method", e.target.value || undefined)
                }
                className="mt-1 w-full border rounded px-3 py-2 dark:bg-slate-800 dark:border-slate-700"
              >
                <option value="">Pilih metode</option>
                <option value="bank_transfer">bank_transfer</option>
                <option value="qris">qris</option>
              </select>
            </div>

            <div>
              <Label htmlFor="pc-select">Payment Channel</Label>
              <select
                id="pc-select"
                value={form.payment_channel ?? ""}
                onChange={(e) =>
                  setField("payment_channel", e.target.value || undefined)
                }
                className="mt-1 w-full border rounded px-3 py-2 dark:bg-slate-800 dark:border-slate-700"
              >
                <option value="">Pilih channel</option>
                <option value="bca">bca</option>
                <option value="bni">bni</option>
                <option value="bri">bri</option>
                <option value="cimb">cimb</option>
                <option value="qris">qris</option>
              </select>
            </div>
          </>
        )}

        {/* Image */}
        <div className="md:col-span-2">
          <Label htmlFor="image-upload">
            Image{" "}
            {form.type === "manual"
              ? "(wajib untuk manual, max 5MB)"
              : "(opsional)"}
          </Label>
          <div className="mt-1 flex flex-col gap-2">
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setField("image", f); // Simpan File object atau null
              }}
            />

            {/* Tampilkan preview jika ada URL lama atau File object baru (gunakan URL.createObjectURL) */}
            {form.image && (
              <div className="mt-2">
                <img
                  src={
                    isFile(form.image)
                      ? URL.createObjectURL(form.image)
                      : typeof form.image === "string"
                      ? form.image
                      : undefined
                  }
                  alt="preview"
                  className="max-h-40 object-contain rounded"
                />
              </div>
            )}

            {!form.image &&
              !id && ( // Tampilkan info jika mode tambah dan belum ada gambar
                <div className="mt-1 text-sm text-muted-foreground">
                  Belum ada gambar yang dipilih.
                </div>
              )}

            {/* Tampilkan pesan jika ada URL lama, namun ingin diganti */}
            {typeof form.image === "string" && id && (
              <div className="mt-1 text-sm text-muted-foreground">
                Gambar saat ini: {form.image.substring(0, 50)}...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => onCancel?.()}>
          Batal
        </Button>
        <Button
          type="submit"
          onClick={(e) => handleSubmit(e)}
          disabled={creating || updating}
        >
          {id
            ? updating
              ? "Menyimpan..."
              : "Simpan Perubahan"
            : creating
            ? "Membuat..."
            : "Buat"}
        </Button>
      </div>
    </form>
  );
}
