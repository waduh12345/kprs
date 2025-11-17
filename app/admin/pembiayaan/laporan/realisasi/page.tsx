"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart2,
  Calendar,
  FileDown,
  Users,
  DollarSign,
  Search,
  CheckCircle,
} from "lucide-react";
import Swal from "sweetalert2";

// --- DUMMY DATA & TYPES ---

interface RealisasiPembiayaan {
  id: string;
  no_kontrak: string;
  anggota_name: string;
  produk: string;
  nominal_disetujui: number;
  nominal_realisasi: number; // Nominal yang benar-benar dicairkan
  tenor: number;
  tgl_realisasi: string;
}

const initialDummyData: RealisasiPembiayaan[] = [
  {
    id: "R001",
    no_kontrak: "PJN/M/005",
    anggota_name: "Ahmad Riyadi",
    produk: "Pembiayaan Mikro",
    nominal_disetujui: 15000000,
    nominal_realisasi: 14850000, // Ada potongan admin 1%
    tenor: 12,
    tgl_realisasi: "2025-11-05",
  },
  {
    id: "R002",
    no_kontrak: "PJN/MG/006",
    anggota_name: "Dewi Kartika",
    produk: "Kredit Multi Guna",
    nominal_disetujui: 45000000,
    nominal_realisasi: 44550000,
    tenor: 6,
    tgl_realisasi: "2025-11-10",
  },
  {
    id: "R003",
    no_kontrak: "PJN/I/007",
    anggota_name: "Gilang Ramadhan",
    produk: "Pembiayaan Investasi",
    nominal_disetujui: 80000000,
    nominal_realisasi: 79200000,
    tenor: 36,
    tgl_realisasi: "2025-10-28", // Bulan sebelumnya
  },
  {
    id: "R004",
    no_kontrak: "PJN/M/008",
    anggota_name: "Hadi Kusuma",
    produk: "Pembiayaan Mikro",
    nominal_disetujui: 10000000,
    nominal_realisasi: 9900000,
    tenor: 18,
    tgl_realisasi: "2025-11-15",
  },
];

// --- HELPER FUNCTIONS ---

const formatRupiah = (number: number) => {
  if (isNaN(number) || number === null || number === undefined) return 'Rp 0';
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

// --- KOMPONEN UTAMA ---

export default function LaporanRealisasiPembiayaanPage() {
  const today = new Date().toISOString().substring(0, 10);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
  
  const [dataRealisasi] = useState<RealisasiPembiayaan[]>(initialDummyData);
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState(startOfMonth);
  const [endDate, setEndDate] = useState(today);

  const filteredList = useMemo(() => {
    let arr = dataRealisasi;

    // 1. Filter Tanggal Realisasi
    arr = arr.filter(
      (it) => it.tgl_realisasi >= startDate && it.tgl_realisasi <= endDate
    );

    // 2. Filter Query Pencarian
    if (!query.trim()) return arr;
    const q = query.toLowerCase();
    return arr.filter((it) =>
      [it.anggota_name, it.no_kontrak, it.produk].some(
        (f) => f?.toLowerCase?.().includes?.(q)
      )
    );
  }, [dataRealisasi, query, startDate, endDate]);

  // --- SUMMARY ---
  const summary = useMemo(() => {
    const totalNominalDisetujui = filteredList.reduce((sum, item) => sum + item.nominal_disetujui, 0);
    const totalNominalCair = filteredList.reduce((sum, item) => sum + item.nominal_realisasi, 0);
    const countRealisasi = filteredList.length;
    
    return { 
        totalNominalDisetujui, 
        totalNominalCair, 
        countRealisasi,
        totalPotongan: totalNominalDisetujui - totalNominalCair
    };
  }, [filteredList]);

  // --- HANDLER EXPORT ---
  const handleExportExcel = () => {
    // Simulasi Export
    Swal.fire({
      icon: "info",
      title: "Export Laporan Realisasi",
      text: `Mengekspor data Realisasi Pembiayaan dari ${startDate} hingga ${endDate}. (Simulasi)`,
      confirmButtonText: "Oke",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <CheckCircle className="h-6 w-6 text-primary" />
        Laporan Realisasi Pembiayaan
      </h2>

      {/* --- KARTU FILTER PERIODE --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-indigo-600">
            <Calendar className="h-5 w-5" /> Filter Periode Realisasi
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="start_date">Tanggal Realisasi Awal</Label>
            <Input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date">Tanggal Realisasi Akhir</Label>
            <Input
              id="end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="search_query">Cari Anggota/Kontrak</Label>
            <Input
              id="search_query"
              placeholder="No. Kontrak atau Nama Anggota"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* --- SUMMARY CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-l-4 border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Realisasi (Cair)</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(summary.totalNominalCair)}</div>
            <p className="text-xs text-muted-foreground">{summary.countRealisasi} Rekening Baru</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nominal Disetujui</CardTitle>
            <BarChart2 className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(summary.totalNominalDisetujui)}</div>
            <p className="text-xs text-muted-foreground">Basis Pencairan</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Potongan (Admin/Provisi)</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(summary.totalPotongan)}</div>
            <p className="text-xs text-muted-foreground">Selisih Disetujui - Cair</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-gray-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Nominal Cair</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {summary.countRealisasi > 0 ? formatRupiah(summary.totalNominalCair / summary.countRealisasi) : formatRupiah(0)}
            </div>
            <p className="text-xs text-muted-foreground">Per Rekening</p>
          </CardContent>
        </Card>
      </div>


      {/* --- TABEL REALISASI --- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Detail Realisasi Pinjaman</CardTitle>
          <Button
                onClick={handleExportExcel}
                className="bg-primary hover:bg-indigo-700"
            >
                <FileDown className="mr-2 h-4 w-4" />
                Export Data
            </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-3">Tgl. Realisasi</th>
                <th className="px-4 py-3">No. Kontrak</th>
                <th className="px-4 py-3">Anggota</th>
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3 text-center">Tenor (Bulan)</th>
                <th className="px-4 py-3 text-right">Nominal Disetujui</th>
                <th className="px-4 py-3 text-right">Nominal Cair</th>
                <th className="px-4 py-3 text-right">Potongan (Admin)</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-4">
                    Tidak ada data realisasi pembiayaan yang ditemukan dalam periode yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-600">{item.tgl_realisasi}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium">{item.no_kontrak}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.anggota_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.produk}</td>
                    <td className="px-4 py-3 text-center">{item.tenor}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-indigo-600">
                      {formatRupiah(item.nominal_disetujui)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-primary">
                      {formatRupiah(item.nominal_realisasi)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-red-600">
                      {formatRupiah(item.nominal_disetujui - item.nominal_realisasi)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
      
      <p className="text-xs text-gray-500 mt-4">
        *Laporan ini menyajikan ringkasan dan detail pinjaman yang telah dicairkan dalam rentang tanggal yang dipilih.
      </p>
    </div>
  );
}