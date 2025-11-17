"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Calendar,
  FileDown,
  ListFilter,
  Users,
  Coins,
  DollarSign,
} from "lucide-react";
import Swal from "sweetalert2";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- DUMMY DATA & TYPES ---

interface NominatifSimpanan {
  no_rekening: string;
  anggota_id: string;
  anggota_name: string;
  produk: string;
  saldo_akhir: number;
  tipe_simpanan: "Pokok" | "Wajib" | "Sukarela" | "Berjangka";
}

// Data Nominatif Simpanan Dummy
const dummyNominatifData: NominatifSimpanan[] = [
  { no_rekening: "POK-001", anggota_id: "A001", anggota_name: "Budi Santoso", produk: "Simpanan Pokok", saldo_akhir: 1000000, tipe_simpanan: "Pokok" },
  { no_rekening: "WJB-001", anggota_id: "A001", anggota_name: "Budi Santoso", produk: "Simpanan Wajib", saldo_akhir: 2500000, tipe_simpanan: "Wajib" },
  { no_rekening: "SWK-001", anggota_id: "A001", anggota_name: "Budi Santoso", produk: "Simpanan Sukarela", saldo_akhir: 15000000, tipe_simpanan: "Sukarela" },

  { no_rekening: "POK-002", anggota_id: "A002", anggota_name: "Siti Rahayu", produk: "Simpanan Pokok", saldo_akhir: 1000000, tipe_simpanan: "Pokok" },
  { no_rekening: "WJB-002", anggota_id: "A002", anggota_name: "Siti Rahayu", produk: "Simpanan Wajib", saldo_akhir: 3000000, tipe_simpanan: "Wajib" },
  { no_rekening: "BER-001", anggota_id: "A002", anggota_name: "Siti Rahayu", produk: "Simpanan Berjangka 1 Tahun", saldo_akhir: 50000000, tipe_simpanan: "Berjangka" },

  { no_rekening: "SWK-003", anggota_id: "A003", anggota_name: "Joko Widodo", produk: "Simpanan Sukarela", saldo_akhir: 800000, tipe_simpanan: "Sukarela" },
  { no_rekening: "WJB-003", anggota_id: "A003", anggota_name: "Joko Widodo", produk: "Simpanan Wajib", saldo_akhir: 1500000, tipe_simpanan: "Wajib" },
];

const totalSaldoGlobal = dummyNominatifData.reduce((sum, item) => sum + item.saldo_akhir, 0);
const totalAnggotaUnik = new Set(dummyNominatifData.map(d => d.anggota_id)).size;

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

