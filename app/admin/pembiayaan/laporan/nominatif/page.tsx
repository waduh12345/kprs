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
  Users,
  DollarSign,
  Search,
  ListChecks,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import Swal from "sweetalert2";

// --- DUMMY DATA & TYPES ---

interface NominatifPembiayaan {
  no_kontrak: string;
  anggota_name: string;
  produk: string;
  nominal_pinjaman: number;
  sisa_pokok: number;
  tenor_total: number;
  tenor_sisa: number;
  tgl_realisasi: string;
  tgl_jatuh_tempo: string;
  kolektibilitas: "Lancar" | "DPD (Dalam Perhatian Khusus)" | "Macet";
  denda_tunggakan: number;
}

const initialDummyData: NominatifPembiayaan[] = [
  {
    no_kontrak: "PJN/M/001",
    anggota_name: "Budi Santoso",
    produk: "Pembiayaan Mikro",
    nominal_pinjaman: 15000000,
    sisa_pokok: 10000000,
    tenor_total: 12,
    tenor_sisa: 8,
    tgl_realisasi: "2025-04-15",
    tgl_jatuh_tempo: "2026-04-15",
    kolektibilitas: "Lancar",
    denda_tunggakan: 0,
  },
  {
    no_kontrak: "PJN/I/002",
    anggota_name: "Siti Rahayu",
    produk: "Pembiayaan Investasi",
    nominal_pinjaman: 50000000,
    sisa_pokok: 40000000,
    tenor_total: 24,
    tenor_sisa: 20,
    tgl_realisasi: "2025-01-20",
    tgl_jatuh_tempo: "2027-01-20",
    kolektibilitas: "Lancar",
    denda_tunggakan: 0,
  },
  {
    no_kontrak: "PJN/M/003",
    anggota_name: "Joko Widodo",
    produk: "Pembiayaan Mikro",
    nominal_pinjaman: 10000000,
    sisa_pokok: 5000000,
    tenor_total: 10,
    tenor_sisa: 5,
    tgl_realisasi: "2025-01-10",
    tgl_jatuh_tempo: "2025-11-10",
    kolektibilitas: "DPD (Dalam Perhatian Khusus)",
    denda_tunggakan: 150000,
  },
  {
    no_kontrak: "PJN/MG/004",
    anggota_name: "Rini Melati",
    produk: "Kredit Multi Guna",
    nominal_pinjaman: 30000000,
    sisa_pokok: 30000000,
    tenor_total: 12,
    tenor_sisa: 12,
    tgl_realisasi: "2025-10-01",
    tgl_jatuh_tempo: "2026-10-01",
    kolektibilitas: "Lancar",
    denda_tunggakan: 0,
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

const statusVariant = (kolektibilitas: NominatifPembiayaan["kolektibilitas"]): "success" | "destructive" | "default" | "secondary" => {
  if (kolektibilitas === "Lancar") return "success";
  if (kolektibilitas === "Macet") return "destructive";
  if (kolektibilitas === "DPD (Dalam Perhatian Khusus)") return "default";
  return "secondary";
};

// --- KOMPONEN UTAMA ---

export default function LaporanNominatifPembiayaanPage() {
  const today = new Date().toISOString().substring(0, 10);
  const [dataNominatif] = useState<NominatifPembiayaan[]>(initialDummyData);
  const [query, setQuery] = useState("");
  const [posisiTanggal, setPosisiTanggal] = useState(today); // Tanggal laporan
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredList = useMemo(() => {
    let arr = dataNominatif;

    // Catatan: Dalam implementasi nyata, data Nominatif akan ditarik
    // dari API berdasarkan 'posisiTanggal'. Di sini, kita abaikan filter tanggal
    // karena data dummy sudah statis.

    // 1. Filter Status Kolektibilitas
    if (statusFilter !== "all") {
      arr = arr.filter((it) => it.kolektibilitas === statusFilter);
    }

    // 2. Filter Query Pencarian
    if (!query.trim()) return arr;
    const q = query.toLowerCase();
    return arr.filter((it) =>
      [it.anggota_name, it.no_kontrak, it.produk].some(
        (f) => f?.toLowerCase?.().includes?.(q)
      )
    );
  }, [dataNominatif, query, statusFilter]);

  // --- SUMMARY ---
  const summary = useMemo(() => {
    const totalOutstanding = filteredList.reduce((sum, item) => sum + item.sisa_pokok, 0);
    const totalDenda = filteredList.reduce((sum, item) => sum + item.denda_tunggakan, 0);
    const countLancar = filteredList.filter(d => d.kolektibilitas === 'Lancar').length;
    const countDPD = filteredList.filter(d => d.kolektibilitas === 'DPD (Dalam Perhatian Khusus)').length;
    const countMacet = filteredList.filter(d => d.kolektibilitas === 'Macet').length;
    return { 
        totalOutstanding, 
        totalDenda, 
        countLancar, 
        countDPD, 
        countMacet, 
        totalRekening: filteredList.length 
    };
  }, [filteredList]);

  // --- HANDLER EXPORT ---
  const handleExportExcel = () => {
    // Simulasi Export
    Swal.fire({
      icon: "info",
      title: "Export Laporan Nominatif",
      text: `Mengekspor data Nominatif Pembiayaan posisi tanggal ${posisiTanggal}. (Simulasi)`,
      confirmButtonText: "Oke",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <BarChart2 className="h-6 w-6 text-primary" />
        Laporan Nominatif Pembiayaan
      </h2>

      {/* --- KARTU FILTER POSISI --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-indigo-600">
            <Calendar className="h-5 w-5" /> Kontrol Laporan
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="posisi_tanggal">Posisi Tanggal Laporan</Label>
            <Input
              id="posisi_tanggal"
              type="date"
              value={posisiTanggal}
              onChange={(e) => setPosisiTanggal(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status_filter">Filter Status Kolektibilitas</Label>
            <select
              id="status_filter"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="Lancar">Lancar</option>
              <option value="DPD (Dalam Perhatian Khusus)">DPD (Perhatian Khusus)</option>
              <option value="Macet">Macet</option>
            </select>
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
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(summary.totalOutstanding)}</div>
            <p className="text-xs text-muted-foreground">{summary.totalRekening} Rekening</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rekening Lancar</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.countLancar} Unit</div>
            <p className="text-xs text-muted-foreground">Status Terbaik</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rekening DPD/Khusus</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.countDPD} Unit</div>
            <p className="text-xs text-muted-foreground">Perlu Tindak Lanjut</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Denda Tunggakan</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(summary.totalDenda)}</div>
            <p className="text-xs text-muted-foreground">{summary.countMacet} Rekening Macet</p>
          </CardContent>
        </Card>
      </div>


      {/* --- TABEL NOMINATIF --- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Detail Nominatif Pembiayaan</CardTitle>
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
                <th className="px-4 py-3">No. Kontrak</th>
                <th className="px-4 py-3">Anggota</th>
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3 text-right">Nominal Pinjaman</th>
                <th className="px-4 py-3 text-right">Sisa Pokok</th>
                <th className="px-4 py-3 text-center">Tenor (Sisa/Total)</th>
                <th className="px-4 py-3">Tgl. Realisasi</th>
                <th className="px-4 py-3">Kolektibilitas</th>
                <th className="px-4 py-3 text-right">Denda</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-4">
                    Tidak ada data nominatif yang ditemukan untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.no_kontrak} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap font-medium">{item.no_kontrak}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.anggota_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.produk}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">{formatRupiah(item.nominal_pinjaman)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-primary">
                      {formatRupiah(item.sisa_pokok)}
                    </td>
                    <td className="px-4 py-3 text-center">{item.tenor_sisa}/{item.tenor_total}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{item.tgl_realisasi}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={statusVariant(item.kolektibilitas)}>
                        {item.kolektibilitas}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right font-semibold text-red-600">
                      {formatRupiah(item.denda_tunggakan)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
      
      <p className="text-xs text-gray-500 mt-4">
        *Laporan Nominatif adalah data posisi outstanding (sisa pokok) pada tanggal laporan.
      </p>
    </div>
  );
}