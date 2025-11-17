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
  Link,
  Zap,
  CheckCircle,
  AlertTriangle,
  Search,
  Users,
  Badge,
} from "lucide-react";
import Swal from "sweetalert2";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- DUMMY DATA & TYPES ---

interface TransaksiRekon {
  tanggal: string;
  no_bukti: string;
  keterangan: string;
  nominal_akun_a: number; // Saldo/Mutasi di Akun A
  nominal_akun_b: number; // Saldo/Mutasi di Akun B
  status: "MATCH" | "UNMATCH_A" | "UNMATCH_B"; // Status kecocokan
}

// Data Akun Pilihan Dummy
const dummyCoaOptions = [
    { kode: "112001", nama: "Bank Operasional" },
    { kode: "211001", nama: "Utang Bank" },
    { kode: "131001", nama: "Piutang ke Unit Anak" },
    { kode: "231001", nama: "Utang dari Unit Anak" },
];

// Data Transaksi Rekonsiliasi (Simulasi rekonsiliasi Piutang vs Utang Antar Unit)
const dummyRekonData: TransaksiRekon[] = [
  { tanggal: "2025-11-01", no_bukti: "TRX-001", keterangan: "Transfer Jasa Manajemen", nominal_akun_a: 5000000, nominal_akun_b: 5000000, status: "MATCH" },
  { tanggal: "2025-11-05", no_bukti: "TRX-002", keterangan: "Pembelian Inventaris Kredit", nominal_akun_a: 10000000, nominal_akun_b: 10000000, status: "MATCH" },
  { tanggal: "2025-11-10", no_bukti: "TRX-003", keterangan: "Koreksi Saldo Bulan Lalu", nominal_akun_a: 2000000, nominal_akun_b: 0, status: "UNMATCH_A" }, // Hanya tercatat di Akun A
  { tanggal: "2025-11-15", no_bukti: "TRX-004", keterangan: "Biaya Operasional Bersama", nominal_akun_a: 1500000, nominal_akun_b: 1500000, status: "MATCH" },
  { tanggal: "2025-11-17", no_bukti: "TRX-005", keterangan: "Utang Belum Dikonfirmasi", nominal_akun_a: 0, nominal_akun_b: 3000000, status: "UNMATCH_B" }, // Hanya tercatat di Akun B
];

// Saldo Awal Fiktif untuk Akun A dan B
const SALDO_AWAL_A = 50000000;
const SALDO_AWAL_B = 53000000;


// --- HELPER FUNCTIONS ---

