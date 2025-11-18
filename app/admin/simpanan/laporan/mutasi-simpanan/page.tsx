"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  FileText,
  Calendar,
  FileDown,
  BarChart2,
  ListChecks,
  Search,
  ListFilter,
  Coins,
} from "lucide-react";
import Swal from "sweetalert2";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// --- DUMMY DATA & TYPES ---

interface MutasiSimpanan {
  tanggal: string;
  no_rekening: string;
  anggota_name: string;
  no_bukti: string;
  keterangan: string;
  tipe_transaksi: "Setoran" | "Penarikan" | "Bunga" | "Koreksi";
  debet_nominal: number; // Penarikan/Pengurangan Saldo
  kredit_nominal: number; // Setoran/Penambahan Saldo
}

// Data Mutasi Simpanan Dummy
const dummyMutasiData: MutasiSimpanan[] = [
  // Rekening 1: SWJ-001
  {
    tanggal: "2025-11-01",
    no_rekening: "SWJ-001",
    anggota_name: "Budi Santoso",
    no_bukti: "TRX-D001",
    keterangan: "Setoran tunai",
    tipe_transaksi: "Setoran",
    debet_nominal: 0,
    kredit_nominal: 500000,
  },
  {
    tanggal: "2025-11-10",
    no_rekening: "SWJ-001",
    anggota_name: "Budi Santoso",
    no_bukti: "TRX-W001",
    keterangan: "Penarikan via ATM",
    tipe_transaksi: "Penarikan",
    debet_nominal: 200000,
    kredit_nominal: 0,
  },
  // Rekening 2: WJB-002
  {
    tanggal: "2025-11-15",
    no_rekening: "WJB-002",
    anggota_name: "Siti Rahayu",
    no_bukti: "TRX-AUT001",
    keterangan: "Setoran wajib (Auto Debet)",
    tipe_transaksi: "Setoran",
    debet_nominal: 0,
    kredit_nominal: 100000,
  },
  {
    tanggal: "2025-11-30",
    no_rekening: "WJB-002",
    anggota_name: "Siti Rahayu",
    no_bukti: "TRX-BUNGA",
    keterangan: "Pembukuan Bunga Simpanan",
    tipe_transaksi: "Bunga",
    debet_nominal: 0,
    kredit_nominal: 50000,
  },
  {
    tanggal: "2025-10-31",
    no_rekening: "SWJ-001",
    anggota_name: "Budi Santoso",
    no_bukti: "TRX-KOR001",
    keterangan: "Koreksi salah posting",
    tipe_transaksi: "Koreksi",
    debet_nominal: 10000,
    kredit_nominal: 0,
  },
];

// --- HELPER FUNCTIONS ---

