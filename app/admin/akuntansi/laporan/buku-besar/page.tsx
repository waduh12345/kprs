"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Calendar,
  FileDown,
  BookOpen,
  ListChecks,
  ChevronDown,
  ChevronUp,
  Search,
  Zap,
} from "lucide-react";
import Swal from "sweetalert2";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// --- DUMMY DATA & TYPES ---

interface BukuBesarMutasi {
  tanggal: string;
  no_bukti: string;
  deskripsi_jurnal: string;
  debet: number;
  kredit: number;
}

// Data Akun Pilihan Dummy
const dummyCoaOptions = [
    { kode: "111001", nama: "Kas di Tangan" },
    { kode: "112001", nama: "Bank Operasional" },
    { kode: "121001", nama: "Piutang Anggota" },
    { kode: "410001", nama: "Pendapatan Jasa" },
    { kode: "621002", nama: "Beban ATK" },
];

// Data Mutasi Buku Besar (untuk akun "112001 - Bank Operasional")
const dummyMutasiData: BukuBesarMutasi[] = [
  { tanggal: "2025-11-01", no_bukti: "SALDO-AWAL", deskripsi_jurnal: "Saldo Awal Periode", debet: 0, kredit: 0 },
  { tanggal: "2025-11-16", no_bukti: "JRN-20251116-001", deskripsi_jurnal: "Realisasi pinjaman PNJ-005", debet: 0, kredit: 15000000 },
  { tanggal: "2025-11-17", no_bukti: "JRN-20251117-002", deskripsi_jurnal: "Pembelian ATK bulan ini (Jurnal Manual)", debet: 0, kredit: 850000 },
  { tanggal: "2025-11-20", no_bukti: "JRN-20251120-003", deskripsi_jurnal: "Transfer dana dari Bank Lain", debet: 50000000, kredit: 0 },
  { tanggal: "2025-11-25", no_bukti: "JRN-20251125-004", deskripsi_jurnal: "Pembayaran Utang Bank", debet: 0, kredit: 10000000 },
];

// Saldo Awal Akun "112001"
const SALDO_AWAL_BANK = 120000000;
const POSISI_NORMAL_DEBET = true; // Akun Aset memiliki posisi normal Debet

// --- HELPER FUNCTIONS ---

const formatRupiah = (number: number) => {
  if (isNaN(number) || number === null || number === undefined) return '0';
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Math.abs(number));
};

// --- KOMPONEN UTAMA ---

