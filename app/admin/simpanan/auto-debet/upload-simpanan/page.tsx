"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Loader2, List, AlertOctagon, Download } from "lucide-react";
import Swal from "sweetalert2";
import { Separator } from "@/components/ui/separator";

import {
  useGetSimpananImportListQuery,
  useImportSimpananExcelMutation,
  useLazyGetSimpananTemplateQuery,
} from "@/services/admin/simpanan/import-excel.service";
import type {
  SimpananImportItem,
  SimpananImportResponse,
  SimpananImportStatus,
} from "@/types/admin/simpanan/import-export";
import { getStatusBadge, getStatusIcon } from "@/components/icon-animation";

const formatRupiah = (value: number) => {
  if (value == null || !Number.isFinite(value)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

/** Map status API (queue | processed | finished | failed) ke status tampilan */
function mapImportStatus(
  status: SimpananImportStatus
): "SUCCESS" | "ERROR" | "PENDING" | "PROCESSED" {
  const s = String(status).toLowerCase();
  if (s === "finished") return "SUCCESS";
  if (s === "failed") return "ERROR";
  if (s === "queue") return "PENDING";
  if (s === "processed") return "PROCESSED";
  return "PENDING";
}

export default function UploadDataSimpananPage() {
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [page, setPage] = useState(1);

  const {
    data: importListData,
    isLoading: isLogLoading,
    isFetching: isLogFetching,
    error: logError,
    refetch: refetchLog,
  } = useGetSimpananImportListQuery({
    page,
    paginate: 10,
  });

  const [importSimpananExcel, { isLoading: isUploading }] =
    useImportSimpananExcelMutation();

  const [getSimpananTemplate, { isLoading: isTemplateLoading }] =
    useLazyGetSimpananTemplateQuery();

  const logData = useMemo(() => {
    if (!importListData?.data) return [];
    return importListData.data.map((item: SimpananImportItem) => ({
      id: item.id,
      reference: item.reference,
      date: item.date,
      total: item.total,
      excel_path: item.excel_path ?? "",
      status: mapImportStatus(item.status),
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));
  }, [importListData?.data]);

  /** Unduh template setoran (.xlsx) dari service GET /simpanan/import/template */
  const handleDownloadTemplate = async () => {
    try {
      const result = await getSimpananTemplate();
      if (result.error || !result.data) {
        const msg =
          result.error && "message" in result.error
            ? String(result.error.message)
            : "Gagal mengambil template";
        throw new Error(msg);
      }
      const blob = result.data;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "template-simpanan.xlsx";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 200);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Tidak dapat mengunduh template.";
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: message,
      });
    }
  };

  const handleUploadFile = async () => {
    if (isUploading || !fileToUpload) return;

    const file = fileToUpload;

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      return Swal.fire(
        "Gagal",
        "Format file harus Excel (.xlsx, .xls) atau CSV.",
        "error"
      );
    }

    const { isConfirmed } = await Swal.fire({
      title: "Konfirmasi Unggah Data Setoran Simpanan",
      html: `
        Anda akan mengunggah file: 
        <div class="mt-2 font-bold">${file.name}</div>
        <p class="mt-2 text-sm text-gray-600">Pastikan file sesuai format yang ditentukan.</p>
      `,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Unggah & Proses",
    });

    if (!isConfirmed) return;

    try {
      const response = await importSimpananExcel({ file }).unwrap();
      await refetchLog();

      const data = response.data as SimpananImportResponse | undefined;
      const detail =
        data != null
          ? `Referensi: ${data.reference ?? "-"}. Berhasil: ${data.processed ?? 0}, Gagal: ${data.failed ?? 0}.`
          : "";

      Swal.fire({
        icon: "success",
        title: "Unggah Berhasil",
        text: response.message
          ? `${response.message}${detail ? ` ${detail}` : ""}`
          : `File ${file.name} telah diproses. ${detail}`,
      });

      setFileToUpload(null);
      const fileInput = document.getElementById("file_upload") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
    } catch (err) {
      const error = err as { data?: { message?: string }; message?: string };
      console.error("Gagal mengunggah file:", error);
      Swal.fire({
        icon: "error",
        title: "Unggah Gagal",
        text:
          error.data?.message ||
          error.message ||
          "Terjadi kesalahan saat mengunggah file. Silakan coba lagi.",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Upload className="h-6 w-6 text-primary" />
        Upload Data Setoran Simpanan Massal
      </h2>
      <p className="text-gray-600">
        Unggah file yang berisi data setoran simpanan anggota dari sumber luar
        (misalnya Bank atau Payroll).
      </p>

      <Separator />

      {/* --- KARTU UPLOAD FILE --- */}
      <Card className="border-t-4 border-indigo-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-indigo-600">
            <FileText className="h-5 w-5" /> Kontrol File
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-4 items-end">
          <div className="col-span-3 space-y-2">
            <Label htmlFor="file_upload">
              Pilih File Data Setoran (.xlsx/.csv)
            </Label>
            <Input
              id="file_upload"
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
              disabled={isUploading}
            />
          </div>
          <div className="col-span-1">
            <Button
              onClick={handleUploadFile}
              disabled={isUploading || !fileToUpload}
              className="w-full bg-indigo-600 hover:bg-indigo-700 h-10"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Mengunggah...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Unggah & Proses
                </>
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="pt-4 flex justify-between items-center bg-gray-50 border-t">
          <span className="text-sm text-gray-700">
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto text-green-700 font-medium"
              onClick={handleDownloadTemplate}
              disabled={isTemplateLoading}
            >
              <Download className="h-4 w-4 inline mr-1" />
              {isTemplateLoading ? "Memuat..." : "Unduh Template Setoran (.xlsx)"}
            </Button>
          </span>
          <span className="text-sm text-red-600 font-semibold">
            *File wajib menggunakan format template yang tersedia.
          </span>
        </CardFooter>
      </Card>

      {/* --- LOG RIWAYAT PROSES --- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <List className="h-5 w-5" />
            Riwayat Log Pemrosesan File
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-3 w-1/5">Waktu</th>
                <th className="px-4 py-3 w-1/6">Status</th>
                <th className="px-4 py-3 w-1/5">Referensi</th>
                <th className="px-4 py-3 w-1/6">Total</th>
                <th className="px-4 py-3 w-1/5">Dokumen</th>
              </tr>
            </thead>
            <tbody>
              {isLogLoading || isLogFetching ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin inline mr-2" />
                    Memuat riwayat log...
                  </td>
                </tr>
              ) : logError ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-red-500">
                    <AlertOctagon className="h-6 w-6 inline mr-2" />
                    Gagal memuat data log.
                  </td>
                </tr>
              ) : logData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    Tidak ada riwayat log yang ditemukan.
                  </td>
                </tr>
              ) : (
                logData.map((log) => (
                  <tr key={log.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {new Date(log.created_at).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        {getStatusBadge(log.status)}
                      </div>
                    </td>
                    <td className="px-4 py-3">{log.reference ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatRupiah(log.total)}
                    </td>
                    <td className="px-4 py-3">
                      {log.excel_path ? (
                        <a
                          href={log.excel_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
                        >
                          Unduh Dokumen
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
        {/* Kontrol Pagination (Jika total data > paginate) */}
        <CardFooter className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            Menampilkan {logData.length} dari {importListData?.total ?? 0} entri.
          </div>
          <div>
            <Button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              variant="outline"
              size="sm"
              className="mr-2"
            >
              Prev
            </Button>
            <Button
              disabled={page === importListData?.last_page}
              onClick={() => setPage((p) => p + 1)}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}