const formatRupiah = (number: number) => {
  if (isNaN(number) || number === null || number === undefined) return '0';
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

// --- KOMPONEN UTAMA ---

export default function LaporanRekonsiliasiAntarRekeningPage() {
  const today = new Date().toISOString().substring(0, 10);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
  
  const [startDate, setStartDate] = useState(startOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [coaA, setCoaA] = useState("131001"); // Piutang ke Unit Anak (Entitas Induk)
  const [coaB, setCoaB] = useState("231001"); // Utang dari Unit Anak (Entitas Anak)

  // --- LOGIKA PERHITUNGAN SALDO REKON ---
  const { totalMutasiA, totalMutasiB, saldoAkhirA, saldoAkhirB, totalSelisih } = useMemo(() => {
    // Total Mutasi
    const mutasiA = dummyRekonData.reduce((sum, item) => sum + item.nominal_akun_a, 0);
    const mutasiB = dummyRekonData.reduce((sum, item) => sum + item.nominal_akun_b, 0);

    // Saldo Akhir
    const saldoAkhirA = SALDO_AWAL_A + mutasiA;
    const saldoAkhirB = SALDO_AWAL_B + mutasiB;

    // Selisih Akhir (Idealnya 0)
    const totalSelisih = saldoAkhirA - saldoAkhirB;
    
    return {
      totalMutasiA: mutasiA,
      totalMutasiB: mutasiB,
      saldoAkhirA,
      saldoAkhirB,
      totalSelisih,
    };
  }, [dummyRekonData]);

  // --- DAFTAR SELISIH (Unmatch Items) ---
  const unmatchedTransactions = useMemo(() => {
    return dummyRekonData.filter(item => item.status !== "MATCH");
  }, [dummyRekonData]);
  
  const coaAName = dummyCoaOptions.find(c => c.kode === coaA)?.nama || coaA;
  const coaBName = dummyCoaOptions.find(c => c.kode === coaB)?.nama || coaB;

  // --- HANDLER EXPORT ---
  const handleExportExcel = () => {
    Swal.fire({
      icon: "info",
      title: "Export Laporan Rekonsiliasi",
      text: `Mengekspor Laporan Rekonsiliasi antara ${coaA} dan ${coaB}. (Simulasi)`,
      confirmButtonText: "Oke",
    });
  };
  
  // --- RENDERING TABEL SELISIH ---
  const renderSelisihTable = (data: TransaksiRekon[]) => {
    if (data.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500">
                Semua transaksi cocok (MATCH) dalam periode ini. Selisih nihil.
            </div>
        );
    }
    
    return (
      <div className="p-0 overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-red-50 text-red-700 text-left">
            <tr>
              <th className="px-4 py-3 w-[100px]">Tanggal</th>
              <th className="px-4 py-3 w-[150px]">No. Bukti</th>
              <th className="px-4 py-3">Keterangan</th>
              <th className="px-4 py-3 text-right w-[150px]">{coaAName}</th>
              <th className="px-4 py-3 text-right w-[150px]">{coaBName}</th>
              <th className="px-4 py-3 w-[100px] text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              const isUnmatchA = item.status === 'UNMATCH_A';
              const isUnmatchB = item.status === 'UNMATCH_B';
              
              return (
                <tr key={index} className="border-t hover:bg-red-50/50">
                  <td className="px-4 py-2 whitespace-nowrap">{item.tanggal}</td>
                  <td className="px-4 py-2 font-mono text-xs">{item.no_bukti}</td>
                  <td className="px-4 py-2 text-gray-700">{item.keterangan}</td>
                  <td className={`px-4 py-2 text-right ${isUnmatchA ? 'font-bold text-red-600' : 'text-gray-600'}`}>
                    {formatRupiah(item.nominal_akun_a)}
                  </td>
                  <td className={`px-4 py-2 text-right ${isUnmatchB ? 'font-bold text-red-600' : 'text-gray-600'}`}>
                    {formatRupiah(item.nominal_akun_b)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <Badge variant={isUnmatchA || isUnmatchB ? 'destructive' : 'default'}>
                        {item.status.replace('UNMATCH_', 'SELIH ').replace('MATCH', 'COCOK')}
                    </Badge>
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
        <Link className="h-6 w-6 text-primary" />
        Laporan Rekonsiliasi Antar Rekening
      </h2>
      <p className="text-gray-600">Mencocokkan saldo dan mutasi antara dua akun COA atau dua unit yang saling berhubungan.</p>

      {/* --- KARTU KONTROL FILTER --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-indigo-600">
            <Search className="h-5 w-5" /> Kontrol Rekonsiliasi
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="coa_a">Akun A (Piutang/Debit)</Label>
            <Select value={coaA} onValueChange={setCoaA}>
              <SelectTrigger id="coa_a">
                <SelectValue placeholder="Pilih Akun A..." />
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
          <div className="space-y-2 col-span-2">
            <Label htmlFor="coa_b">Akun B (Utang/Kredit)</Label>
            <Select value={coaB} onValueChange={setCoaB}>
              <SelectTrigger id="coa_b">
                <SelectValue placeholder="Pilih Akun B..." />
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
          <Button
            onClick={() => {}}
            className="bg-primary hover:bg-indigo-700 w-full h-10"
            disabled={true} // Non-fungsional di demo
          >
            <Zap className="h-4 w-4 mr-2"/>
            Proses Cocokkan
          </Button>
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
        </CardContent>
      </Card>

      {/* --- RINGKASAN SALDO REKON --- */}
      <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                <Zap className="h-5 w-5" /> Ringkasan Saldo Akhir
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-6 text-center">
              <div className="p-3 border rounded-lg bg-indigo-50">
                  <span className="text-md font-semibold text-indigo-800 block">Saldo Akhir {coaAName}</span>
                  <span className="text-2xl font-extrabold">{formatRupiah(saldoAkhirA)}</span>
                  <span className="text-xs text-gray-600 block">Saldo Awal: {formatRupiah(SALDO_AWAL_A)}</span>
              </div>
              <div className="p-3 border rounded-lg bg-indigo-50">
                  <span className="text-md font-semibold text-indigo-800 block">Saldo Akhir {coaBName}</span>
                  <span className="text-2xl font-extrabold">{formatRupiah(saldoAkhirB)}</span>
                  <span className="text-xs text-gray-600 block">Saldo Awal: {formatRupiah(SALDO_AWAL_B)}</span>
              </div>
              <div className={`p-3 border rounded-lg ${totalSelisih === 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <span className={`text-md font-semibold block ${totalSelisih === 0 ? 'text-green-800' : 'text-red-800'}`}>Total Selisih Akhir</span>
                  <span className="text-3xl font-extrabold">{formatRupiah(Math.abs(totalSelisih))}</span>
                  {totalSelisih !== 0 && <span className="text-xs text-red-600 font-bold block">TIDAK SEIMBANG</span>}
              </div>
          </CardContent>
          <CardFooter className="pt-4 flex justify-end items-center bg-gray-50 border-t">
              <Button
                onClick={handleExportExcel}
                className="bg-red-600 hover:bg-red-700"
              >
                <FileDown className="mr-2 h-4 w-4" /> Export Selisih
              </Button>
          </CardFooter>
      </Card>
      
      {/* --- TABEL SELISIH / UNMATCHED TRANSACTIONS --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" /> Detail Transaksi Selisih ({unmatchedTransactions.length} Item)
          </CardTitle>
          <p className="text-sm text-gray-500">Transaksi di bawah ini tidak memiliki pasangan atau nilainya berbeda antara kedua akun.</p>
        </CardHeader>
        <CardContent className="p-0">
          {renderSelisihTable(unmatchedTransactions)}
        </CardContent>
      </Card>
      
      <p className="text-xs text-gray-500 mt-4">
        *Selisih harus ditindaklanjuti dengan jurnal koreksi pada akun yang bersangkutan untuk mencapai keseimbangan (MATCH).
      </p>
    </div>
  );
}