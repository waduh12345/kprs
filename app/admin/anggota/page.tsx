"use client";

import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useGetAnggotaListQuery,
  useDeleteAnggotaMutation,
  useImportAnggotaExcelMutation,
  useLazyGetTemplateCsvQuery,
  useUpdateAnggotaStatusBulkMutation,
} from "@/services/koperasi-service/anggota.service";
import type { AnggotaKoperasi, AnggotaStatus } from "@/types/koperasi-types/anggota";
import { Badge } from "@/components/ui/badge";
import { ProdukToolbar } from "@/components/ui/produk-toolbar";
import { useRouter } from "next/navigation";
import ActionsGroup from "@/components/admin-components/actions-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HistoryIcon, LandmarkIcon, Download, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const PER_PAGE_OPTIONS = [10, 50, 100, "all"] as const;
type PerPageValue = (typeof PER_PAGE_OPTIONS)[number];
const PAGINATE_ALL = 99999;

function getPaginateValue(perPage: PerPageValue): number {
  return perPage === "all" ? PAGINATE_ALL : perPage;
}

export default function AnggotaPage() {
  const router = useRouter();

  const [perPage, setPerPage] = useState<PerPageValue>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");

  // State untuk filter status
  const [status, setStatus] = useState<"all" | "0" | "1" | "2">("all");

  // State baru untuk filter tipe (Frontend Logic)
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Checklist untuk ubah status massal
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatusModalOpen, setBulkStatusModalOpen] = useState(false);
  const [bulkStatusValue, setBulkStatusValue] = useState<string>("1");

  const { data, isLoading, refetch } = useGetAnggotaListQuery(
    {
      page: currentPage,
      paginate: getPaginateValue(perPage),
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const list = useMemo(() => data?.data ?? [], [data]);

  // === LOGIC FILTER FRONTEND DISINI ===
  const filteredList = useMemo(() => {
    let arr = list;

    // 1. Filter by Status
    if (status !== "all") {
      arr = arr.filter((it) => it.status === Number(status));
    }

    // 2. Filter by Type (Logic Baru)
    if (typeFilter !== "all") {
      arr = arr.filter(
        (it) => it.type?.toLowerCase() === typeFilter.toLowerCase()
      );
    }

    // 3. Filter by Search Query
    if (!query.trim()) return arr;
    const q = query.toLowerCase();
    return arr.filter((it) =>
      [it.name, it.email, it.phone, it.address, it.nik, it.npwp ?? ""].some(
        (f) => f?.toLowerCase?.().includes?.(q)
      )
    );
  }, [list, query, status, typeFilter]);

  const lastPage = useMemo(() => data?.last_page ?? 1, [data]);
  const total = data?.total ?? 0;

  const handlePerPageChange = (value: string) => {
    const next =
      value === "all" ? "all" : (Number(value) as 10 | 50 | 100);
    setPerPage(next);
    setCurrentPage(1);
  };

  const goToPrevPage = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
  };
  const goToNextPage = () => {
    setCurrentPage((p) => Math.min(lastPage, p + 1));
  };

  const [deleteAnggota] = useDeleteAnggotaMutation();

  // export: client-side dari data tabel; import: API
  const [isExporting, setIsExporting] = useState(false);
  const [importAnggotaExcel, { isLoading: isImporting }] =
    useImportAnggotaExcelMutation();
  const [getTemplateCsv, { isLoading: isTemplateLoading }] =
    useLazyGetTemplateCsvQuery();
  const [updateAnggotaStatusBulk, { isLoading: isBulkStatusLoading }] =
    useUpdateAnggotaStatusBulkMutation();

  const handleDownloadTemplate = async () => {
    try {
      const blob = await getTemplateCsv().unwrap();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template_anggota.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      await Swal.fire("Gagal", "Gagal mengunduh template CSV", "error");
    }
  };

  const handleDelete = async (item: AnggotaKoperasi) => {
    const confirm = await Swal.fire({
      title: "Yakin hapus Anggota?",
      text: `${item.name} (${item.email})`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
    });
    if (confirm.isConfirmed) {
      try {
        await deleteAnggota(item.id).unwrap();
        await refetch();
        Swal.fire("Berhasil", "Anggota dihapus", "success");
      } catch (error) {
        Swal.fire("Gagal", "Gagal menghapus Anggota", "error");
        console.error(error);
      }
    }
  };

  // === Import handler ===
  const handleImportExcel = async (file?: File) => {
    try {
      if (!file) return Swal.fire("Gagal", "File tidak ditemukan", "error");
      const res = await importAnggotaExcel({ file }).unwrap();
      await refetch();
      await Swal.fire(
        "Import Berhasil",
        res.message ?? "Berhasil mengunggah file. Data tabel telah diperbarui.",
        "success"
      );
    } catch (e) {
      Swal.fire("Gagal", "Import gagal diproses", "error");
      console.error(e);
    }
  };

  /** Export data yang tampil di tabel ke Excel (tanpa hit API) */
  const handleExportExcel = () => {
    if (filteredList.length === 0) {
      void Swal.fire("Info", "Tidak ada data untuk diexport.", "info");
      return;
    }
    const statusLabel = (s: number) => {
      if (s === 1) return "APPROVED";
      if (s === 2) return "REJECTED";
      return "PENDING";
    };
    const rows = filteredList.map((item) => ({
      "Nomor Anggota": item.reference ?? "",
      Nama: item.user_name ?? "",
      Email: item.user_email ?? "",
      Telepon: item.user_phone ?? "",
      Tipe: item.type ?? "",
      Status: statusLabel(item.status),
    }));
    setIsExporting(true);
    try {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Anggota");
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `export-anggota-${dateStr}.xlsx`);
      void Swal.fire("Berhasil", `Berhasil export ${rows.length} anggota ke Excel.`, "success");
    } catch (e) {
      console.error(e);
      void Swal.fire("Gagal", "Export gagal diproses.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const statusBadge = (status: number) => {
    if (status === 1) return <Badge variant="success">APPROVED</Badge>;
    if (status === 2) return <Badge variant="destructive">REJECTED</Badge>;
    return <Badge variant="secondary">PENDING</Badge>;
  };

  // --- Checklist & ubah status massal ---
  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredList.map((item) => item.id)));
    }
  };

  const openBulkStatusModal = () => {
    if (selectedIds.size === 0) return;
    setBulkStatusModalOpen(true);
  };

  const handleBulkStatusSubmit = async () => {
    if (selectedIds.size === 0) return;
    try {
      await updateAnggotaStatusBulk({
        ids: Array.from(selectedIds),
        status: Number(bulkStatusValue) as AnggotaStatus,
      }).unwrap();
      await refetch();
      setSelectedIds(new Set());
      setBulkStatusModalOpen(false);
      await Swal.fire("Berhasil", "Status anggota berhasil diubah.", "success");
    } catch (e) {
      console.error(e);
      await Swal.fire("Gagal", "Gagal mengubah status anggota.", "error");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Modal blocking saat import sedang diproses */}
      {isImporting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[280px]">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-gray-700 font-medium text-center">
              Sedang mengunggah file...
            </p>
            <p className="text-sm text-gray-500 text-center">
              Harap tunggu, jangan tutup halaman.
            </p>
          </div>
        </div>
      )}

      <ProdukToolbar
        showTemplateCsvButton
        onDownloadTemplateCsv={handleDownloadTemplate}
        templateCsvLoading={isTemplateLoading}
        openModal={() => router.push("/admin/anggota/add-data?mode=add")}
        onSearchChange={(q: string) => setQuery(q)}
        // --- Status Filter ---
        enableStatusFilter
        statusOptions={[
          { value: "all", label: "Semua Status" },
          { value: "0", label: "PENDING" },
          { value: "1", label: "APPROVED" },
          { value: "2", label: "REJECTED" },
        ]}
        initialStatus={status}
        onStatusChange={(s: string) => setStatus(s as "all" | "0" | "1" | "2")}
        // --- Type Filter (Extra Select) ---
        extraSelects={[
          {
            id: "filter_type",
            label: "Tipe Anggota",
            value: typeFilter,
            options: [
              { value: "all", label: "Semua Tipe" },
              { value: "individu", label: "Individu" },
              { value: "perusahaan", label: "Perusahaan" },
            ],
            onChange: (val) => setTypeFilter(val),
          },
        ]}
        // --- Konfigurasi Import ---
        enableImport={true}
        onImportExcel={(file) => {
          if (!isImporting) void handleImportExcel(file);
        }}
        importLabel={isImporting ? "Mengunggah..." : "Import Excel"}
        // --- Konfigurasi Export ---
        enableExport={true}
        onExportExcel={() => {
          if (!isExporting) void handleExportExcel();
        }}
        exportLabel={isExporting ? "Memproses..." : "Export Excel"}
        exportIcon={<Download className="mr-2 size-4" />}
      />

      {/* Bar ubah status massal */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/50 px-4 py-3">
          <span className="text-sm font-medium text-gray-700">
            <strong>{selectedIds.size}</strong> anggota dipilih
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Batal pilih
            </Button>
            <Button size="sm" onClick={openBulkStatusModal}>
              Ubah status masal
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="w-10 px-2 py-2">
                  <Checkbox
                    checked={
                      filteredList.length > 0 &&
                      selectedIds.size === filteredList.length
                    }
                    onCheckedChange={toggleSelectAll}
                    aria-label="Pilih semua"
                  />
                </th>
                <th className="px-4 py-2">Aksi</th>
                <th className="px-4 py-2">Nomor Anggota</th>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Telepon</th>
                <th className="px-4 py-2">Tipe</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center p-4">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-4">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="w-10 px-2 py-2 align-middle">
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => toggleSelectOne(item.id)}
                        aria-label={`Pilih ${item.user_name ?? item.reference}`}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <ActionsGroup
                        handleDetail={() =>
                          router.push(
                            `/admin/anggota/add-data?mode=detail&id=${item.id}`
                          )
                        }
                        handleEdit={() =>
                          router.push(
                            `/admin/anggota/add-data?mode=edit&id=${item.id}`
                          )
                        }
                        handleDelete={() => handleDelete(item)}
                        additionalActions={
                          <div className="flex items-center gap-2">
                            {/* History Anggota */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    router.push(
                                      `/admin/history?anggota_id=${item.id}`
                                    )
                                  }
                                >
                                  <HistoryIcon className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>History Anggota</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    router.push(
                                      `/admin/anggota/user-bank?user_id=${
                                        item.user_id ?? item.id
                                      }`
                                    )
                                  }
                                >
                                  <LandmarkIcon className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>User Bank</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        }
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {item.reference}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {item.user_name}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {item.user_email}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {item.user_phone}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{item.type}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {statusBadge(item.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>

        <div className="p-4 flex flex-wrap items-center justify-between gap-3 bg-muted">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Tampilkan per halaman:
            </span>
            <Select
              value={perPage === "all" ? "all" : String(perPage)}
              onValueChange={handlePerPageChange}
            >
              <SelectTrigger className="w-[100px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="all">Semua</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              Halaman <strong>{currentPage}</strong> dari{" "}
              <strong>{lastPage}</strong>
              {total > 0 && (
                <> · Total <strong>{total}</strong> anggota</>
              )}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={goToPrevPage}
            >
              Sebelumnya
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= lastPage || lastPage <= 0}
              onClick={goToNextPage}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal ubah status massal */}
      <Dialog open={bulkStatusModalOpen} onOpenChange={setBulkStatusModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah status massal</DialogTitle>
            <DialogDescription>
              Pilih status baru untuk <strong>{selectedIds.size}</strong> anggota yang dipilih.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status baru</label>
              <Select
                value={bulkStatusValue}
                onValueChange={setBulkStatusValue}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">PENDING</SelectItem>
                  <SelectItem value="1">APPROVED</SelectItem>
                  <SelectItem value="2">REJECTED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkStatusModalOpen(false)}
              disabled={isBulkStatusLoading}
            >
              Batal
            </Button>
            <Button
              onClick={() => void handleBulkStatusSubmit()}
              disabled={isBulkStatusLoading}
            >
              {isBulkStatusLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Simpan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}