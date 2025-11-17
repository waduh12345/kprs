"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Zap,
  Loader2,
  CheckCircle,
  AlertTriangle,
  List,
  Target,
  GanttChartSquare,
  FileCheck,
  Calendar,
} from "lucide-react";
import Swal from "sweetalert2";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- DUMMY DATA & TYPES ---

interface LogEntry {
  timestamp: string;
  activity: string;
  status: "SUCCESS" | "ERROR" | "REVERTED";
}

const initialLog: LogEntry[] = [
  {
    timestamp: "2025-10-28 15:00:00",
    activity: "Proses Auto Debet Oktober 2025 sukses. Total 650 transaksi diproses.",
    status: "SUCCESS",
  },
  {
    timestamp: "2025-09-28 10:00:00",
    activity: "Proses Auto Debet September 2025 dibatalkan (Revert) karena kesalahan saldo.",
    status: "REVERTED",
  },
];

interface AutoDebetSummary {
    total_simpanan_setoran: number;
    total_tagihan_lain: number;
    total_debet_anggota: number;
    total_rekening_terlibat: number;
}

// Data simulasi hasil unggah file
const DUMMY_SUMMARY: AutoDebetSummary = {
    total_simpanan_setoran: 80000000,
    total_tagihan_lain: 20000000,
    total_debet_anggota: 100000000, // Harus sama dengan Setoran + Tagihan Lain
    total_rekening_terlibat: 500,
};

// --- HELPER FUNCTIONS ---

