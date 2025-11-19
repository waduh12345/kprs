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
import {
  Upload,
  FileText,
  Calendar,
  Loader2,
  CheckCircle,
  AlertTriangle,
  List,
  Download,
  Users,
  AlertOctagon,
  Zap,
} from "lucide-react";
import Swal from "sweetalert2";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// --- IMPORT DARI SERVICE RTK QUERY ---
import {
  useGetSimpananImportListQuery,
  useImportSimpananExcelMutation,
  useGetSimpananImportTemplateUrlQuery,
} from "@/services/admin/simpanan/import-excel.service";
import type { Simpanan } from "@/types/admin/simpanan";
import { getStatusBadge, getStatusIcon } from "@/components/icon-animation";

// --- TYPES LOKAL UNTUK TAMPILAN ---
interface LogEntry {
  id: number;
  timestamp: string;
  activity: string;
  status: "SUCCESS" | "ERROR" | "PENDING" | "PROCESSED";
  file_name: string;
  excel_path: string; // Menambahkan excel_path untuk tombol download
}

interface UploadSummary {
  file_name: string;
  total_rekening: number;
  total_nominal: number;
  tanggal_upload: string;
}

// --- HELPER FUNCTIONS ---
const formatRupiah = (number: number) => {
  if (isNaN(number) || number === null || number === undefined) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

// Map status API ke status lokal
const mapStatusToLog = (
  status: Simpanan["status"]
): "SUCCESS" | "ERROR" | "PENDING" | "PROCESSED" => {
  // Asumsi mapping status API:
  if (status === 2) return "SUCCESS";
  if (status === 3) return "ERROR";
  if (status === 1) return "PENDING";
  return "PROCESSED";
};

// --- KOMPONEN UTAMA ---
export default function UploadDataSimpananPage() {
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(
    null
  );
  const [page, setPage] = useState(1); // State untuk pagination

  // --- RTK QUERY HOOKS ---
  const {
    data: simpananListData,
    isLoading: isLogLoading,
    isFetching: isLogFetching,
    error: logError,
    refetch: refetchLog,
  } = useGetSimpananImportListQuery({
    page,
    paginate: 10,
    status: 1,
  });

  const [importSimpanan, { isLoading: isUploading }] =
    useImportSimpananExcelMutation();

  const { data: templateURL } = useGetSimpananImportTemplateUrlQuery();

  const logData: LogEntry[] = useMemo(() => {
    if (!simpananListData?.data) return [];

    return simpananListData.data.map((simpanan) => ({
      id: simpanan.id,
      timestamp: new Date(simpanan.updated_at).toLocaleString("id-ID"),
      file_name: simpanan.reference || simpanan.order_id || "N/A",
      excel_path: simpanan.excel_path || "", // Menambahkan excel_path
      status: mapStatusToLog(simpanan.status),
      activity: `Pembukuan Simpanan (${
        simpanan.category_name
      }). Nominal: ${formatRupiah(simpanan.nominal)}. Status: ${
        simpanan.paid_at ? "Telah Dibayar" : "Menunggu Proses"
      }`,
    }));
  }, [simpananListData]);

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
      title: "Konfirmasi Unggah Data Simpanan",
      html: `
        Anda akan mengunggah file: 
        <div class="mt-2 font-bold">${file.name}</div>
        <p class="mt-2 text-sm text-gray-600">Pastikan file sesuai format template yang ditentukan.</p>
      `,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Unggah & Proses",
    });

    if (!isConfirmed) return;

    try {
      const response = await importSimpanan({ file }).unwrap();

      const newTimestamp = new Date()
        .toISOString()
        .replace("T", " ")
        .substring(0, 19);
      setUploadSummary({
        file_name: file.name,
        total_rekening: 0,
        total_nominal: 0,
        tanggal_upload: newTimestamp.substring(0, 10),
      });

      refetchLog();

      Swal.fire({
        icon: "success",
        title: "Unggah Berhasil!",
        text:
          response.message ||
          `File ${file.name} telah diunggah. Cek riwayat log untuk status pembukuan.`,
      });

      setFileToUpload(null);
      const fileInput = document.getElementById(
        "file_upload"
      ) as HTMLInputElement;
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
            <Download className="h-4 w-4 inline mr-1 text-green-600" />
            {templateURL ? (
              <a
                href={templateURL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-green-700 font-medium"
              >
                Unduh Template File (.csv)
              </a>
            ) : (
              "Template File (.csv) - Loading..."
            )}
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
                <th className="px-4 py-3 w-1/5">Dokumen</th>
                <th className="px-4 py-3">Aktivitas/Pesan</th>
              </tr>
            </thead>
            <tbody>
              {isLogLoading || isLogFetching ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin inline mr-2" />
                    Memuat riwayat log...
                  </td>
                </tr>
              ) : logError ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-red-500">
                    <AlertOctagon className="h-6 w-6 inline mr-2" />
                    Gagal memuat data log.
                  </td>
                </tr>
              ) : logData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">
                    Tidak ada riwayat log yang ditemukan.
                  </td>
                </tr>
              ) : (
                logData.map((log) => (
                  <tr key={log.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {log.timestamp}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        {getStatusBadge(log.status)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={log.excel_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
                      >
                        Unduh Dokumen
                      </a>
                    </td>
                    <td className="px-4 py-3">{log.activity}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
        {/* Kontrol Pagination (Jika total data > paginate) */}
        <CardFooter className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            Menampilkan {logData.length} dari {simpananListData?.total || 0}{" "}
            entri.
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
              disabled={page === simpananListData?.last_page}
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