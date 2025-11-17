"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileText,
  Calendar,
  Zap,
  Loader2,
  CheckCircle,
  AlertTriangle,
  List,
  Download,
  Users,
} from "lucide-react";
import Swal from "sweetalert2";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// --- DUMMY DATA & TYPES ---

interface LogEntry {
  timestamp: string;
  activity: string;
  status: "SUCCESS" | "ERROR" | "PENDING";
  file_name: string;
}

const initialLog: LogEntry[] = [
  {
    timestamp: "2025-11-15 10:00:00",
    activity: "Pemrosesan setoran November 2025 selesai. 450 transaksi berhasil.",
    status: "SUCCESS",
    file_name: "Setoran_Nov_Payroll_X.xlsx",
  },
  {
    timestamp: "2025-11-15 09:30:00",
    activity: "File diunggah dan dalam antrian pemrosesan.",
    status: "PENDING",
    file_name: "Setoran_Nov_Payroll_X.xlsx",
  },
  {
    timestamp: "2025-10-15 14:00:00",
    activity: "Gagal memproses: Kesalahan format pada baris 50 dan 102.",
    status: "ERROR",
    file_name: "Setoran_Okt_Payroll_Y.xlsx",
  },
];

interface UploadSummary {
    file_name: string;
    total_rekening: number;
    total_nominal: number;
    tanggal_upload: string;
}

// --- HELPER FUNCTIONS ---

const formatRupiah = (number: number) => {
  if (isNaN(number) || number === null || number === undefined) return 'Rp 0';
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
  return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">PENDING</Badge>;
};

// --- KOMPONEN UTAMA ---

export default function UploadDataSimpananPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [logData, setLogData] = useState<LogEntry[]>(initialLog);
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null);

  // --- HANDLER UPLOAD FILE ---
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploading) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      return Swal.fire("Gagal", "Format file harus Excel (.xlsx, .xls) atau CSV.", "error");
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

    setIsUploading(true);
    
    // Simulasi pemrosesan file
    setTimeout(() => {
      const newTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newTotal = Math.floor(Math.random() * 80000000) + 10000000;
      const newCount = Math.floor(Math.random() * 400) + 100;
      
      const summary: UploadSummary = {
        file_name: file.name,
        total_rekening: newCount,
        total_nominal: newTotal,
        tanggal_upload: newTimestamp.substring(0, 10),
      };

      const pendingLog: LogEntry = {
        timestamp: newTimestamp,
        activity: `File ${file.name} berhasil diunggah. Menunggu antrian pemrosesan...`,
        status: "PENDING",
        file_name: file.name,
      };

      setLogData((prev) => [pendingLog, ...prev]);
      setUploadSummary(summary);
      setIsUploading(false);

      Swal.fire({
        icon: "success",
        title: "Unggah Berhasil!",
        text: `File ${file.name} telah diunggah. Cek riwayat log untuk status pembukuan.`,
      });
      
    }, 3000); 
  };


  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Upload className="h-6 w-6 text-primary" />
        Upload Data Setoran Simpanan Massal
      </h2>
      <p className="text-gray-600">Unggah file yang berisi data setoran simpanan anggota dari sumber luar (misalnya Bank atau Payroll).</p>

      {/* --- KARTU UPLOAD FILE --- */}
      <Card className="border-t-4 border-indigo-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-indigo-600">
            <FileText className="h-5 w-5" /> Kontrol File
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-4 items-end">
          <div className="col-span-3 space-y-2">
            <Label htmlFor="file_upload">Pilih File Data Setoran (.xlsx/.csv)</Label>
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
              onClick={() => document.getElementById('file_upload')?.click()}
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
                <Download className="h-4 w-4 inline mr-1 text-green-600"/> <a href="#">Unduh Template File (.xlsx)</a>
             </span>
             <span className="text-sm text-red-600 font-semibold">
                *File wajib menggunakan format template yang tersedia.
             </span>
        </CardFooter>
      </Card>

      {/* --- KARTU SUMMARY UPLOAD TERAKHIR --- */}
      {uploadSummary && (
        <Card className="border-t-4 border-blue-500">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-blue-600">
                    <CheckCircle className="h-5 w-5" /> Summary Upload Terakhir
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
                <div>
                    <p className="text-sm text-gray-500">Nama File</p>
                    <p className="font-semibold">{uploadSummary.file_name}</p>
                </div>
                 <div>
                    <p className="text-sm text-gray-500">Tanggal Unggah</p>
                    <p className="font-semibold flex items-center gap-1"><Calendar className="h-4 w-4"/> {uploadSummary.tanggal_upload}</p>
                </div>
                 <div>
                    <p className="text-sm text-gray-500">Jumlah Rekening</p>
                    <p className="font-semibold text-xl flex items-center gap-1"><Users className="h-5 w-5"/> {uploadSummary.total_rekening}</p>
                </div>
                <div className="col-span-3">
                    <p className="text-sm text-gray-500">Total Nominal Setoran</p>
                    <p className="font-extrabold text-3xl text-primary">{formatRupiah(uploadSummary.total_nominal)}</p>
                </div>
            </CardContent>
        </Card>
      )}

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
                  <td className="px-4 py-3 whitespace-nowrap font-semibold flex items-center gap-2">
                    {getStatusIcon(log.status)}
                    {getStatusBadge(log.status)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{log.file_name}</td>
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