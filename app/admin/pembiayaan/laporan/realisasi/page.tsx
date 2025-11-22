"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  useGetPinjamanListQuery,
} from "@/services/admin/pinjaman.service";
import { Pinjaman } from "@/types/admin/pinjaman";

// --- TYPES BASED ON API RESPONSE ---
// --- HELPER FUNCTIONS ---

const formatRupiah = (number: number) => {
  if (isNaN(number) || number === null || number === undefined) return 'Rp 0';
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

// --- KOMPONEN UTAMA ---

export default function LaporanRealisasiPembiayaanPage() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [query, setQuery] = useState("");

  // Pagination
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // FETCH DATA DARI API
  const { 
    data: listResponse, 
    isLoading, 
    isFetching 
  } = useGetPinjamanListQuery({
    page: currentPage,
    paginate: itemsPerPage,
    status: '3', // Filter Khusus Status Realisasi (3)
    from_date: startDate,
    to_date: endDate,
    search: query,
  });

  // Extract Data
  const realisasiList: Pinjaman[] = listResponse?.data || [];
  const pagination = listResponse
    ? {
        current_page: listResponse.current_page || 1,
        last_page: listResponse.last_page || 1,
        total: listResponse.total || 0,
      }
    : {
        current_page: 1,
        last_page: 1,
        total: 0,
      };

  // --- SUMMARY CALCULATION (Client Side based on current filtered view/page) ---
  // Note: Idealnya ada API endpoint khusus summary untuk total keseluruhan periode tanpa pagination
  const summary = useMemo(() => {
    // Kita hitung dari data yang di-load (current page) 
    // atau jika API nanti support 'total_nominal_in_period' bisa diganti
    const totalNominalDisetujui = realisasiList.reduce((sum, item) => sum + item.nominal, 0);
    const totalAdminFee = realisasiList.reduce((sum, item) => sum + (item.admin_fee ?? 0), 0);
    const totalNominalCair = totalNominalDisetujui - totalAdminFee;
    const countRealisasi = realisasiList.length;
    
    return { 
        totalNominalDisetujui, 
        totalNominalCair, 
        countRealisasi,
        totalPotongan: totalAdminFee
    };
  }, [realisasiList]);

  // --- HANDLER EXPORT ---
  const handleExportExcel = () => {
    Swal.fire({
      icon: "info",
      title: "Export Laporan Realisasi",
      text: `Mengekspor data Realisasi Pembiayaan dari ${startDate} hingga ${endDate}.`,
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
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="start_date">Tanggal Realisasi Awal</Label>
            <Input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date">Tanggal Realisasi Akhir</Label>
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
          <div className="space-y-2 col-span-1 lg:col-span-2">
            <Label htmlFor="search_query">Cari Anggota / No. Kontrak</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search_query"
                placeholder="No. Kontrak atau Nama Anggota..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 h-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* --- SUMMARY CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cair */}
        <Card className="bg-white border-l-4 border-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Realisasi (Cair)</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            ) : (
              <div className="text-xl lg:text-2xl font-bold text-gray-900">{formatRupiah(summary.totalNominalCair)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {isLoading ? "..." : summary.countRealisasi} Rekening (Halaman ini)
            </p>
          </CardContent>
        </Card>

        {/* Total Disetujui */}
        <Card className="bg-white border-l-4 border-indigo-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Nominal Disetujui</CardTitle>
            <BarChart2 className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            ) : (
              <div className="text-xl lg:text-2xl font-bold text-gray-900">{formatRupiah(summary.totalNominalDisetujui)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Nominal Pokok Pinjaman</p>
          </CardContent>
        </Card>

        {/* Total Potongan */}
        <Card className="bg-white border-l-4 border-red-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Potongan (Admin)</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            ) : (
              <div className="text-xl lg:text-2xl font-bold text-gray-900">{formatRupiah(summary.totalPotongan)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Pendapatan Admin Fee</p>
          </CardContent>
        </Card>

        {/* Rata-rata */}
        <Card className="bg-white border-l-4 border-gray-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Rata-rata Nominal Cair</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
             {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            ) : (
              <div className="text-xl lg:text-2xl font-bold text-gray-900">
                  {summary.countRealisasi > 0 ? formatRupiah(summary.totalNominalCair / summary.countRealisasi) : formatRupiah(0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Per Rekening</p>
          </CardContent>
        </Card>
      </div>


      {/* --- TABEL REALISASI --- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Detail Realisasi Pinjaman
            {isFetching && <Loader2 className="animate-spin h-4 w-4 text-gray-400" />}
          </CardTitle>
          <Button
                onClick={handleExportExcel}
                className="bg-primary hover:bg-indigo-700"
                disabled={isLoading || realisasiList.length === 0}
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
                <th className="px-4 py-3 text-center">Tenor</th>
                <th className="px-4 py-3 text-right">Nominal Disetujui</th>
                <th className="px-4 py-3 text-right">Potongan (Admin)</th>
                <th className="px-4 py-3 text-right">Nominal Cair</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center p-8">
                     <div className="flex justify-center items-center gap-2">
                       <Loader2 className="animate-spin h-5 w-5 text-primary" />
                       <span>Memuat data realisasi...</span>
                     </div>
                  </td>
                </tr>
              ) : realisasiList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-gray-500">
                    Tidak ada data realisasi pembiayaan yang ditemukan dalam periode yang dipilih.
                  </td>
                </tr>
              ) : (
                realisasiList.map((item) => {
                  const nominalCair = item.nominal - (item.admin_fee ?? 0);
                  
                  return (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {formatDate(item.realization_date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-indigo-600">
                        {item.reference}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium">{item.user_name}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.category_name}
                      </td>
                      <td className="px-4 py-3 text-center">{item.tenor} Bulan</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-gray-700">
                        {formatRupiah(item.nominal)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-red-600">
                        {formatRupiah(item.admin_fee ?? 0)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-success-600">
                        {formatRupiah(nominalCair)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>

        {/* PAGINATION */}
        {!isLoading && pagination.last_page > 1 && (
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
        *Laporan ini menyajikan ringkasan dan detail pinjaman yang telah dicairkan (Status: Realisasi). Nominal Cair = Nominal Disetujui dikurangi Biaya Admin.
      </p>
    </div>
  );
}