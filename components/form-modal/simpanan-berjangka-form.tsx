"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { skipToken } from "@reduxjs/toolkit/query";
import Swal from "sweetalert2";

import type {
  SimpananBerjangka,
  PaymentTypeSimpananBerjangka,
  SimpananBerjangkaStoreWithMasterRequest,
  SimpananBerjangkaStoreWithCategoryRequest,
  SimpananBerjangkaUpdateRequest,
} from "@/types/admin/simpanan/simpanan-berjangka";
import {
  useCreateSimpananBerjangkaMutation,
  useGetSimpananBerjangkaByIdQuery,
  useUpdateSimpananBerjangkaMutation,
} from "@/services/admin/simpanan/simpanan-berjangka.service";
import { useGetMasterBilyetBerjangkaListQuery } from "@/services/admin/konfigurasi/master-simpanan-berjangka.service";
import { useGetAnggotaListQuery } from "@/services/koperasi-service/anggota.service";
import { useGetSimpananBerjangkaCategoriesListQuery } from "@/services/admin/konfigurasi/simpanan-berjangka-kategori.service";
import type { MasterBilyetBerjangka } from "@/types/admin/konfigurasi/master-simpanan-berjangka";

import { Combobox } from "@/components/ui/combo-box";

type Props = {
  id?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
};

type StoreMode = "master" | "category";

interface RawCategoryResponseItem {
  id: number;
  name?: string | null;
  category_name?: string | null;
  category_code?: string | null;
}

type Category = {
  id: number;
  name: string;
  category_code?: string | null;
};

