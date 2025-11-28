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
import { useGetSimpananBerjangkaCategoriesListQuery } from "@/services/admin/konfigurasi/simpanan-berjangka-kategori.service";

import { Combobox } from "@/components/ui/combo-box";

type Props = {
  id?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
};

// Interface Category
interface RawCategoryResponseItem {
  id: number;
  name?: string | null;
  category_name?: string | null;
  category_code?: string | null;
}

// Interface Combobox Category
type Category = {
  id: number;
  name: string;
  category_code?: string | null;
};

type Anggota = {
  id: number;
  name?: string | null;
  user_name?: string | null;
  email?: string | null;
  full_name?: string | null;
};

interface PaginatedResponse<T> {
  data?: T[] | { data?: T[] };
}

// --- HELPER FORMAT NOMINAL ---
const formatNumber = (num: number | undefined | null) => {
  if (num === undefined || num === null) return "";
  return new Intl.NumberFormat("id-ID").format(num);
};

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

  // --- LOGIKA PENCARIAN ANGGOTA ---
  const [searchQuery, setSearchQuery] = useState<string>("");
  const minSearchLength = 3; // Batas minimal huruf

  const anggotaQuery = useGetAnggotaListQuery(
    { paginate: 100, page: 1, search: searchQuery },
    { skip: searchQuery.length < minSearchLength } // Skip jika kurang dari 3 huruf
  );

  // kategoriOptions
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

  // anggotaOptions
  const anggotaOptions = useMemo<Anggota[]>(() => {
    // Jika query kurang dari 3 huruf, kembalikan array kosong agar list tidak tampil
    if (searchQuery.length < minSearchLength) return [];

    const resp = anggotaQuery.data as PaginatedResponse<Anggota>;
    if (!resp || !resp.data) return [];
    return Array.isArray(resp.data) ? resp.data : resp.data.data ?? [];
  }, [anggotaQuery.data, searchQuery]); // Dependency pada searchQuery

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // ambil data by id kalau edit
  const byIdQuery = useGetSimpananBerjangkaByIdQuery(
    id ?? (skipToken as unknown as number),
    { skip: !id }
  );

  // State Form
  const initialFormState: Partial<SimpananBerjangka> = useMemo(
    () => ({
      simpanan_berjangka_category_id: undefined,
      user_id: undefined,
      description: "",
      date: "",
      nominal: undefined,
      term_months: undefined,
      type: "manual",
      payment_method: undefined,
      payment_channel: undefined,
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
      setForm({
        simpanan_berjangka_category_id: d.simpanan_berjangka_category_id,
        user_id: d.user_id,
        description: d.description ?? "",
        date: d.date ? d.date.substring(0, 16) : "",
        nominal: d.nominal,
        term_months: d.term_months,
        type: d.type ?? "manual",
        payment_method: d.payment_method ?? undefined,
        payment_channel: d.payment_channel ?? undefined,
        image: d.image ?? null,
      });
    } else if (!id) {
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

  // --- HANDLER NOMINAL ---
  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Hapus karakter selain angka
    const rawValue = e.target.value.replace(/\D/g, "");
    const numericValue = rawValue ? parseInt(rawValue, 10) : undefined;
    setField("nominal", numericValue);
  };

  // type guard file
  function isFile(v: unknown): v is File {
    return typeof File !== "undefined" && v instanceof File;
  }

  // validation
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
      if (
        !form.image ||
        (typeof form.image !== "string" && !isFile(form.image))
      )
        return { ok: false, message: "Image wajib untuk tipe manual" };
      if (isFile(form.image) && form.image.size > 5_120_000)
        return { ok: false, message: "Ukuran image maksimal 5 MB" };
    }

    if (form.type === "automatic") {
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

    const payload: Partial<SimpananBerjangka> = {
      ...form,
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

  const getAnggotaLabel = (a: Anggota) =>
    `${a.name ?? a.full_name ?? a.user_name ?? `Anggota ${a.id}`}${
      a.email ? ` — ${a.email}` : ""
    }`;

  const firstInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    firstInputRef.current?.focus();
  }, [id]);

  const isLoadingData = id && byIdQuery.isLoading;

  if (isLoadingData) {
    return <div>Memuat data simpanan berjangka...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kategori */}
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

        {/* Anggota */}
        <div>
          <Label htmlFor="anggota-select">Anggota</Label>
          <div className="mt-1">
            <Combobox<Anggota>
              value={form.user_id ?? null}
              onChange={(v) => setField("user_id", v)}
              onSearchChange={handleSearchChange}
              data={anggotaOptions}
              isLoading={
                // Loading hanya jika query sedang berjalan dan panjang karakter cukup
                searchQuery.length >= minSearchLength && anggotaQuery.isLoading
              }
              placeholder="Cari anggota..."
              getOptionLabel={(a) => getAnggotaLabel(a)}
            />
          </div>
          {/* Tulisan bantuan jika kurang dari 3 huruf */}
          {searchQuery.length > 0 && searchQuery.length < minSearchLength && (
            <p className="text-xs text-red-500 mt-1">
              * Masukkan minimal {minSearchLength} huruf untuk mencari nama
              anggota.
            </p>
          )}
        </div>

        {/* Tanggal */}
        <div>
          <Label htmlFor="date-input">Tanggal</Label>
          <Input
            id="date-input"
            ref={firstInputRef}
            type="datetime-local"
            value={form.date ? String(form.date).substring(0, 16) : ""}
            onChange={(e) => setField("date", e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Nominal dengan Format */}
        <div>
          <Label htmlFor="nominal-input">Nominal</Label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              Rp
            </span>
            <Input
              id="nominal-input"
              type="text" // Menggunakan text agar bisa ada separator
              value={formatNumber(form.nominal)} // Tampilkan format ribuan
              onChange={handleNominalChange}
              className="pl-9" // Padding kiri untuk "Rp"
              placeholder="0"
            />
          </div>
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
                setField("image", f);
              }}
            />

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

            {!form.image && !id && (
              <div className="mt-1 text-sm text-muted-foreground">
                Belum ada gambar yang dipilih.
              </div>
            )}

            {typeof form.image === "string" && id && (
              <div className="mt-1 text-sm text-muted-foreground">
                Gambar saat ini: {form.image.substring(0, 50)}...
              </div>
            )}
          </div>
        </div>
      </div>

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