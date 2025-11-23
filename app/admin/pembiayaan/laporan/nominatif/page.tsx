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
  DollarSign,
  Search,
  CheckCircle,
  Loader2,
  FileText,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  useGetPinjamanNominatifListQuery,
  useGetPinjamanOutstandingQuery,
} from "@/services/admin/pinjaman.service";

// --- TYPES BASED ON API RESPONSE ---

interface NominatifItem {
  id: number;
  reference: string; // No Kontrak
  user_name: string; // Nama Anggota
  category_name: string; // Produk
  category_code: string;
  nominal: number; // Nominal Pinjaman Awal
  detail_outstandings_sum_remaining: string | null; // Sisa Pokok (String dari API)
  tenor: number; // Total Tenor
  details_count: number;
  detail_outstandings_count: number; // Sisa Tenor
  realization_date: string | null; // Tgl Realisasi
  status: number; // Status Pinjaman
  approval_date: string | null;
  description: string;
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

const formatDate = (dateString: string | null) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusBadge = (status: number) => {
  switch (status) {
    case 0:
      return { label: "Pending", variant: "secondary" as const };
    case 1:
      return { label: "Approved", variant: "default" as const };
    case 2:
      return { label: "Rejected", variant: "destructive" as const };
    case 3:
      return { label: "Active (Realisasi)", variant: "success" as const };
    case 4:
      return { label: "Lunas", variant: "outline" as const };
    default:
      return { label: "Unknown", variant: "secondary" as const };
  }
};

// --- KOMPONEN UTAMA ---

export default function LaporanNominatifPembiayaanPage() {
  const today = new Date().toISOString().substring(0, 10);
  const [posisiTanggal, setPosisiTanggal] = useState(today);
  const [query, setQuery] = useState("");
  
  // Pagination State
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Fetch Data List Nominatif
  const { 
    data: listResponse, 
    isLoading: isLoadingList,
    isFetching: isFetchingList
  } = useGetPinjamanNominatifListQuery({
    page: currentPage,
    paginate: itemsPerPage,
    from_date: posisiTanggal, // Menggunakan filter tanggal (misal: "as of date")
    to_date: posisiTanggal, // Menggunakan filter tanggal (misal: "as of date")
    search: query,
  });

  // 2. Fetch Data Total Outstanding
  const { 
    data: outstandingResponse, 
    isLoading: isLoadingOutstanding 
  } = useGetPinjamanOutstandingQuery();

  // Extract Data
  const nominatifList: NominatifItem[] = listResponse?.data || [];
  const pagination = listResponse
    ? {
        current_page: listResponse.current_page ?? 1,
        last_page: listResponse.last_page ?? 1,
        total: listResponse.total ?? 0,
      }
    : {
        current_page: 1,
        last_page: 1,
        total: 0,
      };

  // Parsing Total Outstanding dari API (string "56721600" -> number)
  const totalOutstanding = useMemo(() => {
    if (outstandingResponse?.total_outstanding !== undefined) {
      return outstandingResponse.total_outstanding;
    }
    return 0;
  }, [outstandingResponse]);

  // --- HANDLER EXPORT ---
  const handleExportExcel = () => {
    Swal.fire({
      icon: "info",
      title: "Export Laporan Nominatif",
      text: `Mengekspor data Nominatif Pembiayaan posisi tanggal ${posisiTanggal}.`,
      confirmButtonText: "Oke",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <BarChart2 className="h-6 w-6 text-primary" />
        Laporan Nominatif Pembiayaan
      </h2>

      {/* --- KARTU FILTER --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-indigo-600">
            <Calendar className="h-5 w-5" /> Kontrol Laporan
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="posisi_tanggal">Posisi Tanggal Laporan</Label>
            <Input
              id="posisi_tanggal"
              type="date"
              value={posisiTanggal}
              onChange={(e) => {
                setPosisiTanggal(e.target.value);
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
                placeholder="Ketikan No. Kontrak atau Nama Anggota..."
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Total Outstanding (Dari API Outstanding) */}
        <Card className="bg-white border-l-4 border-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Sisa Pokok (Outstanding)</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingOutstanding ? (
               <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            ) : (
              <div className="text-2xl font-bold text-gray-900">{formatRupiah(totalOutstanding)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Akumulasi seluruh pinjaman aktif</p>
          </CardContent>
        </Card>

        {/* Card 2: Total Rekening (Dari Metadata Pagination) */}
        <Card className="bg-white border-l-4 border-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Rekening</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
             {isLoadingList ? (
               <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            ) : (
              <div className="text-2xl font-bold text-gray-900">{pagination.total} Unit</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Total data ditemukan</p>
          </CardContent>
        </Card>
      </div>

      {/* --- TABEL NOMINATIF --- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Detail Nominatif Pembiayaan
            {isFetchingList && <Loader2 className="animate-spin h-4 w-4 text-gray-400" />}
          </CardTitle>
          <Button
              onClick={handleExportExcel}
              className="bg-primary hover:bg-indigo-700"
              disabled={isLoadingList || nominatifList.length === 0}
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
                <th className="px-4 py-3 text-right">Nominal Awal</th>
                <th className="px-4 py-3 text-right">Sisa Pokok</th>
                <th className="px-4 py-3 text-center">Tenor (Sisa/Total)</th>
                <th className="px-4 py-3">Tgl. Realisasi</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingList ? (
                 <tr>
                   <td colSpan={8} className="text-center p-8">
                     <div className="flex justify-center items-center gap-2">
                       <Loader2 className="animate-spin h-5 w-5 text-primary" />
                       <span>Memuat data nominatif...</span>
                     </div>
                   </td>
                 </tr>
              ) : nominatifList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-gray-500">
                    Tidak ada data nominatif yang ditemukan.
                  </td>
                </tr>
              ) : (
                nominatifList.map((item) => {
                  const statusInfo = getStatusBadge(item.status);
                  // Parsing sisa pokok dari string response API
                  const sisaPokok = item.detail_outstandings_sum_remaining 
                    ? parseFloat(item.detail_outstandings_sum_remaining) 
                    : 0;

                  return (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-indigo-600">
                        {item.reference}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium">{item.user_name}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.category_name}
                        <div className="text-xs text-gray-400">Kode: {item.category_code}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-gray-600">
                        {formatRupiah(item.nominal)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-primary">
                        {/* Jika status belum realisasi (misal 0/pending), sisa pokok mungkin 0 atau null */}
                        {item.status >= 3 ? formatRupiah(sisaPokok) : "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {/* Menampilkan Sisa Tenor / Total Tenor */}
                        {item.status >= 3 ? (
                          <span className="font-medium">
                            {item.detail_outstandings_count} / {item.tenor}
                          </span>
                        ) : (
                          <span className="text-gray-400">- / {item.tenor}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {formatDate(item.realization_date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
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
        *Laporan Nominatif menyajikan posisi sisa pokok (outstanding) per tanggal laporan. Data &quot;Sisa Pokok&quot; hanya muncul untuk pinjaman yang berstatus <strong>Active (Realisasi)</strong>.
      </p>
    </div>
  );
}