export default function LaporanNominatifSimpananPage() {
  const today = new Date().toISOString().substring(0, 10);
  
  const [cutOffDate, setCutOffDate] = useState(today);
  const [produkFilter, setProdukFilter] = useState("all");
  const [query, setQuery] = useState("");

  // --- FILTERING ---
  const filteredNominatif = useMemo(() => {
    let arr = dummyNominatifData;

    // 1. Filter Query Pencarian
    if (query.trim()) {
        const q = query.toLowerCase();
        arr = arr.filter((it) =>
          [it.anggota_name, it.no_rekening, it.anggota_id].some(
            (f) => f?.toLowerCase?.().includes?.(q)
          )
        );
    }

    // 2. Filter Produk Simpanan
    if (produkFilter !== "all") {
      arr = arr.filter((it) => it.tipe_simpanan === produkFilter);
    }
    
    // Anggap data dummy sudah disaring berdasarkan cutOffDate (simulasi)
    return arr;
  }, [dummyNominatifData, query, produkFilter]);

  // --- SUMMARY BERDASARKAN FILTER ---
  const summaryFiltered = useMemo(() => {
    const totalSaldo = filteredNominatif.reduce((sum, item) => sum + item.saldo_akhir, 0);
    const totalRekening = filteredNominatif.length;
    const totalAnggota = new Set(filteredNominatif.map(d => d.anggota_id)).size;
    return { totalSaldo, totalRekening, totalAnggota };
  }, [filteredNominatif]);

  // --- HANDLER EXPORT ---
  const handleExportExcel = () => {
    Swal.fire({
      icon: "info",
      title: "Export Laporan Nominatif",
      text: `Mengekspor data Nominatif Simpanan per tanggal ${cutOffDate}. (Simulasi)`,
      confirmButtonText: "Oke",
    });
  };
  
  // --- RENDERING TABEL NOMINATIF ---
  const renderNominatifTable = (data: NominatifSimpanan[]) => {
    return (
      <div className="p-0 overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-muted text-left">
            <tr>
              <th className="px-4 py-3 w-[150px]">No. Rekening</th>
              <th className="px-4 py-3">Nama Anggota (ID)</th>
              <th className="px-4 py-3 w-[150px]">Produk</th>
              <th className="px-4 py-3 text-right w-[180px]">Saldo Akhir ({cutOffDate})</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-4">
                    Tidak ada data nominatif yang ditemukan untuk filter yang dipilih.
                  </td>
                </tr>
            ) : (
                data.map((item, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-xs">{item.no_rekening}</td>
                        <td className="px-4 py-2">
                            <span className="font-semibold">{item.anggota_name}</span><br/>
                            <span className="text-xs text-gray-600">ID: {item.anggota_id}</span>
                        </td>
                        <td className="px-4 py-2">
                            {item.produk} <Badge variant="secondary" className="ml-1">{item.tipe_simpanan}</Badge>
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-primary">
                            {formatRupiah(item.saldo_akhir)}
                        </td>
                    </tr>
                ))
            )}
          </tbody>
          <tfoot className="bg-gray-200 font-extrabold sticky bottom-0">
              <tr>
                  <td colSpan={3} className="px-4 py-3 text-right">TOTAL SALDO SIMPANAN (SESUAI FILTER)</td>
                  <td className="px-4 py-3 text-right text-lg text-primary">
                    {formatRupiah(summaryFiltered.totalSaldo)}
                  </td>
              </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" />
        Laporan Nominatif Simpanan
      </h2>
      <p className="text-gray-600">Daftar lengkap saldo simpanan seluruh anggota per tanggal *cut-off*.</p>

      {/* --- KARTU KONTROL FILTER & SUMMARY GLOBAL --- */}
      <Card className="border-t-4 border-indigo-500">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-indigo-600">
            <ListFilter className="h-5 w-5" /> Kontrol Laporan
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-2 col-span-1">
            <Label htmlFor="cut_off_date">Tanggal Saldo (Cut-Off)</Label>
            <Input
              id="cut_off_date"
              type="date"
              value={cutOffDate}
              onChange={(e) => setCutOffDate(e.target.value)}
            />
          </div>
          <div className="space-y-2 col-span-1">
            <Label htmlFor="produk_filter">Filter Produk</Label>
            <Select onValueChange={setProdukFilter} value={produkFilter}>
                <SelectTrigger id="produk_filter">
                    <SelectValue placeholder="Semua Produk" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Semua Produk</SelectItem>
                    <SelectItem value="Pokok">Simpanan Pokok</SelectItem>
                    <SelectItem value="Wajib">Simpanan Wajib</SelectItem>
                    <SelectItem value="Sukarela">Simpanan Sukarela</SelectItem>
                    <SelectItem value="Berjangka">Simpanan Berjangka</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="search_query">Cari Rekening / Anggota</Label>
            <Input
              id="search_query"
              placeholder="No. Rekening, Nama Anggota, atau ID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10"
            />
          </div>
           <div className="col-span-1">
            <Button
                onClick={handleExportExcel}
                className="w-full bg-red-600 hover:bg-red-700 h-10"
            >
                <FileDown className="mr-2 h-4 w-4" />
                Export Nominatif
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- SUMMARY GLOBAL & FILTERED --- */}
      <Card className="p-4 bg-yellow-50 border border-yellow-300">
        <div className="grid grid-cols-3 gap-6 font-semibold">
            <div className="text-gray-700">
                <p className="text-sm">Total Anggota Terlibat (Unik)</p>
                <p className="text-xl font-bold flex items-center gap-1"><Users className="h-5 w-5"/> {summaryFiltered.totalAnggota} Anggota</p>
            </div>
            <div className="text-gray-700">
                <p className="text-sm">Jumlah Rekening Simpanan (Sesuai Filter)</p>
                <p className="text-xl font-bold flex items-center gap-1"><Coins className="h-5 w-5"/> {summaryFiltered.totalRekening} Rekening</p>
            </div>
            <div className="text-primary">
                <p className="text-sm">TOTAL SALDO SIMPANAN GLOBAL (SEMUA DATA DUMMY)</p>
                <p className="text-xl font-extrabold flex items-center gap-1"><DollarSign className="h-5 w-5"/> {formatRupiah(totalSaldoGlobal)}</p>
            </div>
        </div>
      </Card>


      {/* --- TABEL NOMINATIF SIMPANAN --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" /> Detail Data Nominatif ({summaryFiltered.totalRekening} Rekening)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {renderNominatifTable(filteredNominatif)}
        </CardContent>
      </Card>
      
      <p className="text-xs text-gray-500 mt-4">
        *Laporan Nominatif adalah daftar saldo akhir simpanan anggota yang menjadi kewajiban Koperasi per tanggal *cut-off* yang ditentukan.
      </p>
    </div>
  );
}