const formatRupiah = (number: number) => {
  if (isNaN(number) || number === null || number === undefined) return 'Rp 0';
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

const getLogStatusBadge = (status: LogEntry["status"]) => {
  if (status === "SUCCESS") return <Badge variant="success">SUKSES</Badge>;
  if (status === "ERROR") return <Badge variant="destructive">GAGAL</Badge>;
  return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">BATAL</Badge>;
};

// --- KOMPONEN UTAMA ---

export default function ProsesAutoDebetPage() {
  const [bulanTahun, setBulanTahun] = useState("2025-11"); // YYYY-MM
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [logData, setLogData] = useState<LogEntry[]>(initialLog);
  
  // Validasi: Total Debet Anggota harus sama dengan total Setoran + Tagihan Lain
  const isSummaryValid = useMemo(() => (
    DUMMY_SUMMARY.total_debet_anggota === DUMMY_SUMMARY.total_simpanan_setoran + DUMMY_SUMMARY.total_tagihan_lain
  ), []);

  // --- HANDLER EKSEKUSI AUTO DEBET ---
  const handleRunAutoDebet = async () => {
    if (isProcessed || isProcessing || !isSummaryValid) return;

    const { isConfirmed } = await Swal.fire({
      title: "Konfirmasi Proses Auto Debet",
      html: `
        Anda akan menjalankan **Auto Debet Massal** untuk periode: 
        <div class="mt-2 text-xl font-bold text-primary">${bulanTahun}</div>
        <p class="mt-2 text-red-600 font-semibold">Ini akan memproses ${DUMMY_SUMMARY.total_rekening_terlibat} transaksi dan mendebet total ${formatRupiah(DUMMY_SUMMARY.total_debet_anggota)}.</p>
      `,
      icon: "error",
      showCancelButton: true,
      confirmButtonText: "Jalankan Auto Debet Sekarang",
    });

    if (!isConfirmed) return;

    setIsProcessing(true);
    
    // Simulasi pemrosesan API
    setTimeout(() => {
      const newTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newLogEntry: LogEntry = {
        timestamp: newTimestamp,
        activity: `Proses Auto Debet ${bulanTahun} berhasil. ${DUMMY_SUMMARY.total_rekening_terlibat} transaksi sukses diproses.`,
        status: "SUCCESS",
      };

      setLogData((prev) => [newLogEntry, ...prev]);
      setIsProcessing(false);
      setIsProcessed(true);

      Swal.fire({
        icon: "success",
        title: "Proses Auto Debet Selesai!",
        text: `Pembukuan telah berhasil dilakukan untuk ${bulanTahun}.`,
      });
      
    }, 5000); 
  };
  
  // --- HANDLER REVERT (MEMBATALKAN) ---
  const handleRevert = async () => {
    // Hanya bisa revert jika sudah pernah diproses dan belum dibatalkan
    if (!isProcessed) return;

    const { isConfirmed } = await Swal.fire({
        title: "Konfirmasi Pembatalan (Revert) Transaksi",
        html: `
          <p class="text-red-600 font-semibold">PERINGATAN! Anda akan membatalkan semua transaksi Auto Debet untuk periode ${bulanTahun}.</p>
          <p class="mt-2 text-sm">Semua jurnal yang terbentuk akan dibalik (reversal).</p>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Batalkan Transaksi",
    });
    
    if (!isConfirmed) return;

    setIsProcessing(true);
    
    setTimeout(() => {
        const newTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const newLogEntry: LogEntry = {
          timestamp: newTimestamp,
          activity: `Proses Auto Debet ${bulanTahun} berhasil dibatalkan (Revert). Jurnal telah dibalik.`,
          status: "REVERTED",
        };
  
        setLogData((prev) => [newLogEntry, ...prev]);
        setIsProcessing(false);
        setIsProcessed(false);
  
        Swal.fire({
          icon: "info",
          title: "Pembatalan Berhasil!",
          text: `Transaksi Auto Debet ${bulanTahun} telah dibatalkan.`,
        });
    }, 3000);
  };


  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <GanttChartSquare className="h-6 w-6 text-primary" />
        Proses Auto Debet Massal (Setoran & Tagihan)
      </h2>
      <p className="text-gray-600">Eksekusi pembukuan massal dari data setoran simpanan dan tagihan yang telah diunggah.</p>

      {/* --- KARTU KONTROL & SUMMARY --- */}
      <Card className="border-t-4 border-indigo-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-indigo-600">
            <Calendar className="h-5 w-5" /> Periode & Ringkasan Data
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-4 items-end">
          <div className="col-span-1 space-y-2">
            <Label htmlFor="periode">Periode Proses</Label>
            <Select onValueChange={setBulanTahun} value={bulanTahun} disabled={isProcessing}>
                <SelectTrigger id="periode">
                    <SelectValue placeholder="Pilih Bulan/Tahun" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="2025-11">November 2025 (Data Baru)</SelectItem>
                    <SelectItem value="2025-10">Oktober 2025 (Sudah Sukses)</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="col-span-3">
              <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-blue-50 border rounded-lg">
                      <p className="text-sm text-gray-500">Total Nominal Setoran Simpanan</p>
                      <p className="font-bold text-lg text-blue-700">{formatRupiah(DUMMY_SUMMARY.total_simpanan_setoran)}</p>
                  </div>
                  <div className="p-3 bg-red-50 border rounded-lg">
                      <p className="text-sm text-gray-500">Total Nominal Tagihan Lain</p>
                      <p className="font-bold text-lg text-red-700">{formatRupiah(DUMMY_SUMMARY.total_tagihan_lain)}</p>
                  </div>
                  <div className="p-3 bg-green-50 border rounded-lg">
                      <p className="text-sm text-gray-500">TOTAL DEBET ANGGOTA</p>
                      <p className="font-extrabold text-xl text-green-700">{formatRupiah(DUMMY_SUMMARY.total_debet_anggota)}</p>
                  </div>
              </div>
          </div>
        </CardContent>
      </Card>

      {/* --- KARTU VALIDASI & EKSEKUSI --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileCheck className="h-5 w-5" /> Validasi dan Eksekusi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-3 border rounded-md flex justify-between items-center">
            <span className="font-medium">Status Kesiapan Data</span>
            {isSummaryValid ? (
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4"/> Data Siap Diproses
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4"/> Error: Nominal tidak sinkron
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-4">
            <Button
                onClick={handleRevert}
                disabled={isProcessing || !isProcessed}
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
            >
                <AlertTriangle className="mr-2 h-5 w-5" />
                Batalkan (Revert) Transaksi
            </Button>
            <Button
                onClick={handleRunAutoDebet}
                disabled={isProcessing || isProcessed || !isSummaryValid}
                className={`text-lg h-10 ${isProcessed ? 'bg-gray-400' : 'bg-primary hover:bg-indigo-700'}`}
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Mencatat Transaksi Massal...
                    </>
                ) : (
                    <>
                        <Zap className="mr-2 h-5 w-5" />
                        {isProcessed ? 'SUDAH DIPROSES' : 'Proses Auto Debet Sekarang'}
                    </>
                )}
            </Button>
        </CardFooter>
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
                <th className="px-4 py-3 w-1/4">Waktu Eksekusi</th>
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
                    {log.status === "SUCCESS" && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {log.status === "ERROR" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    {log.status === "REVERTED" && <Zap className="h-4 w-4 text-yellow-500" />}
                    {getLogStatusBadge(log.status)}
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