type MasterBilyetOption = {
  id: number;
  name: string;
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

const formatNumber = (num: number | undefined | null) => {
  if (num === undefined || num === null) return "";
  return new Intl.NumberFormat("id-ID").format(num);
};

export default function SimpananBerjangkaForm({
  id,
  onSuccess,
  onCancel,
}: Props) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const minSearchLength = 3;

  const [storeMode, setStoreMode] = useState<StoreMode>("master");

  const kategoriQuery = useGetSimpananBerjangkaCategoriesListQuery({
    paginate: 100,
    page: 1,
  });

  const masterBilyetQuery = useGetMasterBilyetBerjangkaListQuery({
    paginate: 100,
    page: 1,
    status: 1,
  });

  const anggotaQuery = useGetAnggotaListQuery(
    { paginate: 100, page: 1, search: searchQuery },
    { skip: searchQuery.length < minSearchLength }
  );

  const kategoriOptions = useMemo<Category[]>(() => {
    const resp = kategoriQuery.data as PaginatedResponse<RawCategoryResponseItem>;
    if (!resp || !resp.data) return [];
    const raw: RawCategoryResponseItem[] = Array.isArray(resp.data)
      ? resp.data
      : (resp.data as { data?: RawCategoryResponseItem[] }).data ?? [];
    return raw
      .map((c) => ({
        id: c.id,
        name: c.category_name || c.name || `Kategori ${c.id}`,
        category_code: c.category_code ?? null,
      }))
      .filter((c) => !!c.id && !!c.name);
  }, [kategoriQuery.data]);

  const masterBilyetOptions = useMemo<MasterBilyetOption[]>(() => {
    const data = masterBilyetQuery.data?.data ?? [];
    return (data as MasterBilyetBerjangka[]).map((m) => ({
      id: m.id,
      name: `${m.kode_bilyet} — ${m.nama_produk} (${m.tenor_bulan} bln)`,
    }));
  }, [masterBilyetQuery.data]);

  const anggotaOptions = useMemo<Anggota[]>(() => {
    if (searchQuery.length < minSearchLength) return [];
    const resp = anggotaQuery.data as PaginatedResponse<Anggota>;
    if (!resp || !resp.data) return [];
    return Array.isArray(resp.data) ? resp.data : (resp.data as { data?: Anggota[] }).data ?? [];
  }, [anggotaQuery.data, searchQuery]);

  const handleSearchChange = (query: string) => setSearchQuery(query);

  const byIdQuery = useGetSimpananBerjangkaByIdQuery(
    id ?? (skipToken as unknown as number),
    { skip: !id }
  );

  const initialFormState = useMemo(
    () => ({
      simpanan_berjangka_category_id: undefined as number | undefined,
      master_bilyet_berjangka_id: undefined as number | undefined,
      anggota_id: undefined as number | undefined,
      description: "" as string,
      date: "" as string,
      nominal: undefined as number | undefined,
      term_months: undefined as number | undefined,
      no_bilyet: "" as string,
      no_ao: "" as string,
      type: "manual" as PaymentTypeSimpananBerjangka,
      payment_method: undefined as string | undefined,
      payment_channel: undefined as string | undefined,
      image: null as File | string | null,
      status_bilyet: undefined as SimpananBerjangka["status_bilyet"] | undefined,
    }),
    []
  );

  const [form, setForm] = useState(initialFormState);

  const [createMutation, { isLoading: creating }] = useCreateSimpananBerjangkaMutation();
  const [updateMutation, { isLoading: updating }] = useUpdateSimpananBerjangkaMutation();

  useEffect(() => {
    if (!id) {
      setForm(initialFormState);
      setStoreMode("master");
      return;
    }
    const d = byIdQuery.data as SimpananBerjangka | undefined;
    if (!d) return;
    setForm({
      simpanan_berjangka_category_id: d.simpanan_berjangka_category_id ?? undefined,
      master_bilyet_berjangka_id: d.master_bilyet_berjangka_id ?? undefined,
      anggota_id: d.user_id,
      description: d.description ?? "",
      date: d.date ? d.date.substring(0, 16) : "",
      nominal: d.nominal,
      term_months: d.term_months,
      no_bilyet: d.no_bilyet ?? "",
      no_ao: d.no_ao ?? "",
      type: (d.type ?? "manual") as PaymentTypeSimpananBerjangka,
      payment_method: undefined,
      payment_channel: undefined,
      image: d.image ?? null,
      status_bilyet: d.status_bilyet,
    });
    setStoreMode(d.master_bilyet_berjangka_id != null ? "master" : "category");
  }, [id, byIdQuery.data]);

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setField("nominal", rawValue ? parseInt(rawValue, 10) : undefined);
  };

  function isFile(v: unknown): v is File {
    return typeof File !== "undefined" && v instanceof File;
  }

  function validate(): { ok: boolean; message?: string } {
    if (!form.anggota_id) return { ok: false, message: "Anggota wajib diisi" };
    if (!form.date || String(form.date).trim() === "")
      return { ok: false, message: "Tanggal wajib diisi" };
    if (
      form.nominal === undefined ||
      Number.isNaN(Number(form.nominal)) ||
      Number(form.nominal) <= 0
    )
      return { ok: false, message: "Nominal harus lebih dari 0" };

    if (!id) {
      if (storeMode === "master") {
        if (!form.master_bilyet_berjangka_id)
          return { ok: false, message: "Produk (Master Bilyet) wajib diisi" };
      } else {
        if (!form.simpanan_berjangka_category_id)
          return { ok: false, message: "Kategori wajib diisi" };
        if (
          form.term_months === undefined ||
          Number(form.term_months) <= 0
        )
          return { ok: false, message: "Term bulan harus lebih dari 0" };
        if (!form.no_bilyet?.trim())
          return { ok: false, message: "No. Bilyet wajib diisi" };
        if (!form.no_ao?.trim())
          return { ok: false, message: "No. AO wajib diisi" };
      }
    }

    if (form.type === "manual") {
      if (!form.image || (typeof form.image !== "string" && !isFile(form.image)))
        return { ok: false, message: "Image wajib untuk tipe manual" };
      if (isFile(form.image) && form.image.size > 5_120_000)
        return { ok: false, message: "Ukuran image maksimal 5 MB" };
    }

    if (form.type === "automatic") {
      if (!form.payment_method)
        return { ok: false, message: "Payment method wajib untuk tipe automatic" };
      if (!form.payment_channel)
        return { ok: false, message: "Payment channel wajib untuk tipe automatic" };
    }

    return { ok: true };
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault?.();
    const v = validate();
    if (!v.ok) {
      Swal.fire("Validasi", v.message ?? "Periksa form", "warning");
      return;
    }

    try {
      if (id) {
        const updatePayload: Partial<SimpananBerjangkaUpdateRequest> = {};
        if (form.description !== undefined) updatePayload.description = form.description;
        if (form.term_months !== undefined) updatePayload.term_months = form.term_months;
        if (form.status_bilyet !== undefined) updatePayload.status_bilyet = form.status_bilyet;
        if (form.image !== undefined && form.image !== null) updatePayload.image = isFile(form.image) ? form.image : undefined;
        await updateMutation({ id, payload: updatePayload }).unwrap();
        Swal.fire("Berhasil", "Data berhasil diubah", "success");
      } else {
        const type = form.type as PaymentTypeSimpananBerjangka;
        if (storeMode === "master") {
          const payload: SimpananBerjangkaStoreWithMasterRequest = {
            master_bilyet_berjangka_id: form.master_bilyet_berjangka_id!,
            anggota_id: form.anggota_id!,
            date: form.date!,
            nominal: form.nominal!,
            type,
            description: form.description || undefined,
            payment_method: form.payment_method as SimpananBerjangkaStoreWithMasterRequest["payment_method"],
            payment_channel: form.payment_channel as SimpananBerjangkaStoreWithMasterRequest["payment_channel"],
            image: isFile(form.image) ? form.image : undefined,
          };
          await createMutation(payload).unwrap();
        } else {
          const payload: SimpananBerjangkaStoreWithCategoryRequest = {
            simpanan_berjangka_category_id: form.simpanan_berjangka_category_id!,
            anggota_id: form.anggota_id!,
            date: form.date!,
            nominal: form.nominal!,
            term_months: form.term_months!,
            no_bilyet: form.no_bilyet!.trim(),
            no_ao: form.no_ao!.trim(),
            type,
            description: form.description || undefined,
            payment_method: form.payment_method as SimpananBerjangkaStoreWithCategoryRequest["payment_method"],
            payment_channel: form.payment_channel as SimpananBerjangkaStoreWithCategoryRequest["payment_channel"],
            image: isFile(form.image) ? form.image : undefined,
          };
          await createMutation(payload).unwrap();
        }
        Swal.fire("Berhasil", "Data berhasil dibuat", "success");
      }
      onSuccess?.();
    } catch (error) {
      console.error("Submission Error:", error);
      Swal.fire("Gagal", "Terjadi kesalahan saat menyimpan", "error");
    }
  }

  const getAnggotaLabel = (a: Anggota) =>
    `${a.name ?? a.full_name ?? a.user_name ?? `Anggota ${a.id}`}${a.email ? ` — ${a.email}` : ""}`;

  const firstInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    firstInputRef.current?.focus();
  }, [id]);

  const isLoadingData = id && byIdQuery.isLoading;

  if (isLoadingData) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Memuat data simpanan berjangka...
      </div>
    );
  }

  const isEdit = !!id;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mode: Master Bilyet vs Kategori (hanya saat tambah) */}
        {!isEdit && (
          <div className="md:col-span-2">
            <Label>Sumber Produk</Label>
            <div className="flex items-center gap-6 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="storeMode"
                  checked={storeMode === "master"}
                  onChange={() => setStoreMode("master")}
                />
                <span className="select-none">Master Bilyet Berjangka</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="storeMode"
                  checked={storeMode === "category"}
                  onChange={() => setStoreMode("category")}
                />
                <span className="select-none">Kategori (legacy)</span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {storeMode === "master"
                ? "Tenor, rate, dan no. bilyet diisi otomatis dari master."
                : "Isi manual term, no. bilyet, dan no. AO."}
            </p>
          </div>
        )}

        {/* Produk: Master Bilyet (saat mode master dan tambah) */}
        {!isEdit && storeMode === "master" && (
          <div className="md:col-span-2">
            <Label htmlFor="master-bilyet-select">Produk (Master Bilyet)</Label>
            <div className="mt-1">
              <Combobox<MasterBilyetOption>
                value={form.master_bilyet_berjangka_id ?? null}
                onChange={(v) => setField("master_bilyet_berjangka_id", v ?? undefined)}
                onSearchChange={undefined}
                data={masterBilyetOptions}
                isLoading={masterBilyetQuery.isLoading}
                placeholder="Pilih produk bilyet..."
                getOptionLabel={(m) => m.name}
              />
            </div>
          </div>
        )}

        {/* Produk: tampilan readonly saat edit */}
        {isEdit && byIdQuery.data && (
          <div className="md:col-span-2">
            <Label>Produk</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              {(byIdQuery.data as SimpananBerjangka).category_name ??
                (byIdQuery.data as SimpananBerjangka).masterBilyet?.nama_produk ??
                (byIdQuery.data as SimpananBerjangka).kode_bilyet_master ??
                "—"}
            </p>
          </div>
        )}

        {/* Produk: Kategori (hanya mode category saat tambah) */}
        {!isEdit && storeMode === "category" && (
          <div className="md:col-span-2">
            <Label htmlFor="category-select">Produk (Kategori)</Label>
            <div className="mt-1">
              <Combobox<Category>
                value={form.simpanan_berjangka_category_id ?? null}
                onChange={(v) => setField("simpanan_berjangka_category_id", v ?? undefined)}
                onSearchChange={undefined}
                data={kategoriOptions}
                isLoading={kategoriQuery.isLoading}
                placeholder="Pilih kategori..."
                getOptionLabel={(c) => c.name}
              />
            </div>
          </div>
        )}

        {/* No. Bilyet & No. AO (hanya mode category saat tambah) */}
        {!isEdit && storeMode === "category" && (
          <>
            <div>
              <Label htmlFor="no-bilyet-input">No. Bilyet</Label>
              <Input
                id="no-bilyet-input"
                value={form.no_bilyet}
                onChange={(e) => setField("no_bilyet", e.target.value)}
                className="mt-1"
                placeholder="Contoh: BB-001"
              />
            </div>
            <div>
              <Label htmlFor="no-ao-input">No. AO</Label>
              <Input
                id="no-ao-input"
                value={form.no_ao}
                onChange={(e) => setField("no_ao", e.target.value)}
                className="mt-1"
                placeholder="Contoh: AO-001"
              />
            </div>
          </>
        )}

        {/* Anggota */}
        <div>
          <Label htmlFor="anggota-select">Anggota</Label>
          <div className="mt-1">
            <Combobox<Anggota>
              value={form.anggota_id ?? null}
              onChange={(v) => setField("anggota_id", v ?? undefined)}
              onSearchChange={handleSearchChange}
              data={anggotaOptions}
              isLoading={searchQuery.length >= minSearchLength && anggotaQuery.isLoading}
              placeholder="Cari anggota..."
              getOptionLabel={getAnggotaLabel}
            />
          </div>
          {searchQuery.length > 0 && searchQuery.length < minSearchLength && (
            <p className="text-xs text-red-500 mt-1">
              * Minimal {minSearchLength} huruf untuk mencari.
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
            disabled={isEdit}
          />
        </div>

        {/* Nominal */}
        <div>
          <Label htmlFor="nominal-input">Nominal</Label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              Rp
            </span>
            <Input
              id="nominal-input"
              type="text"
              value={formatNumber(form.nominal)}
              onChange={handleNominalChange}
              className="pl-9"
              placeholder="0"
              disabled={isEdit}
            />
          </div>
        </div>

        {/* Term (mode category saat tambah, atau saat edit untuk update) */}
        {(storeMode === "category" || isEdit) && (
          <div>
            <Label htmlFor="term-input">Term (bulan)</Label>
            <Input
              id="term-input"
              type="number"
              value={form.term_months !== undefined ? String(form.term_months) : ""}
              onChange={(e) =>
                setField("term_months", e.target.value ? Number(e.target.value) : undefined)
              }
              className="mt-1"
              min={1}
              disabled={isEdit && !form.simpanan_berjangka_category_id}
            />
          </div>
        )}

        {/* Status Bilyet (hanya edit) */}
        {isEdit && (
          <div>
            <Label htmlFor="status-bilyet-select">Status Bilyet</Label>
            <select
              id="status-bilyet-select"
              value={form.status_bilyet ?? ""}
              onChange={(e) =>
                setField(
                  "status_bilyet",
                  e.target.value ? (e.target.value as SimpananBerjangka["status_bilyet"]) : undefined
                )
              }
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">— Pilih —</option>
              <option value="aktif">Aktif</option>
              <option value="cair">Cair</option>
              <option value="cair_awal">Cair Awal</option>
            </select>
          </div>
        )}

        {/* Deskripsi */}
        <div>
          <Label htmlFor="description-input">Deskripsi</Label>
          <Input
            id="description-input"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Type (saat tambah) */}
        {!isEdit && (
          <div className="md:col-span-2">
            <Label>Tipe Pembayaran</Label>
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
        )}

        {!isEdit && form.type === "automatic" && (
          <>
            <div>
              <Label htmlFor="pm-select">Payment Method</Label>
              <select
                id="pm-select"
                value={form.payment_method ?? ""}
                onChange={(e) => setField("payment_method", e.target.value || undefined)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Pilih metode</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="qris">QRIS</option>
              </select>
            </div>
            <div>
              <Label htmlFor="pc-select">Payment Channel</Label>
              <select
                id="pc-select"
                value={form.payment_channel ?? ""}
                onChange={(e) => setField("payment_channel", e.target.value || undefined)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Pilih channel</option>
                <option value="bca">BCA</option>
                <option value="bni">BNI</option>
                <option value="bri">BRI</option>
                <option value="cimb">CIMB</option>
                <option value="qris">QRIS</option>
              </select>
            </div>
          </>
        )}

        {/* Image */}
        <div className="md:col-span-2">
          <Label htmlFor="image-upload">
            Bukti / Image {form.type === "manual" && !isEdit ? "(wajib, max 5MB)" : "(opsional)"}
          </Label>
          <div className="mt-1 flex flex-col gap-2">
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={(e) => setField("image", e.target.files?.[0] ?? null)}
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
                  className="max-h-40 object-contain rounded border"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => onCancel?.()}>
          Batal
        </Button>
        <Button type="submit" disabled={creating || updating}>
          {id ? (updating ? "Menyimpan..." : "Simpan Perubahan") : creating ? "Membuat..." : "Buat"}
        </Button>
      </div>
    </form>
  );
}
