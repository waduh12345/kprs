"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Zap,
  Loader2,
  CheckCircle,
  AlertTriangle,
  List,
  Lock,
  Sunrise,
  BookOpen,
  ListChecks,
} from "lucide-react";
import Swal from "sweetalert2";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// --- DUMMY DATA & TYPES ---

interface LogEntry {
  timestamp: string;
  activity: string;
  status: "SUCCESS" | "ERROR" | "INFO";
}

const initialLog: LogEntry[] = [
  {
    timestamp: "2024-12-31 02:00:00",
    activity: "Proses End of Year (EOY) untuk tahun 2024 berhasil diselesaikan.",
    status: "SUCCESS",
  },
  {
    timestamp: "2024-12-31 01:00:00",
    activity: "Memulai proses jurnal penutup akhir tahun (menutup Akun Pendapatan/Beban)...",
    status: "INFO",
  },
  {
    timestamp: "2024-12-30 18:00:00",
    activity: "Verifikasi prasyarat EOM Desember 2024 selesai.",
    status: "SUCCESS",
  },
];

interface EOYValidation {
    prasyarat_eom_desember: "OK" | "PENDING";
    laba_rugi_bersih: number;
}

// --- HELPER FUNCTIONS ---

const formatRupiah = (number: number) => {
  if (isNaN(number) || number === null || number === undefined) return 'Rp 0';
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Math.abs(number));
  return number < 0 ? `(${formatted})` : formatted;
};

const getStatusIcon = (status: LogEntry["status"]) => {
  if (status === "SUCCESS")
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (status === "ERROR")
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  return <List className="h-4 w-4 text-blue-500" />;
};

// --- KOMPONEN UTAMA ---

export default function ProsesEOYPage() {
  const currentYear = new Date().getFullYear();
  
  const [tahunTutup, setTahunTutup] = useState(currentYear);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logData, setLogData] = useState<LogEntry[]>(initialLog);
  
  // Simulasi validasi prasyarat (harus OK sebelum proses)
  const validation: EOYValidation = useMemo(() => ({
    prasyarat_eom_desember: "PENDING", // Asumsi EOM Desember belum selesai
    laba_rugi_bersih: 150000000, // Hasil Laba Rugi Bersih sebelum penutupan
  }), []);

  const canProceed = useMemo(() => (
    validation.prasyarat_eom_desember === "OK"
  ), [validation]);

  // --- HANDLER EKSEKUSI EOY ---
  const handleRunEOY = async () => {
    if (!canProceed || isProcessing) return;

    const { isConfirmed } = await Swal.fire({
      title: "Konfirmasi Penutupan Buku Tahunan",
      html: `
        Anda akan menjalankan **End of Year (EOY)** untuk tahun: 
        <div class="mt-2 text-xl font-bold text-primary">${tahunTutup}</div>
        <p class="mt-2 text-red-600 font-semibold">Proses ini akan:
        <ul class="list-disc list-inside text-left font-normal mt-1">
            <li>Menutup akun Pendapatan dan Beban.</li>
            <li>Memindahkan Laba/Rugi ke akun Laba Ditahan.</li>
            <li>Mengatur ulang saldo akun nominal menjadi nol.</li>
        </ul>
        </p>
      `,
      icon: "error",
      showCancelButton: true,
      confirmButtonText: "Tutup Buku Permanen",
    });

    if (!isConfirmed) return;

    setIsProcessing(true);
    
    // Simulasi pemanggilan API EOY
    setTimeout(() => {
      const newTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newLogEntry: LogEntry = {
        timestamp: newTimestamp,
        activity: `Proses End of Year (EOY) untuk tahun ${tahunTutup} berhasil. Akun nominal ditutup.`,
        status: "SUCCESS",
      };

      setLogData((prev) => [newLogEntry, ...prev]);
      setIsProcessing(false);

      Swal.fire({
        icon: "success",
        title: "EOY Berhasil!",
        text: `Tahun ${tahunTutup} telah berhasil ditutup. Sistem siap untuk tahun ${tahunTutup + 1}.`,
      });
      
    }, 5000); 
  };


  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Sunrise className="h-6 w-6 text-primary" />
        Proses End of Year (EOY) - Penutupan Tahunan
      </h2>

      {/* --- KARTU KONTROL TAHUN --- */}
      <Card className="border-t-4 border-indigo-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-indigo-600">
            <Lock className="h-5 w-5" /> Penutupan Buku Permanen
          </CardTitle>
          <p className="text-sm text-gray-500">
            Pilih tahun yang akan ditutup. Proses ini wajib dijalankan sekali
            setahun.
          </p>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-4 items-end">
          <div className="col-span-1 space-y-2">
            <Label htmlFor="tahun_tutup">Tahun yang Akan Ditutup</Label>
            <Input
              id="tahun_tutup"
              type="number"
              min={2020}
              max={currentYear}
              value={tahunTutup}
              onChange={(e) =>
                setTahunTutup(parseInt(e.target.value) || currentYear)
              }
              disabled={isProcessing}
            />
          </div>
          <div className="col-span-3">
            <Button
              onClick={handleRunEOY}
              disabled={!canProceed || isProcessing}
              className={`w-full text-lg h-10 ${
                canProceed ? "bg-red-600 hover:bg-red-700" : "bg-gray-400"
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Memproses Jurnal Penutup Tahunan...
                </>
              ) : (
                <>
                  <BookOpen className="mr-2 h-5 w-5" />
                  Jalankan Proses EOY ({tahunTutup})
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- KARTU PRASYARAT & HASIL --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ListChecks className="h-5 w-5" /> Hasil dan Prasyarat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 border rounded-md bg-yellow-50 flex justify-between items-center">
              <span className="font-medium text-yellow-800">
                Laba (Rugi) Bersih Tahun {tahunTutup}
              </span>
              <span
                className={`font-bold text-2xl ${
                  validation.laba_rugi_bersih < 0
                    ? "text-red-700"
                    : "text-primary"
                }`}
              >
                {formatRupiah(validation.laba_rugi_bersih)}
              </span>
            </div>
            <Separator label={""} />
            <div className="flex justify-between items-center p-2 border rounded-md">
              <span className="font-medium">
                Prasyarat: EOM Bulan Desember Selesai
              </span>
              {validation.prasyarat_eom_desember === "OK" ? (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" /> OK
                </Badge>
              ) : (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  <AlertTriangle className="h-4 w-4" /> Pending
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
        {!canProceed && (
          <CardFooter className="bg-red-50 text-red-700 font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> EOY TIDAK DAPAT DIJALANKAN.
            Pastikan EOM Desember sudah selesai.
          </CardFooter>
        )}
      </Card>

      <Separator label={""} />

      {/* --- LOG RIWAYAT PROSES --- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <List className="h-5 w-5" />
            Riwayat Log Proses EOY
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-3 w-1/4">Waktu Penutupan</th>
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

      <p className="text-xs text-gray-500 mt-4">
        *Proses ini adalah penutupan akuntansi final untuk tahun fiskal yang
        bersangkutan.
      </p>
    </div>
  );
}