"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart2,
  Calendar,
  FileDown,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";

import {
  useGetPinjamanMutasiListQuery,
  useGetPinjamanMutasiDebitCreditQuery,
} from "@/services/admin/pinjaman.service";

// --- TYPES BASED ON API RESPONSE ---

interface MutasiItem {
  id: number;
  pinjaman_id: number;
  pinjaman_detail_id: number | null;
  type: "installment" | "realization" | "correction_add" | "correction_min"; // Sesuaikan dengan enum API
  amount: number;
  date: string;
  description: string;
  created_at: string;
  updated_at: string;
  pinjaman_reference: string;
  anggota_name: string;
}

// --- HELPER FUNCTIONS ---

const formatRupiah = (number: number | string) => {
  const num = typeof number === "string" ? parseFloat(number) : number;
  if (isNaN(num) || num === null || num === undefined) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
};

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTransactionStyles = (type: string) => {
  // Realization = Pinjaman Bertambah (Debet di sisi Pinjaman)
  if (type === "realization" || type === "correction_add") {
    return {
      badgeVariant: "destructive" as const,
      icon: <TrendingUp className="h-4 w-4" />,
      label: type === "realization" ? "Realisasi" : "Koreksi (+)",
    };
  }
  // Installment = Pinjaman Berkurang (Kredit di sisi Pinjaman)
  if (type === "installment" || type === "correction_min") {
    return {
      badgeVariant: "success" as const,
      icon: <TrendingDown className="h-4 w-4" />,
      label: type === "installment" ? "Angsuran" : "Koreksi (-)",
    };
  }
  return {
    badgeVariant: "secondary" as const,
    icon: null,
    label: type,
  };
};

// --- KOMPONEN UTAMA ---

