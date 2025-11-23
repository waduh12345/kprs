"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText,
  FileDown,
  ListFilter,
  Users,
  Coins,
  DollarSign,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Swal from "sweetalert2";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetWalletListQuery } from "@/services/admin/penarikan-simpanan.service";

// --- INTERFACES SESUAI RESPONSE API ---

interface WalletReference {
  id: number;
  code: string;
  name: string;
  interest_rate: number;
  description: string;
  nominal: number;
  status: number;
}

interface WalletUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

interface WalletData {
  id: number;
  user_id: number;
  name: string;
  account_number: string;
  description: string;
  balance: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  reference_type: string;
  reference_id: number;
  reference: WalletReference;
  user: WalletUser;
}

// Interface baru untuk membungkus response lengkap
interface ApiResponse {
  data: WalletData[];
  last_page: number;
  current_page: number;
  total: number;
  per_page: number;
  from: number;
  to: number;
  prev_page_url: string | null;
  next_page_url: string | null;
}

interface ApiMeta {
  last_page: number;
  current_page: number;
  total: number;
  per_page: number;
  from: number;
  to: number;
  prev_page_url: string | null;
  next_page_url: string | null;
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

// --- KOMPONEN UTAMA ---

export default function LaporanNominatifSimpananPage() {
  const today = new Date().toISOString().substring(0, 10);
  
  // State
  const [cutOffDate, setCutOffDate] = useState(today);
  const [produkFilter, setProdukFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- FETCH DATA FROM API ---
  const { data: apiResponse, isLoading, isFetching, refetch } = useGetWalletListQuery({
    page: currentPage,
    paginate: itemsPerPage,
    search: query,
  });

  // --- FIXED SECTION START: SAFE TYPING ---
  
  // Cast response ke tipe yang sudah didefinisikan atau undefined
  const response = apiResponse as ApiResponse | undefined;

  // Extract Data dengan aman
  const walletData: WalletData[] = response?.data || [];

  // Construct Meta data tanpa casting berulang yang menyebabkan error linter
  const meta: ApiMeta = {
    last_page: response?.last_page ?? 1,
    current_page: response?.current_page ?? 1,
    total: response?.total ?? 0,
    per_page: response?.per_page ?? itemsPerPage,
    from: response?.from ?? 0,
    to: response?.to ?? 0,
    prev_page_url: response?.prev_page_url ?? null,
    next_page_url: response?.next_page_url ?? null,
  };
  
  // --- FIXED SECTION END ---

  // --- FILTERING & MAPPING (Client-Side untuk Produk) ---
  const filteredNominatif = useMemo(() => {
    let arr = walletData;

    // Filter Produk Simpanan (Berdasarkan nama reference)
    if (produkFilter !== "all") {
      arr = arr.filter((it) => 
        it.reference?.name?.toLowerCase().includes(produkFilter.toLowerCase())
      );
    }
    
    return arr;
  }, [walletData, produkFilter]);

  // --- SUMMARY BERDASARKAN HALAMAN INI ---
  const summaryFiltered = useMemo(() => {
    const totalSaldo = filteredNominatif.reduce((sum, item) => sum + item.balance, 0);
    const totalRekening = filteredNominatif.length;
    // Hitung anggota unik di halaman ini
    const totalAnggota = new Set(filteredNominatif.map(d => d.user_id)).size;
    return { totalSaldo, totalRekening, totalAnggota };
  }, [filteredNominatif]);

  // --- HANDLER ---
  const handleExportExcel = () => {
    Swal.fire({
      icon: "info",
      title: "Export Laporan Nominatif",
      text: `Fitur export data per tanggal ${cutOffDate} sedang dalam pengembangan.`,
      confirmButtonText: "Oke",
    });
  };

  const handleNextPage = () => {
    if (meta?.next_page_url) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (meta?.prev_page_url && currentPage > 1) setCurrentPage((prev) => prev - 1);
  };
  
  // --- RENDERING TABEL NOMINATIF ---
  const renderNominatifTable = () => {
    if (isLoading || isFetching) {
      return (
        <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-gray-500">Memuat data nominatif...</p>
        </div>
      );
    }

    return (
      <div className="p-0 overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-muted text-left">
            <tr>
              <th className="px-4 py-3 w-[180px]">No. Rekening</th>
              <th className="px-4 py-3">Nama Anggota (ID)</th>
              <th className="px-4 py-3 w-[200px]">Produk</th>
              <th className="px-4 py-3 text-right w-[180px]">Saldo Akhir</th>
            </tr>
          </thead>
          <tbody>
            {filteredNominatif.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-8 text-gray-500">
                    Tidak ada data nominatif yang ditemukan.
                  </td>
                </tr>
            ) : (
                filteredNominatif.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs font-medium text-gray-700">
                            {item.account_number}
                        </td>
                        <td className="px-4 py-3">
                            <span className="font-semibold text-gray-900">{item.user?.name || "Unknown"}</span><br/>
                            <span className="text-xs text-gray-500">ID Anggota: {item.user_id}</span>
                        </td>
                        <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                                <span>{item.reference?.name || "Simpanan Umum"}</span>
                                <Badge variant="outline" className="text-[10px]">
                                    {item.reference?.code}
                                </Badge>
                            </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-primary text-base">
                            {formatRupiah(item.balance)}
                        </td>
                    </tr>
                ))
            )}
          </tbody>
          <tfoot className="bg-gray-100 font-extrabold sticky bottom-0 border-t-2 border-gray-300">
              <tr>
                  <td colSpan={3} className="px-4 py-3 text-right uppercase text-gray-600 text-xs">
                    Total Saldo (Halaman Ini)
                  </td>
                  <td className="px-4 py-3 text-right text-lg text-green-700">
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
      <p className="text-gray-600">
        Daftar saldo simpanan anggota. Data saldo yang ditampilkan adalah posisi saldo saat ini (Realtime).
      </p>

      {/* --- KARTU KONTROL FILTER --- */}
      <Card className="border-t-4 border-indigo-500 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-indigo-600">
            <ListFilter className="h-5 w-5" /> Kontrol Laporan
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-2 col-span-1">
            <Label htmlFor="cut_off_date">Tanggal Laporan</Label>
            <Input
              id="cut_off_date"
              type="date"
              value={cutOffDate}
              onChange={(e) => setCutOffDate(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="space-y-2 col-span-1">
            <Label htmlFor="produk_filter">Filter Produk</Label>
            <Select onValueChange={setProdukFilter} value={produkFilter}>
                <SelectTrigger id="produk_filter" className="bg-white">
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
            <div className="flex gap-2">
                <Input
                  id="search_query"
                  placeholder="No. Rekening / Nama..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-10 bg-white"
                />
                <Button onClick={() => refetch()} disabled={isLoading}>
                  Cari
                </Button>
            </div>
          </div>
           <div className="col-span-1">
            <Button
                onClick={handleExportExcel}
                className="w-full bg-red-600 hover:bg-red-700 h-10"
            >
                <FileDown className="mr-2 h-4 w-4" />
                Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- SUMMARY CARD --- */}
      <Card className="p-4 bg-white border-l-4 border-yellow-400 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-semibold">
            <div className="text-gray-700">
                <p className="text-xs text-gray-500 uppercase">Anggota (Halaman Ini)</p>
                <p className="text-xl font-bold flex items-center gap-2">
                    <Users className="h-5 w-5 text-yellow-600"/> {summaryFiltered.totalAnggota} 
                </p>
            </div>
            <div className="text-gray-700">
                <p className="text-xs text-gray-500 uppercase">Rekening (Halaman Ini)</p>
                <p className="text-xl font-bold flex items-center gap-2">
                    <Coins className="h-5 w-5 text-yellow-600"/> {summaryFiltered.totalRekening}
                </p>
            </div>
            <div className="text-primary">
                <p className="text-xs text-gray-500 uppercase">Total Saldo (Halaman Ini)</p>
                <p className="text-2xl font-extrabold flex items-center gap-2 text-green-700">
                    <DollarSign className="h-6 w-6"/> {formatRupiah(summaryFiltered.totalSaldo)}
                </p>
            </div>
        </div>
      </Card>

      {/* --- TABEL NOMINATIF --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> 
                Data Nominatif
            </div>
            <div className="text-sm font-normal text-gray-500">
                Total Data: {meta?.total || 0}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {renderNominatifTable()}
          
          {/* Pagination Control */}
          {meta && (
             <div className="flex items-center justify-between px-4 py-4 border-t bg-gray-50">
               <div className="text-sm text-gray-500">
                 Menampilkan <b>{meta.from || 0}</b> sampai <b>{meta.to || 0}</b> dari <b>{meta.total || 0}</b> data
               </div>
               <div className="flex gap-2">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={handlePrevPage}
                   disabled={!meta.prev_page_url || isLoading}
                 >
                   <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={handleNextPage}
                   disabled={!meta.next_page_url || isLoading}
                 >
                   Next <ChevronRight className="h-4 w-4 ml-1" />
                 </Button>
               </div>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}