const formatRupiah = (number: number) => {
  if (isNaN(number) || number === null || number === undefined) return '0';
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

const getStatusBadge = (tipe: MutasiSimpanan["tipe_transaksi"]) => {
  if (tipe === "Setoran") return <Badge variant="success">SETORAN</Badge>;
  if (tipe === "Penarikan") return <Badge variant="destructive">PENARIKAN</Badge>;
  if (tipe === "Bunga") return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">BUNGA</Badge>;
  return <Badge variant="secondary">KOREKSI</Badge>;
}

// --- KOMPONEN UTAMA ---

export default function LaporanMutasiSimpananPage() {
  const today = new Date().toISOString().substring(0, 10);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
  
  const [startDate, setStartDate] = useState(startOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [query, setQuery] = useState("");
  const [tipeFilter, setTipeFilter] = useState("all");

  // --- FILTERING ---
  const filteredMutasi = useMemo(() => {
    let arr = dummyMutasiData;

    // 1. Filter Tanggal
    arr = arr.filter(
      (it) => it.tanggal >= startDate && it.tanggal <= endDate
    );

    // 2. Filter Tipe Transaksi
    if (tipeFilter !== "all") {
      arr = arr.filter((it) => it.tipe_transaksi === tipeFilter);
    }

    // 3. Filter Query Pencarian
    if (!query.trim()) return arr;
    const q = query.toLowerCase();
    return arr.filter((it) =>
      [it.anggota_name, it.no_rekening, it.keterangan].some(
        (f) => f?.toLowerCase?.().includes?.(q)
      )
    );
  }, [dummyMutasiData, query, startDate, endDate, tipeFilter]);

  // --- SUMMARY ---
  const summary = useMemo(() => {
    const totalDebet = filteredMutasi.reduce((sum, item) => sum + item.debet_nominal, 0);
    const totalKredit = filteredMutasi.reduce((sum, item) => sum + item.kredit_nominal, 0);
    return { totalDebet, totalKredit, totalTransaksi: filteredMutasi.length };
  }, [filteredMutasi]);

  // --- HANDLER EXPORT ---
  const handleExportExcel = () => {
    Swal.fire({
      icon: "info",
      title: "Export Laporan Mutasi",
      text: `Mengekspor data Mutasi Simpanan dari ${startDate} hingga ${endDate}. (Simulasi)`,
      confirmButtonText: "Oke",
    });
  };
  
  // --- RENDERING TABEL MUTASI ---
  const renderMutasiTable = (data: MutasiSimpanan[]) => {
    // Di laporan Mutasi (Bank Statement style), Saldo Akhir biasanya tidak dihitung
    // per baris di tabel utama, tetapi di Laporan Buku Besar. Namun, kita tambahkan
    // ringkasan total.

    return (
      <div className="p-0 overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-muted text-left">
            <tr>
              <th className="px-4 py-3 w-[100px]">Tanggal</th>
              <th className="px-4 py-3 w-[150px]">No. Rekening</th>
              <th className="px-4 py-3 w-[150px]">Tipe Transaksi</th>
              <th className="px-4 py-3">Anggota & Keterangan</th>
              <th className="px-4 py-3 text-right w-[150px]">Debet (Penarikan)</th>
              <th className="px-4 py-3 text-right w-[150px]">Kredit (Setoran)</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-4">
                    Tidak ada transaksi mutasi yang ditemukan untuk filter yang dipilih.
                  </td>
                </tr>
            ) : (
                data.map((item, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-gray-600">{item.tanggal}</td>
                        <td className="px-4 py-2 font-medium">{item.no_rekening}</td>
                        <td className="px-4 py-2">
                            {getStatusBadge(item.tipe_transaksi)}
                        </td>
                        <td className="px-4 py-2">
                            <span className="font-semibold">{item.anggota_name}</span><br/>
                            <span className="text-xs italic text-gray-600">{item.keterangan}</span>
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-red-600">
                            {formatRupiah(item.debet_nominal)}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-green-600">
                            {formatRupiah(item.kredit_nominal)}
                        </td>
                    </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" />
        Laporan Mutasi Simpanan
      </h2>

      {/* --- KARTU KONTROL FILTER --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-indigo-600">
            <Calendar className="h-5 w-5" /> Kontrol Laporan
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
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
          <div className="space-y-2 col-span-1">
            <Label htmlFor="tipe_filter">Tipe Transaksi</Label>
            <Select onValueChange={setTipeFilter} value={tipeFilter}>
                <SelectTrigger id="tipe_filter">
                    <SelectValue placeholder="Pilih Tipe" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="Setoran">Setoran</SelectItem>
                    <SelectItem value="Penarikan">Penarikan</SelectItem>
                    <SelectItem value="Bunga">Bunga</SelectItem>
                    <SelectItem value="Koreksi">Koreksi</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="search_query">Cari Rekening / Anggota</Label>
            <Input
              id="search_query"
              placeholder="No. Rekening, Nama Anggota, atau Keterangan"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* --- SUMMARY MUTASI --- */}
      <Card className="bg-muted p-4">
        <div className="flex justify-between items-center">
            <div className="grid grid-cols-3 gap-6 font-semibold">
                <div className="text-red-700">
                    <p className="text-sm text-gray-600">Total Mutasi Debet (Penarikan)</p>
                    <p className="text-xl">{formatRupiah(summary.totalDebet)}</p>
                </div>
                <div className="text-green-700">
                    <p className="text-sm text-gray-600">Total Mutasi Kredit (Setoran/Bunga)</p>
                    <p className="text-xl">{formatRupiah(summary.totalKredit)}</p>
                </div>
                <div className="">
                    <p className="text-sm text-gray-600">Jumlah Transaksi</p>
                    <p className="text-xl font-bold">{summary.totalTransaksi} Transaksi</p>
                </div>
            </div>
            <Button
                onClick={handleExportExcel}
                className="bg-red-600 hover:bg-red-700"
            >
                <FileDown className="mr-2 h-4 w-4" />
                Export Mutasi
            </Button>
        </div>
      </Card>

      {/* --- TABEL MUTASI SIMPANAN --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ListChecks className="h-5 w-5" /> Detail Transaksi Simpanan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {renderMutasiTable(filteredMutasi)}
        </CardContent>
      </Card>
      
      <p className="text-xs text-gray-500 mt-4">
        *Laporan ini menyajikan semua transaksi simpanan secara kronologis dalam periode yang dipilih.
      </p>
    </div>
  );
}