export default function LaporanBukuBesarPage() {
  const today = new Date().toISOString().substring(0, 10);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
  
  const [startDate, setStartDate] = useState(startOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [selectedCoa, setSelectedCoa] = useState("112001"); // Default: Bank Operasional

  // --- LOGIKA PERHITUNGAN SALDO ---
  const { totalDebet, totalKredit, saldoAkhir } = useMemo(() => {
    // 1. Hitung total Mutasi selama periode
    const debet = dummyMutasiData.reduce((sum, item) => sum + item.debet, 0);
    const kredit = dummyMutasiData.reduce((sum, item) => sum + item.kredit, 0);

    // 2. Hitung Saldo Akhir
    let saldoAkhir: number;
    if (POSISI_NORMAL_DEBET) {
      // (Saldo Awal + Total Debet) - Total Kredit
      saldoAkhir = SALDO_AWAL_BANK + debet - kredit;
    } else {
      // (Saldo Awal + Total Kredit) - Total Debet
      saldoAkhir = SALDO_AWAL_BANK + kredit - debet;
    }
    
    return {
      totalDebet: debet,
      totalKredit: kredit,
      saldoAkhir,
    };
  }, [dummyMutasiData]);

  // --- HANDLER EXPORT ---
  const handleExportExcel = () => {
    const coaName = dummyCoaOptions.find(c => c.kode === selectedCoa)?.nama || selectedCoa;
    Swal.fire({
      icon: "info",
      title: "Export Buku Besar",
      text: `Mengekspor Buku Besar Akun ${coaName} dari ${startDate} hingga ${endDate}. (Simulasi)`,
      confirmButtonText: "Oke",
    });
  };
  
  // --- RENDERING TABEL MUTASI ---
  const renderMutasiTable = (data: BukuBesarMutasi[]) => {
    let saldoBerjalan = SALDO_AWAL_BANK;

    return (
      <div className="p-0 overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-primary text-white text-left">
            <tr>
              <th className="px-4 py-3 w-[100px]">Tgl</th>
              <th className="px-4 py-3 w-[150px]">No. Bukti</th>
              <th className="px-4 py-3">Keterangan</th>
              <th className="px-4 py-3 text-right w-[150px]">Debet</th>
              <th className="px-4 py-3 text-right w-[150px]">Kredit</th>
              <th className="px-4 py-3 text-right w-[180px]">Saldo Akhir</th>
            </tr>
          </thead>
          <tbody>
            {data.map((mutasi, index) => {
              if (mutasi.no_bukti === "SALDO-AWAL") {
                return (
                  <tr key={index} className="bg-yellow-50 font-bold border-b border-dashed border-yellow-300">
                    <td colSpan={5} className="px-4 py-2 text-left italic">
                      {mutasi.deskripsi_jurnal}
                    </td>
                    <td className={`px-4 py-2 text-right text-lg ${saldoBerjalan < 0 ? 'text-red-600' : 'text-primary'}`}>
                      {formatRupiah(SALDO_AWAL_BANK)}
                    </td>
                  </tr>
                );
              }
              
              // Hitung saldo berjalan
              if (POSISI_NORMAL_DEBET) {
                  saldoBerjalan = saldoBerjalan + mutasi.debet - mutasi.kredit;
              } else {
                  saldoBerjalan = saldoBerjalan - mutasi.debet + mutasi.kredit;
              }
              
              const isDebet = mutasi.debet > 0;
              
              return (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap">{mutasi.tanggal}</td>
                  <td className="px-4 py-2 font-mono text-xs">{mutasi.no_bukti}</td>
                  <td className="px-4 py-2 text-gray-700">{mutasi.deskripsi_jurnal}</td>
                  <td className="px-4 py-2 text-right text-red-600">{formatRupiah(mutasi.debet)}</td>
                  <td className="px-4 py-2 text-right text-green-600">{formatRupiah(mutasi.kredit)}</td>
                  <td className={`px-4 py-2 text-right font-bold ${saldoBerjalan < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                    {formatRupiah(saldoBerjalan)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <BookOpen className="h-6 w-6 text-primary" />
        Laporan Buku Besar (Detail Akun)
      </h2>

      {/* --- KARTU KONTROL FILTER --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-indigo-600">
            <ListChecks className="h-5 w-5" /> Filter Akun dan Periode
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="select_coa">Pilih Akun (COA)</Label>
            <Select value={selectedCoa} onValueChange={setSelectedCoa}>
              <SelectTrigger id="select_coa" className="w-full">
                <SelectValue placeholder="Pilih Akun..." />
              </SelectTrigger>
              <SelectContent>
                {dummyCoaOptions.map(coa => (
                    <SelectItem key={coa.kode} value={coa.kode}>
                        {coa.kode} - {coa.nama}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 col-span-1">
            <Label htmlFor="start_date">Tanggal Awal</Label>
            <Input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2 col-span-1">
            <Label htmlFor="end_date">Tanggal Akhir</Label>
            <Input
              id="end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Button
            onClick={() => {}}
            className="bg-primary hover:bg-indigo-700 w-full h-10"
            disabled={true} // Non-fungsional di demo
          >
            <Search className="h-4 w-4 mr-2"/>
            Tampilkan
          </Button>
        </CardContent>
        <CardFooter className="pt-4 flex justify-between items-center bg-gray-50 border-t">
            <div className="flex items-center gap-4">
                <span className="font-semibold">Posisi Normal:</span>
                <span className="font-bold text-primary">{POSISI_NORMAL_DEBET ? 'DEBET' : 'KREDIT'}</span>
            </div>
          <Button
            onClick={handleExportExcel}
            className="bg-red-600 hover:bg-red-700"
          >
            <FileDown className="mr-2 h-4 w-4" /> Export ke Excel
          </Button>
        </CardFooter>
      </Card>

      {/* --- REKAPITULASI DAN SALDO --- */}
      <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                <Zap className="h-5 w-5" /> Rekapitulasi Mutasi Akun
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-6 text-center">
              <div className="p-3 border rounded-lg bg-yellow-50">
                  <span className="text-md font-semibold text-yellow-800 block">Saldo Awal</span>
                  <span className="text-2xl font-extrabold text-yellow-900">{formatRupiah(SALDO_AWAL_BANK)}</span>
              </div>
              <div className="p-3 border rounded-lg bg-red-50">
                  <span className="text-md font-semibold text-red-800 block">Total Debet Mutasi</span>
                  <span className="text-2xl font-extrabold text-red-900">{formatRupiah(totalDebet)}</span>
              </div>
              <div className="p-3 border rounded-lg bg-green-50">
                  <span className="text-md font-semibold text-green-800 block">Total Kredit Mutasi</span>
                  <span className="text-2xl font-extrabold text-green-900">{formatRupiah(totalKredit)}</span>
              </div>
          </CardContent>
          <CardFooter className={`p-4 font-extrabold text-2xl justify-center ${saldoAkhir < 0 ? 'bg-red-100' : 'bg-primary text-white'}`}>
              <span className="mr-4">SALDO AKHIR AKUN</span>
              <span className="text-3xl">{formatRupiah(saldoAkhir)}</span>
          </CardFooter>
      </Card>
      
      {/* --- TABEL MUTASI BUKU BESAR --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ListChecks className="h-5 w-5" /> Mutasi Transaksi ({dummyCoaOptions.find(c => c.kode === selectedCoa)?.nama || ''})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {renderMutasiTable(dummyMutasiData)}
        </CardContent>
      </Card>
      
      <p className="text-xs text-gray-500 mt-4">
        *Laporan ini menyajikan detail kronologis semua mutasi Debet/Kredit yang mempengaruhi akun yang dipilih, termasuk perhitungan saldo berjalan.
      </p>
    </div>
  );
}