"use client";

import { useMemo, useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useModal from "@/hooks/use-modal";
import {
  useGetWalletListQuery,
  useCreateSimpananWalletMutation,
  useUpdateWalletMutation,
  useDeleteWalletMutation,
} from "@/services/admin/penarikan-simpanan.service";
import {
  useLazyGetSimpananMigrasiTemplateQuery,
  useImportSimpananMigrasiExcelMutation,
} from "@/services/admin/simpanan/import-excel.service";
import type { SimpananMigrasiImportResponse } from "@/types/admin/simpanan/import-export";
import { InputSimpanan } from "@/types/admin/simpanan/input-simpanan";
import FormSimpanan from "@/components/form-modal/simpanan-form";
import { useGetSimpananCategoryListQuery } from "@/services/master/simpanan-category.service";
import { useGetUsersListQuery } from "@/services/koperasi-service/users-management.service";
import { Combobox } from "@/components/ui/combo-box";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";
import { Filter, Plus, Download, Upload, Loader2 } from "lucide-react";
import { formatRupiahWithRp } from "@/lib/format-utils";

/** Payload type to send to /wallet (create) */
type CreateSimpananPayload = {
  user_id: number;
  reference_type: string;
  reference_id: number;
};

type AnggotaItem = { id: number; name?: string; email?: string };

// ... (helper functions extractMessageFromFetchBaseQueryError, dsb tetap sama)

// --- Helper untuk message error tetap sama ---
function extractMessageFromFetchBaseQueryError(
  fbq: FetchBaseQueryError
): string {
  if (typeof fbq.data === "string") return fbq.data;
  if (typeof fbq.data === "object" && fbq.data !== null) {
    const d = fbq.data as Record<string, unknown>;
    if ("message" in d && typeof d.message === "string") return d.message;
    // ... logic error lainnya
  }
  return "Terjadi kesalahan";
}

export default function SimpananAnggotaPage() {
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // wallet list (Data Utama Tabel)
  const { data, isLoading, isFetching, refetch } = useGetWalletListQuery({
    page: currentPage,
    paginate: itemsPerPage,
  });

  // Refetch data simpanan setiap kali currentPage berubah
  useEffect(() => {
    refetch();
  }, [currentPage, refetch]);

  // categories for reference_id selection
  const categoriesQuery = useGetSimpananCategoryListQuery({
    page: 1,
    paginate: 100,
    orderBy: "code",
    order: "asc",
  });
  const categories = categoriesQuery.data?.data ?? [];

  // =====================================================================
  // LOGIKA PENCARIAN ANGGOTA (SERVER SIDE SEARCH)
  // =====================================================================
  
  // 1. State untuk input pencarian user
  const [userSearchInput, setUserSearchInput] = useState(""); 
  // 2. State untuk nilai yang sudah di-debounce (dikirim ke API)
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");

  // 3. Effect Debounce: Update debouncedUserSearch hanya jika user berhenti mengetik 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserSearch(userSearchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [userSearchInput]);

  // 4. Tentukan kondisi kapan harus fetch (minimal 2 karakter)
  const shouldFetchUsers = debouncedUserSearch.length >= 2;

  // 5. Query Users dengan kondisi skip
  const {
    data: usersResp,
    isLoading: usersLoading,
    isFetching: usersFetching,
  } = useGetUsersListQuery(
    {
      page: 1,
      paginate: 20, // Ambil secukupnya saja untuk dropdown
      search: debouncedUserSearch, // Kirim parameter search ke backend
      search_by: "name", // Asumsi backend menerima parameter ini
    },
    {
      // Fitur RTK Query: Skip query jika kondisi false
      skip: !shouldFetchUsers, 
    }
  );

  // Data anggota yang akan masuk ke Combobox
  const anggotaList: AnggotaItem[] = usersResp?.data?.data ?? [];

  // =====================================================================

  const simpananList: InputSimpanan[] = useMemo(
    () => (data?.data ?? []) as InputSimpanan[],
    [data]
  );
  const lastPage = data?.last_page ?? 1;

  // modal form state
  const { isOpen, openModal, closeModal } = useModal();
  const [form, setForm] = useState<Partial<InputSimpanan>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [readonly, setReadonly] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // filters: search (lokal tabel) + anggota filter (by user_id)
  const [q, setQ] = useState("");
  const [filterAnggotaId, setFilterAnggotaId] = useState<number | null>(null);

  // mutations
  const [createSimpanan, { isLoading: creating }] = useCreateSimpananWalletMutation();
  const [updateSimpanan, { isLoading: updating }] = useUpdateWalletMutation();
  const [deleteSimpanan] = useDeleteWalletMutation();

  // migrasi: template + import
  const [getMigrasiTemplate, { isLoading: isTemplateLoading }] =
    useLazyGetSimpananMigrasiTemplateQuery();
  const [importMigrasiExcel, { isLoading: isImportingMigrasi }] =
    useImportSimpananMigrasiExcelMutation();
  const [fileMigrasi, setFileMigrasi] = useState<File | null>(null);

  /** Unduh template migrasi (.xlsx) dari service GET /simpanan/import/migrasi/template */
  const handleDownloadMigrasiTemplate = async () => {
    try {
      const result = await getMigrasiTemplate();
      if (result.error || !result.data) {
        const msg =
          result.error && "message" in result.error
            ? String(result.error.message)
            : "Gagal mengambil template";
        throw new Error(msg);
      }
      const url = URL.createObjectURL(result.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "template-migrasi-simpanan.xlsx";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 200);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Tidak dapat mengunduh template migrasi.";
      void Swal.fire({ icon: "error", title: "Gagal", text: message });
    }
  };

  /** Import file migrasi – POST /simpanan/import/migrasi */
  const handleImportMigrasi = async () => {
    if (isImportingMigrasi || !fileMigrasi) return;
    const file = fileMigrasi;
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      void Swal.fire(
        "Gagal",
        "Format file harus Excel (.xlsx, .xls) atau CSV.",
        "error"
      );
      return;
    }
    const { isConfirmed } = await Swal.fire({
      title: "Konfirmasi Import Migrasi",
      html: `Anda akan mengunggah file: <strong>${file.name}</strong>. Data rekening dan saldo akan diproses sesuai isi file. Lanjutkan?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Unggah & Proses",
    });
    if (!isConfirmed) return;
    try {
      const response = await importMigrasiExcel({ file }).unwrap();
      await refetch();
      const data = response.data as SimpananMigrasiImportResponse | undefined;
      const detail =
        data != null
          ? `Referensi: ${data.reference ?? "-"}. Berhasil: ${data.processed ?? 0}, Gagal: ${data.failed ?? 0}.`
          : "";
      void Swal.fire({
        icon: "success",
        title: "Import Berhasil",
        text: response.message ? `${response.message}${detail ? ` ${detail}` : ""}` : `File diproses. ${detail}`,
      });
      setFileMigrasi(null);
      const input = document.getElementById("file_migrasi") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (err: unknown) {
      console.error(err);
      if (isFetchBaseQueryError(err)) {
        const messageToShow = extractMessageFromFetchBaseQueryError(err);
        void Swal.fire("Gagal", messageToShow, "error");
      } else {
        void Swal.fire("Gagal", String(err), "error");
      }
    }
  };

  // --- Handlers (Create, Edit, Detail, Delete, Submit) ---
  // open modal to create
  const handleOpenCreate = () => {
    setForm({});
    setEditingId(null);
    setReadonly(false);
    openModal();
  };

  const handleEdit = (id: number) => {
    const item = simpananList.find((s) => s.id === id);
    if (!item) return;
    setForm({ ...item });
    setEditingId(id);
    setReadonly(false);
    openModal();
  };

  const handleDetail = (id: number) => {
    const item = simpananList.find((s) => s.id === id);
    if (!item) return;
    setForm({ ...item });
    setReadonly(true);
    setEditingId(id);
    openModal();
  };

  const handleDelete = async (id: number) => {
    const confirm = await Swal.fire({
      title: "Yakin hapus simpanan?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
    });
    if (!confirm.isConfirmed) return;
    try {
      await deleteSimpanan(id).unwrap();
      await refetch();
      void Swal.fire("Berhasil", "Simpanan dihapus", "success");
    } catch (err: unknown) {
      console.error(err);
      if (isFetchBaseQueryError(err)) {
        const fbq = err;
        const messageToShow = extractMessageFromFetchBaseQueryError(fbq);
        void Swal.fire("Gagal", messageToShow, "error");
      } else if (isSerializedError(err)) {
        void Swal.fire(
          "Gagal",
          (err as SerializedError).message ?? "Error",
          "error"
        );
      } else {
        void Swal.fire("Gagal", String(err), "error");
      }
    }
  };

  // helper type guards for RTK Query errors
  function isFetchBaseQueryError(err: unknown): err is FetchBaseQueryError {
    return typeof err === "object" && err !== null && "status" in err;
  }
  function isSerializedError(err: unknown): err is SerializedError {
    return typeof err === "object" && err !== null && "message" in err;
  }
  
  const handleSubmit = async () => {
    try {
      // validate create: user_id + reference_id required
      if (!editingId) {
        if (!form.user_id) {
          void Swal.fire("Error", "Pilih anggota terlebih dahulu", "error");
          return;
        }
        if (!form.reference_id) {
          void Swal.fire(
            "Error",
            "Pilih kategori (reference) terlebih dahulu",
            "error"
          );
          return;
        }

        const payload: CreateSimpananPayload = {
          user_id: Number(form.user_id),
          reference_type: "App\\Models\\Master\\SimpananCategory",
          reference_id: Number(form.reference_id),
        };

        // PRE-CHECK (client-side) : apakah wallet sudah ada untuk user+reference?
        const alreadyExists = simpananList.some(
          (w) =>
            Number(w.user_id) === payload.user_id &&
            String(w.reference_type) === payload.reference_type &&
            Number(w.reference_id) === payload.reference_id
        );
        if (alreadyExists) {
          void Swal.fire(
            "Gagal",
            "Wallet sudah ada untuk anggota dan kategori yang dipilih.",
            "error"
          );
          return;
        }

        // send create
        await createSimpanan(payload).unwrap();
        void Swal.fire("Sukses", "Simpanan berhasil dibuat", "success");
      } else {
        // Update fields allowed: name, account_number, description
        const updatePayload: Partial<InputSimpanan> = {};
        if (typeof form.name !== "undefined") updatePayload.name = form.name;
        if (typeof form.description !== "undefined")
          updatePayload.description = form.description;
        if (typeof form.account_number !== "undefined")
          updatePayload.account_number = form.account_number;

        await updateSimpanan({
          id: editingId,
          payload: updatePayload,
        }).unwrap();
        void Swal.fire("Sukses", "Simpanan berhasil diperbarui", "success");
      }

      setForm({});
      setEditingId(null);
      closeModal();
      await refetch();
    } catch (err: unknown) {
      console.error(err);
      if (isFetchBaseQueryError(err)) {
        const fbq = err;
        const messageToShow = extractMessageFromFetchBaseQueryError(fbq);
        void Swal.fire("Gagal", messageToShow, "error");
      } else if (isSerializedError(err)) {
        void Swal.fire(
          "Gagal",
          (err as SerializedError).message ?? "Error",
          "error"
        );
      } else {
        void Swal.fire("Gagal", String(err), "error");
      }
    }
  };

  const formatCurrency = (amount: number) =>
    amount == null ? "-" : formatRupiahWithRp(amount);

  // client-side filters untuk Tabel
  const simpanansFiltered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return simpananList.filter((item) => {
      if (filterAnggotaId && item.user_id !== filterAnggotaId) return false;
      if (!qq) return true;
      const name = item.user?.name?.toLowerCase() ?? "";
      const email = item.user?.email?.toLowerCase() ?? "";
      return name.includes(qq) || email.includes(qq);
    });
  }, [simpananList, q, filterAnggotaId]);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="w-full md:w-1/2">
              <input
                type="text"
                placeholder="Cari data..."
                className="h-10 w-full rounded-md border border-gray-300 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="flex gap-2 items-center w-full md:w-auto">
              {/* --- COMBOBOX FILTER ANGGOTA --- */}
              <div className="w-full md:w-[260px]">
                <Combobox<AnggotaItem>
                  value={filterAnggotaId}
                  onChange={(v) => setFilterAnggotaId(v)}
                  // Hubungkan event ketik dengan state search
                  onSearchChange={(text) => setUserSearchInput(text)}
                  // Data diambil dari hasil query dinamis
                  data={anggotaList}
                  // Loading tampil jika sedang fetching user
                  isLoading={usersFetching} 
                  // Pesan placeholder / empty state
                  placeholder="Ketik min. 2 huruf..."
                  getOptionLabel={(item: AnggotaItem) =>
                    `${item.name ?? "User"} (${item.email ?? "-"})`
                  }
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleOpenCreate} className="h-10">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah
                </Button>
                <Button
                  variant="destructive"
                  className="h-10"
                  onClick={() => {
                    setQ("");
                    setFilterAnggotaId(null);
                    setUserSearchInput(""); // Reset search input
                    setCurrentPage(1);
                    void refetch();
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Migrasi Data: Download Template + Import */}
      <Card className="border-t-4 border-amber-500">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-amber-700 mb-1">
            Migrasi Data Simpanan
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Gunakan template untuk migrasi rekening dan saldo simpanan per anggota. Isi file sesuai kolom template lalu unggah di sini.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-2">
              <Label htmlFor="file_migrasi">File migrasi (.xlsx / .csv)</Label>
              <Input
                id="file_migrasi"
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={(e) => setFileMigrasi(e.target.files?.[0] ?? null)}
                disabled={isImportingMigrasi}
                className="max-w-md"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadMigrasiTemplate}
                disabled={isTemplateLoading}
                className="shrink-0"
              >
                {isTemplateLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isTemplateLoading ? "Memuat..." : "Unduh Template Migrasi"}
              </Button>
              <Button
                onClick={handleImportMigrasi}
                disabled={isImportingMigrasi || !fileMigrasi}
                className="shrink-0 bg-amber-600 hover:bg-amber-700"
              >
                {isImportingMigrasi ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isImportingMigrasi ? "Memproses..." : "Unggah & Proses"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABEL dan PAGINATION */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-2">Aksi</th>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">No Rekening</th>
                <th className="px-4 py-2">Anggota</th>
                <th className="px-4 py-2">Balance</th>
              </tr>
            </thead>
            <tbody>
              {isLoading || isFetching ? (
                <tr><td colSpan={5} className="text-center p-4">Memuat data...</td></tr>
              ) : simpanansFiltered.length === 0 ? (
                <tr><td colSpan={5} className="text-center p-4">Tidak ada data</td></tr>
              ) : (
                simpanansFiltered.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                         <Button size="sm" variant="outline" onClick={() => handleDetail(item.id)}>Detail</Button>
                         <Button size="sm" onClick={() => handleEdit(item.id)}>
                          Edit
                        </Button>
                         <Button size="sm" variant="destructive" className="text-white" onClick={() => handleDelete(item.id)}>Hapus</Button>
                      </div>
                    </td>
                    <td className="px-4 py-2">{item.name}</td>
                    <td className="px-4 py-2">{item.account_number}</td>
                    <td className="px-4 py-2">{item.user?.name}</td>
                    <td className="px-4 py-2">{formatCurrency(item.balance ?? 0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
         {/* Pagination footer... */}
         <div className="p-4 flex items-center justify-between bg-muted">
          <div className="text-sm">
            Halaman <strong>{currentPage}</strong> dari{" "}
            <strong>{lastPage}</strong>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              disabled={currentPage >= lastPage}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <FormSimpanan
            form={form}
            setForm={setForm}
            onCancel={() => {
              closeModal();
              setUserSearchInput("");
            }}
            onSubmit={handleSubmit}
            readonly={readonly}
            isLoading={creating || updating}
            categories={categories}
            showAllCategories={showAllCategories}
            setShowAllCategories={setShowAllCategories}
            
            anggota={anggotaList} 
            anggotaLoading={usersLoading || usersFetching}
            onSearchAnggota={(text) => setUserSearchInput(text)}
          />
        </div>
      )}
    </div>
  );
}