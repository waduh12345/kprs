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
  Coins,
  TrendingUp,
  BookOpen,
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
    timestamp: "2025-10-31 23:59:59",
    activity: "Proses bunga periode Oktober 2025 selesai. 1500 rekening diproses.",
    status: "SUCCESS",
  },
  {
    timestamp: "2025-10-31 00:00:05",
    activity: "Memulai kalkulasi bunga Simpanan Wajib & Sukarela...",
    status: "INFO",
  },
  {
    timestamp: "2025-09-30 23:59:59",
    activity: "Proses bunga periode September 2025 selesai. 1480 rekening diproses.",
    status: "SUCCESS",
  },
];

interface BungaSummary {
    periode: string;
    total_rekening: number;
    total_bunga: number;
    is_calculated: boolean;
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
  return <List className="h-4 w-4 text-blue-500" />;
};

// --- KOMPONEN UTAMA ---

export default function ProsesBungaSimpananPage() {
  const today = new Date().toISOString().substring(0, 10);
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().substring(0, 10);
  
  const [tanggalProses, setTanggalProses] = useState(endOfMonth);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [bungaSummary, setBungaSummary] = useState<BungaSummary | null>(null);
  const [logData, setLogData] = useState<LogEntry[]>(initialLog);

  // Cek apakah tanggal yang dipilih adalah akhir bulan (rekomendasi)
  const isEndOfMonth = useMemo(() => {
    const d = new Date(tanggalProses);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return d.getDate() === lastDay;
  }, [tanggalProses]);


  // --- HANDLER KALKULASI BUNGA ---
  const handleCalculate = async () => {
    if (isCalculating || isPosting) return;

    if (!isEndOfMonth) {
        const { isConfirmed } = await Swal.fire({
            title: "Perhatian Tanggal",
            text: "Tanggal proses bukan akhir bulan. Proses bunga idealnya dilakukan pada akhir bulan. Lanjutkan?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Ya, Lanjutkan",
        });
        if (!isConfirmed) return;
    }

    setIsCalculating(true);
    setBungaSummary(null);

    // Simulasi pemanggilan API Kalkulasi
    setTimeout(() => {
      const periode = tanggalProses.substring(0, 7);
      const newTotalBunga = Math.floor(Math.random() * 5000000) + 1000000;
      const newTotalRekening = Math.floor(Math.random() * 500) + 1000;

      const summary: BungaSummary = {
        periode: periode,
        total_rekening: newTotalRekening,
        total_bunga: newTotalBunga,
        is_calculated: true,
      };
      
      setBungaSummary(summary);
      setIsCalculating(false);

      Swal.fire({
        icon: "info",
        title: "Kalkulasi Selesai",
        html: `Total bunga yang akan dibukukan untuk periode **${periode}** adalah **${formatRupiah(newTotalBunga)}** untuk ${newTotalRekening} rekening.`,
      });
      
    }, 2500); 
  };
  
  // --- HANDLER POSTING JURNAL BUNGA ---
  const handlePostBunga = async () => {
    if (!bungaSummary || isPosting) return;

    const { isConfirmed } = await Swal.fire({
      title: "Konfirmasi Posting Bunga",
      html: `
        Anda akan memposting total bunga **${formatRupiah(bungaSummary.total_bunga)}** ke rekening anggota.
        <p class="mt-2 text-red-600 font-semibold">Proses ini tidak dapat dibatalkan dan akan memengaruhi saldo simpanan dan laporan laba rugi.</p>
      `,
      icon: "error",
      showCancelButton: true,
      confirmButtonText: "POST SEKARANG",
    });

    if (!isConfirmed) return;

    setIsPosting(true);
    
    // Simulasi pemanggilan API Posting
    setTimeout(() => {
      const newTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newLogEntry: LogEntry = {
        timestamp: newTimestamp,
        activity: `Posting bunga simpanan periode ${bungaSummary.periode} selesai. Bunga masuk ke rekening anggota.`,
        status: "SUCCESS",
      };

      setLogData((prev) => [newLogEntry, ...prev]);
      setBungaSummary(null); // Reset summary
      setIsPosting(false);

      Swal.fire({
        icon: "success",
        title: "Posting Berhasil!",
        text: `Bunga Simpanan periode ${bungaSummary.periode} telah berhasil dibukukan.`,
      });
      
    }, 4000); 
  };


  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Coins className="h-6 w-6 text-primary" />
        Proses Bunga / Bagi Hasil Simpanan
      </h2>

      {/* --- KARTU KONTROL PROSES --- */}
      <Card className="border-t-4 border-indigo-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-indigo-600">
            <Zap className="h-5 w-5" /> Kontrol dan Eksekusi
          </CardTitle>
          <p className="text-sm text-gray-500">
            Lakukan kalkulasi dan posting bunga di akhir periode akuntansi (akhir bulan).
          </p>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-4 items-end">
          <div className="col-span-1 space-y-2">
            <Label htmlFor="tanggal_proses">Tanggal Proses (Akhir Periode)</Label>
            <Input
              id="tanggal_proses"
              type="date"
              value={tanggalProses}
              onChange={(e) => setTanggalProses(e.target.value)}
              disabled={isCalculating || isPosting}
            />
            {!isEndOfMonth && tanggalProses && (
                <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> Bukan akhir bulan!</p>
            )}
          </div>
          
          <div className="col-span-3 space-y-2">
            <Label>Status</Label>
            <Button
              onClick={handleCalculate}
              disabled={isCalculating || isPosting}
              className="w-full text-md bg-indigo-600 hover:bg-indigo-700 h-10"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Mengalkulasi Bunga...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-5 w-5" />
                  1. Kalkulasi Bunga Simpanan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- KARTU HASIL KALKULASI & POSTING --- */}
      <Card className={`${bungaSummary ? 'border-t-4 border-green-500' : 'hidden'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-green-600">
            <TrendingUp className="h-5 w-5" /> Hasil Kalkulasi Siap Posting
          </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 gap-4 pb-4 mb-4 border-b">
                <div>
                    <p className="text-sm text-gray-500">Periode Proses</p>
                    <p className="font-bold text-lg">{bungaSummary?.periode}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Total Rekening Diproses</p>
                    <p className="font-bold text-lg">{bungaSummary?.total_rekening} Anggota</p>
                </div>
            </div>
            
            <div className="flex justify-between items-center bg-green-50 p-4 rounded-lg">
                <div>
                    <p className="text-sm text-gray-500">Total Bunga / Bagi Hasil (Debet Beban, Kredit Simpanan)</p>
                    <p className="text-3xl font-extrabold text-green-800">{formatRupiah(bungaSummary?.total_bunga || 0)}</p>
                </div>
                
                <Button 
                    onClick={handlePostBunga}
                    disabled={isPosting}
                    className="bg-red-600 hover:bg-red-700 text-lg"
                >
                    {isPosting ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Posting Jurnal...
                        </>
                    ) : (
                        <>
                            <BookOpen className="mr-2 h-5 w-5" />
                            2. Post Jurnal Bunga
                        </>
                    )}
                </Button>
            </div>
        </CardContent>
      </Card>

      <Separator label={""} />

      {/* --- LOG RIWAYAT PROSES --- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <List className="h-5 w-5" />
            Riwayat Log Proses Bunga
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
      
      <p className="text-xs text-gray-500 mt-4">
        *Proses ini harus berhasil diselesaikan sebelum menjalankan proses End of Month (EOM).
      </p>
    </div>
  );
}