export default function LaporanMutasiPembiayaanPage() {
  // Set default date range (1 bulan terakhir)
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [query, setQuery] = useState("");
  const [jenisFilter, setJenisFilter] = useState<string>(""); // Kosong = All

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Fetch Data List Mutasi
  const { 
    data: listResponse, 
    isLoading: isLoadingList,
    isFetching: isFetchingList
  } = useGetPinjamanMutasiListQuery({
    page: currentPage,
    paginate: itemsPerPage,
    from_date: startDate,
    to_date: endDate,
    search: query,
    type: jenisFilter || undefined, // Kirim undefined jika kosong agar API mengambil semua
  });

  // 2. Fetch Data Summary
  const { 
    data: summaryResponse, 
    isLoading: isLoadingSummary 
  } = useGetPinjamanMutasiDebitCreditQuery();

  // Extract Data
  const mutasiList: MutasiItem[] = listResponse?.data || [];
  const pagination =  {
    current_page: listResponse?.current_page || 1,
    last_page: listResponse?.last_page || 1,
    total: listResponse?.total || 0,
    per_page: itemsPerPage,
  };
  const summaryData = summaryResponse || { 
    debit: { total_amount: 0 }, 
    credit: { total_amount: 0 }, 
    net_balance: 0 
  };

  // --- HANDLER EXPORT ---
  const handleExportExcel = () => {
    Swal.fire({
      icon: "info",
      title: "Export Laporan Mutasi",
      text: `Fitur ini akan mengekspor data dari ${startDate} hingga ${endDate}.`,
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
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1); // Reset ke halaman 1 saat filter berubah
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date">Tanggal Akhir</Label>
            <Input
              id="end_date"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jenis_filter">Jenis Mutasi</Label>
            <select
              id="jenis_filter"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={jenisFilter}
              onChange={(e) => {
                setJenisFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Semua Jenis</option>
              <option value="realization">Realisasi (Pinjaman Bertambah)</option>
              <option value="installment">Angsuran (Pinjaman Berkurang)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="search_query">Cari Anggota/Kontrak</Label>
            <Input
              id="search_query"
              placeholder="No. Kontrak atau Nama"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* --- RINGKASAN (SUMMARY) --- */}
      <Card className="bg-muted p-4">
        {isLoadingSummary ? (
           <div className="flex justify-center py-4">
             <Loader2 className="animate-spin h-6 w-6 text-primary" />
           </div>
        ) : (
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-semibold w-full">
                  <div className="text-red-700 p-2 bg-red-50 rounded border border-red-100">
                      <p className="text-sm text-gray-600">Total Mutasi Debet (Pinjaman Bertambah)</p>
                      <p className="text-xl">{formatRupiah(summaryData.debit.total_amount)}</p>
                  </div>
                  <div className="text-green-700 p-2 bg-green-50 rounded border border-green-100">
                      <p className="text-sm text-gray-600">Total Mutasi Kredit (Pinjaman Berkurang)</p>
                      <p className="text-xl">{formatRupiah(summaryData.credit.total_amount)}</p>
                  </div>
                  <div className="text-blue-700 p-2 bg-blue-50 rounded border border-blue-100">
                      <p className="text-sm text-gray-600">Net Mutasi (Debet - Kredit)</p>
                      <p className="text-xl">{formatRupiah(summaryData.net_balance)}</p>
                  </div>
              </div>
              <Button
                  onClick={handleExportExcel}
                  className="bg-primary hover:bg-indigo-700 shrink-0"
              >
                  <FileDown className="mr-2 h-4 w-4" />
                  Export Data
              </Button>
          </div>
        )}
      </Card>

      {/* --- TABEL MUTASI --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex justify-between items-center">
            <span>Detail Transaksi Mutasi</span>
            {isFetchingList && <Loader2 className="animate-spin h-4 w-4 text-gray-500" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">No. Kontrak</th>
                <th className="px-4 py-3">Anggota</th>
                <th className="px-4 py-3">Jenis Transaksi</th>
                <th className="px-4 py-3 text-right">Debet</th>
                <th className="px-4 py-3 text-right">Kredit</th>
                <th className="px-4 py-3">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingList ? (
                 <tr>
                   <td colSpan={7} className="text-center p-8">
                     <div className="flex justify-center items-center gap-2">
                       <Loader2 className="animate-spin h-5 w-5 text-primary" />
                       <span>Memuat data...</span>
                     </div>
                   </td>
                 </tr>
              ) : mutasiList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-gray-500">
                    Tidak ada data mutasi yang ditemukan untuk filter ini.
                  </td>
                </tr>
              ) : (
                mutasiList.map((item) => {
                  const styles = getTransactionStyles(item.type);
                  
                  // Logic pemisahan kolom Debet/Kredit
                  const isDebit = item.type === 'realization';
                  const debitAmount = isDebit ? item.amount : 0;
                  const creditAmount = !isDebit ? item.amount : 0;

                  return (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(item.date)}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium">{item.pinjaman_reference}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{item.anggota_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={styles.badgeVariant} className="flex items-center gap-1 w-fit">
                          {styles.icon} {styles.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-semibold text-green-600">
                        {creditAmount > 0 ? formatRupiah(creditAmount) : "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-semibold text-red-600">
                        {debitAmount > 0 ? formatRupiah(debitAmount) : "-"}
                      </td>
                      <td className="px-4 py-3 max-w-[300px] truncate" title={item.description}>
                        {item.description}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>

        {/* PAGINATION */}
        {!isLoadingList && pagination.last_page > 1 && (
          <div className="p-4 flex items-center justify-between bg-muted border-t">
            <div className="text-sm text-gray-500">
              Halaman <strong>{pagination.current_page}</strong> dari <strong>{pagination.last_page}</strong>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.current_page <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </Card>
      
      <p className="text-xs text-gray-500 mt-4">
        *Laporan Mutasi Pembiayaan mencatat pergerakan saldo Pinjaman. **Debet** (Merah) berarti saldo pinjaman bertambah (mis. Realisasi), dan **Kredit** (Hijau) berarti saldo pinjaman berkurang (mis. Angsuran).
      </p>
    </div>
  );
}