"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Banknote,
  Upload,
  Download,
  Calendar,
  Zap,
  Loader2,
  CheckCircle,
  AlertTriangle,
  List,
  Users,
} from "lucide-react";
import Swal from "sweetalert2";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- DUMMY DATA & TYPES ---

interface BankPayroll {
    id: string;
    name: string;
}

const dummyBanks: BankPayroll[] = [
    { id: "BCA", name: "Bank BCA" },
    { id: "BRI", name: "Bank BRI" },
    { id: "MANDIRI", name: "Bank Mandiri" },
];

interface TagihanSummary {
    bank_id: string;
    total_anggota: number;
    total_tagihan: number;
    file_name: string;
}

const initialLog: LogEntry[] = [
  {
    timestamp: "2025-11-10 10:00:00",
    activity: "Generate tagihan Bank Mandiri periode 2025-12 selesai. 350 anggota.",
    status: "SUCCESS",
  },
  {
    timestamp: "2025-11-08 14:30:00",
    activity: "Pengiriman tagihan Bank BCA periode 2025-12.",
    status: "INFO",
  },
  {
    timestamp: "2025-10-10 09:00:00",
    activity: "Generate tagihan Bank BRI periode 2025-11 gagal: Data pinjaman kosong.",
    status: "ERROR",
  },
];

interface LogEntry {
  timestamp: string;
  activity: string;
  status: "SUCCESS" | "ERROR" | "INFO";
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

export default function TagihanBankPayrollPage() {
  const nextMonth = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().substring(0, 7);
  }, []);

  const [periode, setPeriode] = useState(nextMonth);
  const [selectedBankId, setSelectedBankId] = useState<string>("BCA");
  const [isGenerating, setIsGenerating] = useState(false);
  const [logData, setLogData] = useState<LogEntry[]>(initialLog);
  const [tagihanSummary, setTagihanSummary] = useState<TagihanSummary | null>(null);

  const selectedBankName = useMemo(() => dummyBanks.find(b => b.id === selectedBankId)?.name, [selectedBankId]);


  // --- HANDLER GENERATE FILE TAGIHAN ---
  const handleGenerateTagihan = async () => {
    if (isGenerating) return;

    const { isConfirmed } = await Swal.fire({
      title: "Konfirmasi Generate Tagihan Payroll",
      html: `
        Anda akan membuat file tagihan untuk: 
        <div class="mt-2 text-xl font-bold text-primary">${selectedBankName} - ${periode}</div>
        <p class="mt-2 text-sm text-red-600">Proses ini menghitung semua tagihan (simpanan & pembiayaan) yang jatuh tempo pada periode tersebut.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hitung & Generate",
    });

    if (!isConfirmed) return;

    setIsGenerating(true);
    
    // Simulasi pemanggilan API Generate
    setTimeout(() => {
      const newTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newTotal = Math.floor(Math.random() * 500000000) + 100000000;
      const newCount = Math.floor(Math.random() * 200) + 100;

      const summary: TagihanSummary = {
        bank_id: selectedBankId,
        total_anggota: newCount,
        total_tagihan: newTotal,
        file_name: `TAGIHAN_${selectedBankId}_${periode}.xlsx`,
      };
      
      const newLogEntry: LogEntry = {
        timestamp: newTimestamp,
        activity: `Generate file tagihan ${selectedBankName} periode ${periode} selesai. Total ${newCount} anggota.`,
        status: "SUCCESS",
      };

      setLogData((prev) => [newLogEntry, ...prev]);
      setTagihanSummary(summary);
      setIsGenerating(false);

      Swal.fire({
        icon: "success",
        title: "Generate Berhasil",
        html: `File tagihan untuk ${selectedBankName} (${periode}) telah dibuat. Total tagihan: <b>${formatRupiah(newTotal)}</b>.`,
      });
      
    }, 3000); 
  };
  
  // --- HANDLER DOWNLOAD FILE ---
  const handleDownloadFile = () => {
    if (!tagihanSummary) return;
    
    // Simulasi aksi unduh
    Swal.fire({
        icon: 'success',
        title: 'File Siap Diunduh',
        text: `File ${tagihanSummary.file_name} sedang dipersiapkan. (Simulasi unduhan file)`,
        confirmButtonText: 'Oke',
    });

    const newTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newLogEntry: LogEntry = {
        timestamp: newTimestamp,
        activity: `File tagihan ${tagihanSummary.file_name} diunduh dan siap dikirim ke bank.`,
        status: "INFO",
    };
    setLogData((prev) => [newLogEntry, ...prev]);
  };


  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Banknote className="h-6 w-6 text-primary" />
        Proses Tagihan ke Bank Payroll
      </h2>

      {/* --- KARTU GENERATE FILE TAGIHAN --- */}
      <Card className="border-t-4 border-indigo-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-indigo-600">
            <Download className="h-5 w-5" /> Kontrol Generate File
          </CardTitle>
          <p className="text-sm text-gray-500">
            Pilih periode dan Bank untuk membuat file tagihan pemotongan gaji massal.
          </p>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="periode">Periode Tagihan</Label>
            <Input
              id="periode"
              type="month"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              disabled={isGenerating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank">Pilih Bank Payroll</Label>
            <Select onValueChange={setSelectedBankId} value={selectedBankId}>
              <SelectTrigger id="bank">
                <SelectValue placeholder="Pilih Bank" />
              </SelectTrigger>
              <SelectContent>
                {dummyBanks.map((bank) => (
                  <SelectItem key={bank.id} value={bank.id}>
                    {bank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Button
              onClick={handleGenerateTagihan}
              disabled={isGenerating}
              className="w-full text-md bg-indigo-600 hover:bg-indigo-700 h-10"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Menghitung & Membuat File...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-5 w-5" />
                  Proses Tagihan Payroll
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- KARTU HASIL GENERATE --- */}
      {tagihanSummary && (
        <Card className="border-t-4 border-green-500">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-green-600">
                    <CheckCircle className="h-5 w-5" /> File Siap Diunduh
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 pb-4 mb-4 border-b">
                    <div>
                        <p className="text-sm text-gray-500">Bank Tujuan</p>
                        <p className="font-bold text-lg">{selectedBankName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Periode Tagihan</p>
                        <p className="font-bold text-lg">{periode}</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Total Nominal Tagihan</p>
                        <p className="text-2xl font-bold text-primary">{formatRupiah(tagihanSummary.total_tagihan)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total Anggota</p>
                        <p className="text-2xl font-bold flex items-center gap-1"><Users className="h-5 w-5" /> {tagihanSummary.total_anggota}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Nama File</p>
                        <p className="font-semibold text-sm break-all">{tagihanSummary.file_name}</p>
                    </div>
                </div>
                
                <Button 
                    onClick={handleDownloadFile}
                    className="mt-6 w-full bg-green-600 hover:bg-green-700"
                >
                    <Download className="mr-2 h-5 w-5" /> Unduh File Tagihan
                </Button>
            </CardContent>
        </Card>
      )}


      <Separator />

      {/* --- LOG RIWAYAT PROSES --- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <List className="h-5 w-5" />
            Riwayat Log Pengiriman Tagihan
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