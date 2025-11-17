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
  Clock,
  BookOpen,
  Badge,
  ListChecks,
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
    timestamp: "2025-10-31 01:00:00",
    activity: "Proses End of Month (EOM) untuk periode 2025-10 berhasil.",
    status: "SUCCESS",
  },
  {
    timestamp: "2025-10-31 00:00:10",
    activity: "Memulai proses jurnal penutup (menutup Akun Pendapatan/Beban)...",
    status: "INFO",
  },
  {
    timestamp: "2025-09-30 01:30:00",
    activity: "Proses End of Month (EOM) untuk periode 2025-09 berhasil.",
    status: "SUCCESS",
  },
];

interface EOMValidation {
    prasyarat_bunga: "OK" | "PENDING";
    prasyarat_simjaka: "OK" | "PENDING";
    jurnal_belum_posted: "OK" | "ADA"; // Ada jurnal draft yang belum dipost
}

// --- HELPER FUNCTIONS ---

const getStatusIcon = (status: LogEntry["status"]) => {
  if (status === "SUCCESS")
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (status === "ERROR")
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  return <List className="h-4 w-4 text-blue-500" />;
};

// --- KOMPONEN UTAMA ---

export default function ProsesEOMPage() {
  const nextMonth = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth());
    return d.toISOString().substring(0, 7);
  }, []);
  
  const [periodeTutup, setPeriodeTutup] = useState(nextMonth);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logData, setLogData] = useState<LogEntry[]>(initialLog);
  
  // Simulasi validasi prasyarat (harus OK sebelum proses)
  const validation: EOMValidation = useMemo(() => ({
    prasyarat_bunga: "OK", // Asumsi Bunga Simpanan sudah diproses
    prasyarat_simjaka: "OK", // Asumsi Proses Harian Simjaka sudah diproses
    jurnal_belum_posted: "OK", // Asumsi tidak ada jurnal draft
  }), []);

  const canProceed = useMemo(() => (
    validation.prasyarat_bunga === "OK" &&
    validation.prasyarat_simjaka === "OK" &&
    validation.jurnal_belum_posted === "OK"
  ), [validation]);

  // --- HANDLER EKSEKUSI EOM ---
  const handleRunEOM = async () => {
    if (!canProceed || isProcessing) return;

    const { isConfirmed } = await Swal.fire({
      title: "Konfirmasi Penutupan Buku Bulanan",
      html: `
        Anda akan menjalankan **End of Month (EOM)** untuk periode: 
        <div class="mt-2 text-xl font-bold text-primary">${periodeTutup}</div>
        <p class="mt-2 text-red-600 font-semibold">Setelah ini, tidak ada transaksi yang dapat diposting ke periode ${periodeTutup}.</p>
      `,
      icon: "error",
      showCancelButton: true,
      confirmButtonText: "Tutup Buku Sekarang",
    });

    if (!isConfirmed) return;

    setIsProcessing(true);
    
    // Simulasi pemanggilan API EOM
    setTimeout(() => {
      const newTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newLogEntry: LogEntry = {
        timestamp: newTimestamp,
        activity: `Proses End of Month (EOM) untuk periode ${periodeTutup} berhasil. Buku ditutup.`,
        status: "SUCCESS",
      };

      setLogData((prev) => [newLogEntry, ...prev]);
      setIsProcessing(false);
      
      // Majukan periode simulasi
      const currentYear = parseInt(periodeTutup.substring(0, 4));
      const currentMonth = parseInt(periodeTutup.substring(5, 7)) - 1;
      const nextDate = new Date(currentYear, currentMonth + 1, 1);
      setPeriodeTutup(nextDate.toISOString().substring(0, 7));

      Swal.fire({
        icon: "success",
        title: "EOM Berhasil!",
        text: `Periode ${periodeTutup} telah berhasil ditutup.`,
      });
      
    }, 4000); 
  };


  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Clock className="h-6 w-6 text-primary" />
        Proses End of Month (EOM)
      </h2>

      {/* --- KARTU KONTROL PERIODE --- */}
      <Card className="border-t-4 border-indigo-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-indigo-600">
            <Lock className="h-5 w-5" /> Penutupan Buku Bulanan
          </CardTitle>
          <p className="text-sm text-gray-500">
            Pilih periode yang akan ditutup. Proses ini akan menghasilkan jurnal penutup laba/rugi dan mengunci periode.
          </p>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-4 items-end">
          <div className="col-span-1 space-y-2">
            <Label htmlFor="periode_tutup">Periode yang Akan Ditutup</Label>
            <Input
              id="periode_tutup"
              type="month"
              value={periodeTutup}
              onChange={(e) => setPeriodeTutup(e.target.value)}
              disabled={isProcessing}
            />
          </div>
          
          <div className="col-span-3">
            <Button
              onClick={handleRunEOM}
              disabled={!canProceed || isProcessing}
              className={`w-full text-lg h-10 ${canProceed ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400'}`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Menjalankan Jurnal Penutup...
                </>
              ) : (
                <>
                  <BookOpen className="mr-2 h-5 w-5" />
                  Jalankan Proses EOM ({periodeTutup})
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- KARTU PRASYARAT (VALIDASI) --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ListChecks className="h-5 w-5" /> Status Prasyarat (Wajib OK)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 border rounded-md">
              <span className="font-medium">1. Proses Bunga Simpanan Selesai</span>
              {validation.prasyarat_bunga === "OK" ? (
                <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-4 w-4"/> OK</Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-4 w-4"/> Pending</Badge>
              )}
            </div>
            <div className="flex justify-between items-center p-2 border rounded-md">
              <span className="font-medium">2. Proses Harian Simjaka Selesai (Hingga Akhir Bulan)</span>
              {validation.prasyarat_simjaka === "OK" ? (
                <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-4 w-4"/> OK</Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-4 w-4"/> Pending</Badge>
              )}
            </div>
            <div className="flex justify-between items-center p-2 border rounded-md">
              <span className="font-medium">3. Tidak Ada Jurnal/Transaksi Draft Belum Posting</span>
              {validation.jurnal_belum_posted === "OK" ? (
                <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-4 w-4"/> OK</Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-4 w-4"/> Ada Draft</Badge>
              )}
            </div>
          </div>
        </CardContent>
        {!canProceed && (
            <CardFooter className="bg-red-50 text-red-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5"/> EOM TIDAK DAPAT DIJALANKAN. Selesaikan semua prasyarat di atas.
            </CardFooter>
        )}
      </Card>

      <Separator label={""} />

      {/* --- LOG RIWAYAT PROSES --- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <List className="h-5 w-5" />
            Riwayat Log Proses EOM
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
        *Setelah EOM, saldo laba rugi bulanan akan dipindahkan ke akun SHU tahun berjalan (Laba Ditahan).
      </p>
    </div>
  );
}