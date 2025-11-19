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
  FileText,
  Calendar,
  Loader2,
  CheckCircle,
  AlertTriangle,
  List,
  Download,
  Users,
  Bell,
  Upload,
} from "lucide-react";
import Swal from "sweetalert2";
import { Badge } from "@/components/ui/badge";

// --- IMPORT DARI SERVICE RTK QUERY ---
import {
  useGetSimpananImportListQuery,
  useImportSimpananExcelMutation,
  useGetSimpananImportTemplateUrlQuery,
} from "@/services/admin/simpanan/import-excel.service";

// --- TYPES ---
interface LogEntry {
  timestamp: string;
  activity: string;
  status: "SUCCESS" | "ERROR" | "PENDING";
  file_name: string;
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

const getStatusIcon = (status: LogEntry["status"]) => {
  if (status === "SUCCESS")
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (status === "ERROR")
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
};

const getStatusBadge = (status: LogEntry["status"]) => {
  if (status === "SUCCESS") return <Badge variant="success">SUKSES</Badge>;
  if (status === "ERROR") return <Badge variant="destructive">ERROR</Badge>;
  return (
    <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
      PENDING
    </Badge>
  );
};

// --- COMPONENT ---
export default function UploadDataTagihanPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [logData, setLogData] = useState<LogEntry[]>([]);
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(
    null
  );
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  const [uploadTagihan] = useImportSimpananExcelMutation(); // Use your API hook for mutation
  const { data: logs, isLoading: isLogLoading } = useGetSimpananImportListQuery(
    {
      page: 1, // Adjust pagination if needed
      paginate: 10, // Limit to 10 logs for example
      status: 1, // Filter based on status (adjust if needed)
    }
  );

  const { data: templateURL } = useGetSimpananImportTemplateUrlQuery();

  // --- HANDLER UPLOAD FILE ---
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploading) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      return Swal.fire(
        "Gagal",
        "Format file harus Excel (.xlsx, .xls) atau CSV.",
        "error"
      );
    }

    const { isConfirmed } = await Swal.fire({
      title: "Konfirmasi Unggah Data Tagihan",
      html: `
        Anda akan mengunggah file: 
        <div class="mt-2 font-bold">${file.name}</div>
        <p class="mt-2 text-sm text-gray-600">Data ini akan digunakan untuk menagih anggota melalui proses Auto Debet.</p>
      `,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Unggah & Proses",
    });

    if (!isConfirmed) return;

    setIsUploading(true);

    try {
      // Upload file to the server API
      const response = await uploadTagihan({ file }).unwrap();

      // On successful upload, update state and show success message
      const newTimestamp = new Date()
        .toISOString()
        .replace("T", " ")
        .substring(0, 19);
      setUploadSummary({
        file_name: file.name,
        total_rekening: response.totalRekening,
        total_nominal: response.totalNominal,
        tanggal_upload: newTimestamp.substring(0, 10),
      });

      // Add to log data
      const newLog: LogEntry = {
        timestamp: newTimestamp,
        activity: `File ${file.name} berhasil diunggah. Menunggu antrian pemrosesan tagihan...`,
        status: "PENDING",
        file_name: file.name,
      };

      setLogData((prev) => [newLog, ...prev]);

      Swal.fire({
        icon: "success",
        title: "Unggah Berhasil!",
        text: `File ${file.name} telah diunggah. Tagihan akan diproses di menu Proses Auto Debet.`,
      });

      // Reset file input
      setFileToUpload(null);
      document.getElementById("file_upload")?.setAttribute("value", "");
    } catch (error) {
      console.error("Gagal mengunggah file:", error);
      Swal.fire({
        icon: "error",
        title: "Unggah Gagal",
        text: "Terjadi kesalahan saat mengunggah file. Silakan coba lagi.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Bell className="h-6 w-6 text-primary" />
        Upload Data Tagihan Non-Simpanan Massal
      </h2>
      <p className="text-gray-600">
        Unggah file yang berisi daftar tagihan yang akan didebet dari saldo
        anggota.
      </p>

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
              Pilih File Data Tagihan (.xlsx/.csv)
            </Label>
            <Input
              id="file_upload"
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleUploadFile}
              disabled={isUploading}
            />
          </div>
          <div className="col-span-1">
            <Button
              onClick={() => document.getElementById("file_upload")?.click()}
              disabled={isUploading}
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
                  Pilih File
                </>
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="pt-4 flex justify-between items-center bg-gray-50 border-t">
          <span className="text-sm text-gray-700">
            <Download className="h-4 w-4 inline mr-1 text-green-600" />{" "}
            <a
              href={templateURL || "#"}
              target="_blank"
              rel="noopener noreferrer"
            >
              Unduh Template Tagihan (.xlsx)
            </a>
          </span>
          <span className="text-sm text-red-600 font-semibold">
            *File wajib menggunakan format template yang tersedia.
          </span>
        </CardFooter>
      </Card>

      {/* --- KARTU SUMMARY --- */}
      {uploadSummary && (
        <Card className="border-t-4 border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-blue-600">
              <CheckCircle className="h-5 w-5" /> Summary Upload Tagihan
              Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nama File</p>
              <p className="font-semibold">{uploadSummary.file_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tanggal Unggah</p>
              <p className="font-semibold flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {uploadSummary.tanggal_upload}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Jumlah Rekening Tertagih</p>
              <p className="font-semibold text-xl flex items-center gap-1">
                <Users className="h-5 w-5" /> {uploadSummary.total_rekening}
              </p>
            </div>
            <div className="col-span-3">
              <p className="text-sm text-gray-500">Total Nominal Tagihan</p>
              <p className="font-extrabold text-3xl text-red-600">
                {formatRupiah(uploadSummary.total_nominal)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- LOG RIWAYAT --- */}
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
                <th className="px-4 py-3 w-1/4">Waktu</th>
                <th className="px-4 py-3 w-1/6">Status</th>
                <th className="px-4 py-3 w-1/4">Nama File</th>
                <th className="px-4 py-3">Aktivitas/Pesan</th>
              </tr>
            </thead>
            <tbody>
              {logData.map((log, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                    {log.timestamp}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-semibold flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      {getStatusBadge(log.status)}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {log.file_name}
                  </td>
                  <td className="px-4 py-3">{log.activity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}