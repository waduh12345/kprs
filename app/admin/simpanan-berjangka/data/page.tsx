"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import ActionsGroup from "@/components/admin-components/actions-group";
import {
  useGetSimpananBerjangkaListQuery,
  useDeleteSimpananBerjangkaMutation,
  useValidateSimpananBerjangkaMutation,
  useLazyGetSimpananBerjangkaImportTemplateQuery,
  useImportSimpananBerjangkaMigrasiMutation,
} from "@/services/admin/simpanan/simpanan-berjangka.service";
import type {
  SimpananBerjangka,
  ValidationStatus,
} from "@/types/admin/simpanan/simpanan-berjangka";
import SimpananBerjangkaForm from "@/components/form-modal/simpanan-berjangka-form";
import { Plus, FileDown, FileUp, Clock, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

const displayDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("id-ID") : "-";

const STATUS_LABELS: Record<ValidationStatus, string> = {
  0: "Pending",
  1: "Disetujui",
  2: "Ditolak",
  3: "Tidak Aktif",
};

const statusVariant = (
  status: ValidationStatus
): "success" | "destructive" | "secondary" | "default" => {
  if (status === 1) return "success";
  if (status === 2) return "destructive";
  if (status === 3) return "default";
  return "secondary";
};

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "0", label: "Pending" },
  { value: "1", label: "Disetujui" },
  { value: "2", label: "Ditolak" },
  { value: "3", label: "Tidak Aktif" },
];

export default function SimpananBerjangkaDataPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const listParams = useMemo(
    () => ({
      page: currentPage,
      paginate: itemsPerPage,
      ...(query.trim() && { search: query.trim() }),
      ...(statusFilter !== "all" && {
        status: Number(statusFilter) as ValidationStatus,
      }),
    }),
    [currentPage, itemsPerPage, query, statusFilter]
  );

  const { data, isLoading, refetch } = useGetSimpananBerjangkaListQuery(
    listParams
  );

  const list = useMemo(() => data?.data ?? [], [data]);
  const lastPage = useMemo(() => data?.last_page ?? 1, [data]);

  const [deleteSimpananBerjangka] = useDeleteSimpananBerjangkaMutation();
  const [validateSimpananBerjangka, { isLoading: isValidating }] =
    useValidateSimpananBerjangkaMutation();
  const [getTemplate, { isLoading: isTemplateLoading }] =
    useLazyGetSimpananBerjangkaImportTemplateQuery();
  const [importMigrasi, { isLoading: isImporting }] =
    useImportSimpananBerjangkaMigrasiMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    try {
      const blob = await getTemplate().unwrap();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template_simpanan_berjangka.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      Swal.fire("Berhasil", "Template berhasil diunduh", "success");
    } catch (error) {
      console.error(error);
      Swal.fire("Gagal", "Gagal mengunduh template", "error");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const result = await importMigrasi(file).unwrap();
      await refetch();
      const hasErrors =
        result.failed > 0 && result.errors && Object.keys(result.errors).length > 0;
      Swal.fire({
        title:
          result.failed > 0 ? "Import Selesai dengan Catatan" : "Import Berhasil",
        html: `
          <p>${result.message}</p>
          <p><strong>Berhasil:</strong> ${result.processed}</p>
          <p><strong>Gagal:</strong> ${result.failed}</p>
          ${
            hasErrors
              ? `<pre class="text-left text-xs mt-2 max-h-32 overflow-auto bg-gray-100 p-2 rounded">${Object.entries(result.errors)
                  .map(([row, msg]) => `Baris ${row}: ${msg}`)
                  .join("\n")}</pre>`
              : ""
          }
        `,
        icon: result.failed > 0 ? "warning" : "success",
      });
    } catch (error) {
      console.error(error);
      Swal.fire("Gagal", "Import gagal. Periksa format file.", "error");
    }
  };

  const handleAdd = () => {
    setEditingId(undefined);
    setShowForm(true);
  };

  const handleEdit = (item: SimpananBerjangka) => {
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDetail = (item: SimpananBerjangka) => {
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (item: SimpananBerjangka) => {
    const confirm = await Swal.fire({
      title: "Yakin hapus data?",
      text: `Simpanan Berjangka ${item.reference} (${item.user_name ?? "-"}) akan dihapus.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteSimpananBerjangka(item.id).unwrap();
        await refetch();
        Swal.fire("Berhasil", "Data Simpanan Berjangka dihapus", "success");
      } catch (error) {
        console.error(error);
        Swal.fire("Gagal", "Gagal menghapus Simpanan Berjangka", "error");
      }
    }
  };

  const handleApprove = async (item: SimpananBerjangka) => {
    const confirm = await Swal.fire({
      title: "Setujui Simpanan Berjangka?",
      text: `${item.reference} — ${item.user_name ?? "-"} — ${formatRupiah(item.nominal)}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Setujui",
      cancelButtonText: "Batal",
    });

    if (confirm.isConfirmed) {
      try {
        await validateSimpananBerjangka({
          id: item.id,
          payload: { status: 1 },
        }).unwrap();
        Swal.fire("Berhasil", "Simpanan Berjangka disetujui", "success");
        await refetch();
      } catch (error) {
        console.error(error);
        Swal.fire("Gagal", "Gagal menyetujui Simpanan Berjangka", "error");
      }
    }
  };

  const handleReject = async (item: SimpananBerjangka) => {
    const confirm = await Swal.fire({
      title: "Tolak Simpanan Berjangka?",
      text: `${item.reference} — ${item.user_name ?? "-"} — ${formatRupiah(item.nominal)}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Tolak",
      cancelButtonText: "Batal",
    });

    if (confirm.isConfirmed) {
      try {
        await validateSimpananBerjangka({
          id: item.id,
          payload: { status: 2 },
        }).unwrap();
        Swal.fire("Berhasil", "Simpanan Berjangka ditolak", "success");
        await refetch();
      } catch (error) {
        console.error(error);
        Swal.fire("Gagal", "Gagal menolak Simpanan Berjangka", "error");
      }
    }
  };

  const onFormSuccess = () => {
    refetch();
    setShowForm(false);
    setEditingId(undefined);
  };

  const onFormCancel = () => {
    setShowForm(false);
    setEditingId(undefined);
  };

  const handleExportExcel = () => {
    Swal.fire({
      icon: "info",
      title: "Export Data",
      text: "Fitur export data Simpanan Berjangka akan tersedia segera.",
    });
  };

  const colSpan = 12;

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b bg-muted/30">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-1">
                <Input
                  placeholder="Cari no. bilyet, anggota, referensi..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full sm:max-w-xs"
                />
                <select
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full sm:w-[180px]"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {STATUS_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleImportFile}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  disabled={isTemplateLoading}
                >
                  {isTemplateLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FileDown className="h-4 w-4 mr-2" />
                  )}
                  Template
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImportClick}
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FileUp className="h-4 w-4 mr-2" />
                  )}
                  Import
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportExcel}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Simpanan Berjangka
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/80 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium w-[1%]">Aksi</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">No. Bilyet</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Kode Bilyet</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Anggota</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Referensi</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Produk</th>
                  <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Nominal</th>
                  <th className="px-4 py-3 font-medium text-center whitespace-nowrap">Jangka</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Tgl. Mulai</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Jatuh Tempo</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Bilyet</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={colSpan} className="text-center p-10 text-muted-foreground">
                      Memuat data...
                    </td>
                  </tr>
                ) : list.length === 0 ? (
                  <tr>
                    <td colSpan={colSpan} className="text-center p-10 text-muted-foreground">
                      Tidak ada data simpanan berjangka.
                    </td>
                  </tr>
                ) : (
                  list.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-border/50 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <ActionsGroup
                            handleDetail={() => handleDetail(item)}
                            handleEdit={() => handleEdit(item)}
                            handleDelete={() => handleDelete(item)}
                            showDetail={false}
                            additionalActions={
                              item.status === 0 ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-700 border-green-200 hover:bg-green-50"
                                    onClick={() => handleApprove(item)}
                                    disabled={isValidating}
                                  >
                                    Setujui
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-700 border-red-200 hover:bg-red-50"
                                    onClick={() => handleReject(item)}
                                    disabled={isValidating}
                                  >
                                    Tolak
                                  </Button>
                                </>
                              ) : null
                            }
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="font-mono text-xs font-medium">
                          {item.no_bilyet ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="text-muted-foreground text-xs">
                          {item.kode_bilyet_master ?? item.masterBilyet?.kode_bilyet ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top min-w-[140px]">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">
                            {item.user_name ?? item.user?.name ?? "-"}
                          </span>
                          {item.no_anggota != null && item.no_anggota !== "" && (
                            <span className="text-xs text-muted-foreground">
                              {item.no_anggota}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top font-mono text-xs text-muted-foreground">
                        {item.reference ?? "-"}
                      </td>
                      <td className="px-4 py-3 align-top text-muted-foreground">
                        {item.category_name ??
                          item.masterBilyet?.nama_produk ??
                          item.kode_bilyet_master ??
                          "-"}
                      </td>
                      <td className="px-4 py-3 align-top text-right font-mono tabular-nums">
                        {formatRupiah(item.nominal)}
                      </td>
                      <td className="px-4 py-3 align-top text-center">
                        {item.term_months != null ? `${item.term_months} bln` : "-"}
                      </td>
                      <td className="px-4 py-3 align-top text-muted-foreground whitespace-nowrap">
                        {displayDate(item.date)}
                      </td>
                      <td className="px-4 py-3 align-top text-muted-foreground whitespace-nowrap">
                        {displayDate(item.maturity_date)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Badge variant={statusVariant(item.status)} className="whitespace-nowrap">
                          {STATUS_LABELS[item.status] ?? `Status ${item.status}`}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="text-muted-foreground capitalize text-xs">
                          {item.status_bilyet?.replace("_", " ") ?? "-"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 flex items-center justify-between border-t bg-muted/30">
            <div className="text-sm text-muted-foreground">
              Halaman <strong>{currentPage}</strong> dari{" "}
              <strong>{lastPage}</strong>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= lastPage}
                onClick={() =>
                  setCurrentPage((p) => Math.min(lastPage, p + 1))
                }
              >
                Berikutnya
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={onFormCancel}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="simjaka-modal-title"
          >
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <h2
                id="simjaka-modal-title"
                className="text-lg font-semibold flex items-center gap-2"
              >
                <Clock className="h-5 w-5 text-primary" />
                {editingId
                  ? "Ubah Simpanan Berjangka"
                  : "Tambah Simpanan Berjangka"}
              </h2>
              <Button variant="ghost" size="icon" onClick={onFormCancel}>
                ✕
              </Button>
            </div>
            <div className="overflow-y-auto p-4">
              <SimpananBerjangkaForm
                id={editingId}
                onSuccess={onFormSuccess}
                onCancel={onFormCancel}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
