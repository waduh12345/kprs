"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProdukToolbar } from "@/components/ui/produk-toolbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart2,
  Calendar,
  FileDown,
  TrendingUp,
  TrendingDown,
  ListFilter,
  Search,
} from "lucide-react";

// --- DUMMY DATA & TYPES ---

interface MutasiPembiayaan {
  id: string;
  tanggal: string;
  no_kontrak: string;
  anggota_name: string;
  jenis_transaksi: "Realisasi" | "Angsuran" | "Pelunasan" | "Koreksi";
  debet_nominal: number; // Mutasi keluar/penambahan saldo pinjaman (Realisasi/Koreksi Tambah)
  kredit_nominal: number; // Mutasi masuk/pengurangan saldo pinjaman (Angsuran/Pelunasan/Koreksi Kurang)
  keterangan: string;
}

const initialDummyData: MutasiPembiayaan[] = [
  {
    id: "M001",
    tanggal: "2025-11-01",
    no_kontrak: "PJN/M/001",
    anggota_name: "Budi Santoso",
    jenis_transaksi: "Angsuran",
    debet_nominal: 0,
    kredit_nominal: 1450000,
    keterangan: "Pembayaran angsuran ke-4",
  },
  {
    id: "M002",
    tanggal: "2025-11-05",
    no_kontrak: "PJN/I/005",
    anggota_name: "Fajar Pratama",
    jenis_transaksi: "Realisasi",
    debet_nominal: 50000000,
    kredit_nominal: 0,
    keterangan: "Pencairan pinjaman investasi",
  },
  {
    id: "M003",
    tanggal: "2025-11-10",
    no_kontrak: "PJN/M/003",
    anggota_name: "Joko Widodo",
    jenis_transaksi: "Pelunasan",
    debet_nominal: 0,
    kredit_nominal: 5200000,
    keterangan: "Pelunasan penuh kontrak",
  },
  {
    id: "M004",
    tanggal: "2025-11-15",
    no_kontrak: "PJN/M/001",
    anggota_name: "Budi Santoso",
    jenis_transaksi: "Angsuran",
    debet_nominal: 0,
    kredit_nominal: 1450000,
    keterangan: "Pembayaran angsuran ke-5",
  },
  {
    id: "M005",
    tanggal: "2025-11-16",
    no_kontrak: "PJN/I/006",
    anggota_name: "Dewi Kartika",
    jenis_transaksi: "Realisasi",
    debet_nominal: 80000000,
    kredit_nominal: 0,
    keterangan: "Pencairan pinjaman investasi tahap 1",
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

const getTransactionStyles = (jenis: MutasiPembiayaan["jenis_transaksi"]) => {
  if (jenis === "Realisasi" || jenis === "Koreksi") {
    return {
      badgeVariant: "destructive" as const, // Debit/Penambahan Pinjaman
      icon: <TrendingUp className="h-4 w-4" />,
    };
  }
  if (jenis === "Angsuran" || jenis === "Pelunasan") {
    return {
      badgeVariant: "success" as const, // Kredit/Pengurangan Pinjaman
      icon: <TrendingDown className="h-4 w-4" />,
    };
  }
  return { badgeVariant: "secondary" as const, icon: null };
};

// --- KOMPONEN UTAMA ---

export default function LaporanMutasiPembiayaanPage() {
  const [dataMutasi] = useState<MutasiPembiayaan[]>(initialDummyData);
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState("2025-11-01");
  const [endDate, setEndDate] = useState("2025-11-30");
  const [jenisFilter, setJenisFilter] = useState<string>("all");

  const filteredList = useMemo(() => {
    let arr = dataMutasi;

    // 1. Filter Tanggal
    arr = arr.filter(
      (it) => it.tanggal >= startDate && it.tanggal <= endDate
    );

    // 2. Filter Jenis Transaksi
    if (jenisFilter !== "all") {
      arr = arr.filter((it) => it.jenis_transaksi === jenisFilter);
    }

    // 3. Filter Query Pencarian
    if (!query.trim()) return arr;
    const q = query.toLowerCase();
    return arr.filter((it) =>
      [it.anggota_name, it.no_kontrak, it.keterangan].some(
        (f) => f?.toLowerCase?.().includes?.(q)
      )
    );
  }, [dataMutasi, query, startDate, endDate, jenisFilter]);

  // --- SUMMARY ---
  const summary = useMemo(() => {
    const totalDebet = filteredList.reduce((sum, item) => sum + item.debet_nominal, 0);
    const totalKredit = filteredList.reduce((sum, item) => sum + item.kredit_nominal, 0);
    return { totalDebet, totalKredit };
  }, [filteredList]);

  // --- HANDLER EXPORT ---
  const handleExportExcel = () => {
    // Simulasi Export
    Swal.fire({
      icon: "info",
      title: "Export Laporan Mutasi",
      text: `Mengekspor data Mutasi Pembiayaan dari ${startDate} hingga ${endDate}. (Simulasi)`,
      confirmButtonText: "Oke",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <BarChart2 className="h-6 w-6 text-primary" />
        Laporan Mutasi Pembiayaan
      </h2>

      {/* --- KARTU FILTER PERIODE --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-indigo-600">
            <Calendar className="h-5 w-5" /> Filter Periode
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="start_date">Tanggal Awal</Label>
            <Input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date">Tanggal Akhir</Label>
            <Input
              id="end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jenis_filter">Jenis Mutasi</Label>
            <select
              id="jenis_filter"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={jenisFilter}
              onChange={(e) => setJenisFilter(e.target.value)}
            >
              <option value="all">Semua Jenis</option>
              <option value="Realisasi">Realisasi (Pinjaman Bertambah)</option>
              <option value="Angsuran">Angsuran</option>
              <option value="Pelunasan">Pelunasan</option>
              <option value="Koreksi">Koreksi</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="search_query">Cari Anggota/Kontrak</Label>
            <Input
              id="search_query"
              placeholder="No. Kontrak atau Nama"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* --- RINGKASAN & EXPORT --- */}
      <Card className="bg-muted p-4">
        <div className="flex justify-between items-center">
            <div className="grid grid-cols-3 gap-6 font-semibold">
                <div className="text-red-700">
                    <p className="text-sm text-gray-600">Total Mutasi Debet (Penambahan Pinjaman)</p>
                    <p className="text-xl">{formatRupiah(summary.totalDebet)}</p>
                </div>
                <div className="text-green-700">
                    <p className="text-sm text-gray-600">Total Mutasi Kredit (Pengurangan Pinjaman)</p>
                    <p className="text-xl">{formatRupiah(summary.totalKredit)}</p>
                </div>
                <div className="text-blue-700">
                    <p className="text-sm text-gray-600">Net Mutasi (Debet - Kredit)</p>
                    <p className="text-xl">{formatRupiah(summary.totalDebet - summary.totalKredit)}</p>
                </div>
            </div>
            <Button
                onClick={handleExportExcel}
                className="bg-primary hover:bg-indigo-700"
            >
                <FileDown className="mr-2 h-4 w-4" />
                Export Data Mutasi
            </Button>
        </div>
      </Card>

      {/* --- TABEL MUTASI --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detail Transaksi Mutasi</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">No. Kontrak</th>
                <th className="px-4 py-3">Anggota</th>
                <th className="px-4 py-3">Jenis Transaksi</th>
                <th className="px-4 py-3 text-right">Debet (Penambahan Pinjaman)</th>
                <th className="px-4 py-3 text-right">Kredit (Pengurangan Pinjaman)</th>
                <th className="px-4 py-3">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-4">
                    Tidak ada data mutasi yang ditemukan untuk periode dan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const styles = getTransactionStyles(item.jenis_transaksi);
                  return (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">{item.tanggal}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium">{item.no_kontrak}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{item.anggota_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={styles.badgeVariant} className="flex items-center gap-1">
                          {styles.icon} {item.jenis_transaksi}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-semibold text-red-600">
                        {formatRupiah(item.debet_nominal)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-semibold text-green-600">
                        {formatRupiah(item.kredit_nominal)}
                      </td>
                      <td className="px-4 py-3">{item.keterangan}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
      
      <p className="text-xs text-gray-500 mt-4">
        *Laporan Mutasi Pembiayaan mencatat pergerakan saldo Pinjaman. **Debet** berarti saldo pinjaman bertambah (mis. Realisasi), dan **Kredit** berarti saldo pinjaman berkurang (mis. Angsuran/Pelunasan).
      </p>
    </div>
  );
}