"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Upload,
  Download,
  Calendar,
  Zap,
  Loader2,
  CheckCircle,
  AlertTriangle,
  List,
} from "lucide-react";
import Swal from "sweetalert2";
import { Separator } from "@/components/ui/separator";

// --- DUMMY DATA & TYPES ---

interface LogEntry {
  timestamp: string;
  activity: string;
  status: "SUCCESS" | "ERROR" | "INFO";
}

const initialLog: LogEntry[] = [
  {
    timestamp: "2025-11-15 14:00:00",
    activity: "Upload hasil debet Gaji Bank X periode 2025-11 berhasil. 98% sukses.",
    status: "SUCCESS",
  },
  {
    timestamp: "2025-11-15 10:30:00",
    activity: "Generate file tagihan Bank X periode 2025-11 selesai. Total 500 anggota.",
    status: "SUCCESS",
  },
  {
    timestamp: "2025-10-15 14:00:00",
    activity: "Upload hasil debet Gaji Bank X periode 2025-10 gagal: Format file salah.",
    status: "ERROR",
  },
];

// --- HELPER FUNCTIONS ---

const getStatusIcon = (status: LogEntry["status"]) => {
  if (status === "SUCCESS")
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (status === "ERROR")
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  return <List className="h-4 w-4 text-blue-500" />;
};

// --- KOMPONEN UTAMA ---

export default function ProsesAutoDebetPembiayaanPage() {
  const today = new Date().toISOString().substring(0, 7);
  const [periode, setPeriode] = useState(today);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logData, setLogData] = useState<LogEntry[]>(initialLog);

  // --- HANDLER GENERATE FILE TAGIHAN ---
  const handleGenerateTagihan = async () => {
    if (isGenerating || isUploading) return;

    const { isConfirmed } = await Swal.fire({
      title: "Konfirmasi Generate File Tagihan",
      html: `
        Anda akan membuat file tagihan **Auto Debet Pembiayaan** untuk periode: 
        <div class="mt-2 text-xl font-bold text-primary">${periode}</div>
        <p class="mt-2 text-sm text-red-600">Pastikan periode sudah benar sebelum dikirim ke Bank/Payroll.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Generate File",
    });

    if (!isConfirmed) return;

    setIsGenerating(true);
    
    // Simulasi pemanggilan API Generate
    setTimeout(() => {
      const newTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newLogEntry: LogEntry = {
        timestamp: newTimestamp,
        activity: `Generate file tagihan Gaji Bank X periode ${periode} selesai. Total 512 anggota siap ditagih.`,
        status: "SUCCESS",
      };

      setLogData((prev) => [newLogEntry, ...prev]);
      setIsGenerating(false);

      Swal.fire({
        icon: "success",
        title: "Generate Berhasil",
        html: `File tagihan untuk periode ${periode} telah dibuat dan siap diunduh/dikirim ke sistem Bank/Payroll.`,
      });
      
    }, 3000); 
  };
  
  // --- HANDLER UPLOAD HASIL DEBET ---
  const handleUploadResult = async (file: File) => {
    if (isGenerating || isUploading) return;

    const { isConfirmed } = await Swal.fire({
      title: "Konfirmasi Upload Hasil Debet",
      html: `
        Anda akan mengunggah file hasil debet: 
        <div class="mt-2 font-bold">${file.name}</div>
        <p class="mt-2 text-sm text-red-600">Proses ini akan mencatat pembayaran angsuran secara massal.</p>
      `,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Proses Upload",
    });

    if (!isConfirmed) return;

    setIsUploading(true);
    
    // Simulasi pemanggilan API Upload
    setTimeout(() => {
      const newTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const status = file.name.includes('error') ? "ERROR" : "SUCCESS";
      const activity = status === "SUCCESS"
        ? `Upload hasil debet ${file.name} periode ${periode} berhasil. 99% sukses dibukukan.`
        : `Upload hasil debet ${file.name} periode ${periode} gagal. Format tidak dikenali.`;

      const newLogEntry: LogEntry = {
        timestamp: newTimestamp,
        activity: activity,
        status: status,
      };

      setLogData((prev) => [newLogEntry, ...prev]);
      setIsUploading(false);

      Swal.fire({
        icon: status === "SUCCESS" ? "success" : "error",
        title: status === "SUCCESS" ? "Pembukuan Selesai" : "Upload Gagal",
        text: status === "SUCCESS" 
            ? "Hasil debet berhasil dibukukan, angsuran tercatat."
            : "Gagal memproses file hasil debet. Cek format file.",
      });
      
    }, 4000); 
  };


  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Zap className="h-6 w-6 text-primary" />
        Proses Auto Debet Pembiayaan
      </h2>

      {/* --- KARTU GENERATE FILE TAGIHAN --- */}
      <Card className="border-t-4 border-indigo-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-indigo-600">
            <Download className="h-5 w-5" /> 1. Generate File Tagihan
          </CardTitle>
          <p className="text-sm text-gray-500">
            Buat file daftar tagihan anggota yang akan diserahkan ke Bank/Sistem Payroll.
          </p>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-4 items-end">
          <div className="col-span-1 space-y-2">
            <Label htmlFor="periode">Periode Tagihan (Bulan/Tahun)</Label>
            <Input
              id="periode"
              type="month"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              disabled={isGenerating || isUploading}
            />
          </div>
          <div className="col-span-3">
            <Button
              onClick={handleGenerateTagihan}
              disabled={isGenerating || isUploading}
              className="w-full text-md bg-indigo-600 hover:bg-indigo-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Membuat File Tagihan...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-5 w-5" />
                  Generate Tagihan {periode}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* --- KARTU UPLOAD HASIL DEBET --- */}
      <Card className="border-t-4 border-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-green-600">
            <Upload className="h-5 w-5" /> 2. Upload Hasil Debet (Pembukuan)
          </CardTitle>
          <p className="text-sm text-gray-500">
            Unggah file hasil proses debet dari Bank/Payroll untuk mencatat angsuran.
          </p>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-4 items-end">
          <div className="col-span-3 space-y-2">
            <Label htmlFor="file_upload">Pilih File Hasil Debet (.xlsx/.csv)</Label>
            <Input
              id="file_upload"
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleUploadResult(e.target.files[0]);
                  e.target.value = ''; // Reset input file
                }
              }}
              disabled={isGenerating || isUploading}
            />
          </div>
          <div className="col-span-1">
            <Button
              disabled={true} // Tombol utama dinonaktifkan, aksi dilakukan via Input File
              className="w-full bg-gray-400 hover:bg-gray-500 text-md"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* --- LOG RIWAYAT PROSES --- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <List className="h-5 w-5" />
            Riwayat Log Proses Auto Debet
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-3 w-1/4">Waktu</th>
                <th className="px-4 py-3 w-1/6">Status</th>
                <th className="px-4 py-3">Aktivitas</th>
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
                    {log.status}
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