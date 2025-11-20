"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ListChecks,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Swal from "sweetalert2";
import { Badge } from "@/components/ui/badge";
import { useGetWalletHistoriesQuery } from "@/services/admin/penarikan-simpanan.service";

// --- TYPE DEFINITIONS SESUAI API ---

interface WalletHistory {
  id: number;
  wallet_id: number;
  type: "debit" | "credit"; // Sesuaikan dengan response API
  source_type: string;
  source_id: number;
  amount: number;
  description: string;
  created_at: string;
  updated_at: string;
}

interface WalletHistoryResponse {
  current_page: number;
  data: WalletHistory[];
  first_page_url: string;
  from: number;
  last_page: number; // Biasanya ada di response Laravel standard, kita asumsi ada atau hitung manual
  per_page: number;
  to: number;
  total: number; // Biasanya ada
  next_page_url?: string;
  prev_page_url?: string;
}

// --- HELPER FUNCTIONS ---

const formatRupiah = (number: number) => {
  if (isNaN(number) || number === null || number === undefined) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusBadge = (type: string) => {
  if (type === "debit")
    return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">DEBIT</Badge>;
  if (type === "credit")
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">KREDIT</Badge>;
  return <Badge variant="secondary">{type.toUpperCase()}</Badge>;
};

// --- KOMPONEN UTAMA ---

export default function LaporanMutasiSimpananPage() {
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Filter State
  // Catatan: Asumsi API menerima parameter filter. Jika tidak, filter hanya berlaku client-side (tidak ideal untuk data besar)
  // Disini saya mengirim params ke hook, pastikan service Anda meneruskannya ke endpoint
  const today = new Date().toISOString().substring(0, 10);
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  )
    .toISOString()
    .substring(0, 10);

  const [startDate, setStartDate] = useState(startOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [query, setQuery] = useState("");
  const [tipeFilter, setTipeFilter] = useState("all");

  // --- FETCH DATA FROM API ---
  const { data: apiResponse, isLoading, isFetching, refetch } = useGetWalletHistoriesQuery({
    page: currentPage,
    paginate: itemsPerPage,
    // Tambahkan parameter ini jika API backend Anda mendukung filter
    start_date: startDate,
    end_date: endDate,
    search: query,
    type: tipeFilter !== "all" ? tipeFilter : undefined,
  });

  // Casting response agar TypeScript aman
  const historyData = (apiResponse?.data as WalletHistory[]) || [];
  const meta = apiResponse as WalletHistoryResponse; // Metadata pagination

  // --- SUMMARY (Berdasarkan data halaman saat ini) ---
  const summary = useMemo(() => {
    let totalDebet = 0;
    let totalKredit = 0;

    historyData.forEach((item) => {
      if (item.type === "debit") {
        totalDebet += item.amount;
      } else if (item.type === "credit") {
        totalKredit += item.amount;
      }
    });

    return { totalDebet, totalKredit, totalTransaksi: historyData.length };
  }, [historyData]);

  // --- HANDLER ---
  const handleExportExcel = () => {
    Swal.fire({
      icon: "info",
      title: "Export Laporan Mutasi",
      text: `Fitur export data dari ${startDate} s/d ${endDate} sedang dikembangkan.`,
      confirmButtonText: "Oke",
    });
  };

  const handleNextPage = () => {
    if (meta?.next_page_url) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (meta?.prev_page_url && currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  // --- RENDERING TABEL ---
  const renderMutasiTable = () => {
    if (isLoading || isFetching) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-gray-500">
          <Loader2 className="h-10 w-10 animate-spin mb-2 text-primary" />
          <p>Memuat data mutasi...</p>
        </div>
      );
    }

    return (
      <div className="p-0 overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-muted text-left">
            <tr>
              <th className="px-4 py-3 w-[150px]">Tanggal</th>
              <th className="px-4 py-3 w-[100px]">Tipe</th>
              <th className="px-4 py-3">Keterangan / Sumber</th>
              <th className="px-4 py-3 text-right w-[180px] bg-blue-50/50">Debit</th>
              <th className="px-4 py-3 text-right w-[180px] bg-green-50/50">Kredit</th>
            </tr>
          </thead>
          <tbody>
            {historyData.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-8 text-gray-500">
                  Tidak ada transaksi mutasi yang ditemukan.
                </td>
              </tr>
            ) : (
              historyData.map((item) => {
                // Logika pemisahan kolom
                const isDebit = item.type === "debit";
                const isCredit = item.type === "credit";

                return (
                  <tr key={item.id} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(item.type)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{item.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Reff ID: {item.source_id} • Wallet ID: {item.wallet_id}
                      </p>
                    </td>
                    {/* Kolom DEBIT */}
                    <td className="px-4 py-3 text-right font-semibold text-blue-700 bg-blue-50/30">
                      {isDebit ? formatRupiah(item.amount) : "-"}
                    </td>
                    {/* Kolom KREDIT */}
                    <td className="px-4 py-3 text-right font-semibold text-green-700 bg-green-50/30">
                      {isCredit ? formatRupiah(item.amount) : "-"}
                    </td>
                  </tr>
                );
              })
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

      {/* --- FILTER --- */}
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
            <Label htmlFor="tipe_filter">Tipe Mutasi</Label>
            <Select onValueChange={setTipeFilter} value={tipeFilter}>
              <SelectTrigger id="tipe_filter">
                <SelectValue placeholder="Pilih Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
                <SelectItem value="credit">Kredit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="search_query">Pencarian</Label>
            <div className="flex gap-2">
              <Input
                id="search_query"
                placeholder="Cari deskripsi..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10"
              />
              <Button onClick={() => refetch()} disabled={isLoading}>
                Cari
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- SUMMARY --- */}
      <Card className="bg-white border-l-4 border-indigo-500 shadow-sm">
        <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Debit (Halaman Ini)</p>
              <p className="text-2xl font-bold text-blue-700">{formatRupiah(summary.totalDebet)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Kredit (Halaman Ini)</p>
              <p className="text-2xl font-bold text-green-700">{formatRupiah(summary.totalKredit)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Jumlah Transaksi</p>
              <p className="text-2xl font-bold text-gray-800">{summary.totalTransaksi}</p>
            </div>
          </div>
          <Button
            onClick={handleExportExcel}
            variant="outline"
            className="border-green-600 text-green-700 hover:bg-green-50"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </Card>

      {/* --- TABEL DATA --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ListChecks className="h-5 w-5" /> Riwayat Transaksi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {renderMutasiTable()}
          
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