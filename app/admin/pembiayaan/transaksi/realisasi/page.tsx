"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProdukToolbar } from "@/components/ui/produk-toolbar";
import {
  useGetPinjamanListQuery,
  useUpdatePinjamanStatusMutation,
} from "@/services/admin/pinjaman.service";
import {
  ListChecks,
  CheckCircle,
  User,
  Zap,
  Play,
  Loader2,
  CalendarIcon,
  Info,
} from "lucide-react";
import Swal from "sweetalert2";
import { Pinjaman } from "@/types/admin/pinjaman";

// --- TYPES SESUAI RESPONSE API ---

// Note: Kita menggunakan Type Pinjaman dari @/types/admin/pinjaman langsung
// Namun kita perlu memastikan interface PinjamanData lokal ini mappingnya benar jika ada custom field
interface PinjamanData extends Pinjaman {
    // Tambahan properti frontend helper jika perlu
}

// --- HELPER FUNCTIONS ---

const formatRupiah = (number: number) => {
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
  });
};

// Helper status badge
const getStatusLabel = (status: number) => {
  switch (status) {
    case 1: return { label: "Disetujui", variant: "default" as const }; // Biru/Hitam
    case 2: return { label: "Realisasi", variant: "success" as const }; // Hijau
    default: return { label: "Pending", variant: "secondary" as const };
  }
};

// --- KOMPONEN UTAMA ---

export default function RealisasiPembiayaanPage() {
  const [query, setQuery] = useState("");
  
  // Pagination State
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // 1. FETCH DATA API
  const { data: apiResponse, isLoading, isFetching, refetch } = useGetPinjamanListQuery({
    page: currentPage,
    paginate: itemsPerPage,
    status: '1', // Filter status Disetujui
    search: query
  });

  const pinjamanList = (apiResponse?.data) || [];
  
  // 2. MUTATION
  const [updateStatus, { isLoading: isUpdating }] = useUpdatePinjamanStatusMutation();

  // 3. FILTERING CLIENT SIDE (Backup safety)
  const listSiapRealisasi = useMemo(() => {
    return pinjamanList.filter((item) => Number(item.status) === 1);
  }, [pinjamanList]);


  // --- HANDLER REALISASI (MODAL DIPERBAIKI) ---
  const handleRealisasi = async (item: Pinjaman) => {
    const today = new Date().toISOString().substring(0, 10);
    
    const { value: tanggalReal } = await Swal.fire({
      title: "Konfirmasi Pencairan Dana",
      width: '500px',
      html: `
        <div class="flex flex-col gap-4 text-left font-sans">
            <div class="bg-green-50 border border-green-100 p-4 rounded-xl text-center shadow-sm">
                <p class="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Total Nominal Realisasi</p>
                <p class="text-3xl font-bold text-green-700 tracking-tight">${formatRupiah(item.nominal)}</p>
            </div>

            <div class="grid grid-cols-2 gap-y-3 gap-x-4 text-sm p-2">
                <div>
                    <p class="text-xs text-gray-400 uppercase font-medium">No. Referensi</p>
                    <p class="font-semibold text-gray-800 truncate" title="${item.reference}">${item.reference}</p>
                </div>
                 <div>
                    <p class="text-xs text-gray-400 uppercase font-medium">Anggota</p>
                    <p class="font-semibold text-gray-800 truncate" title="${item.user_name}">${item.user_name}</p>
                </div>
                 <div class="col-span-2">
                    <p class="text-xs text-gray-400 uppercase font-medium">Produk Pembiayaan</p>
                    <p class="font-semibold text-gray-800 text-sm">${item.category_name}</p>
                </div>
            </div>

            <hr class="border-gray-100" />

            <div class="space-y-1.5">
                <label for="tanggal_realisasi" class="block text-sm font-medium text-gray-700">
                    Tanggal Pencairan Dana
                </label>
                <input
                    id="tanggal_realisasi"
                    type="date"
                    value="${today}"
                    class="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
            </div>

            <div class="flex items-start gap-2 bg-amber-50 p-3 rounded-lg border border-amber-100">
                <div class="mt-0.5 text-amber-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                </div>
                <p class="text-xs text-amber-800 leading-relaxed">
                    Pastikan dana telah ditransfer ke rekening anggota. Tindakan ini akan mengubah status menjadi <b>Aktif</b> dan memulai perhitungan angsuran.
                </p>
            </div>
        </div>
      `,
      icon: undefined, // Kita custom layoutnya, jadi icon default dimatikan agar layout lebih clean
      showCancelButton: true,
      confirmButtonColor: "#16a34a", // Hijau
      cancelButtonColor: "#6b7280", // Abu-abu
      confirmButtonText: "Ya, Cairkan Dana",
      cancelButtonText: "Batal",
      reverseButtons: true,
      focusConfirm: false,
      customClass: {
        popup: 'rounded-xl',
        confirmButton: 'px-6 py-2.5 font-medium rounded-lg',
        cancelButton: 'px-6 py-2.5 font-medium rounded-lg'
      },
      preConfirm: () => {
        const dateInput = document.getElementById("tanggal_realisasi") as HTMLInputElement;
        if (!dateInput?.value) {
          Swal.showValidationMessage("Tanggal realisasi wajib diisi");
        }
        return dateInput.value;
      }
    });

    if (tanggalReal) {
      try {
        // Panggil API Update Status
        // Asumsi: Status 3 = Realisasi/Aktif. Sesuaikan dengan logic backend.
        await updateStatus({
          id: item.id,
          status: "3", // Sesuaikan status ID untuk "Realisasi"
          realization_date: tanggalReal
        }).unwrap();

        Swal.fire({
            title: "Berhasil!",
            text: "Pembiayaan berhasil direalisasi.",
            icon: "success",
            confirmButtonColor: "#16a34a"
        });
        refetch();
      } catch (error) {
        console.error(error);
        Swal.fire("Gagal", "Terjadi kesalahan saat memproses realisasi.", "error");
      }
    }
  };
  
  // --- HANDLER DETAIL (DIPERBAIKI JUGA SEDIKIT) ---
  const handleDetail = (item: Pinjaman) => {
    Swal.fire({
      title: "Detail Pengajuan",
      html: `
        <div class="text-left space-y-2 text-sm font-sans">
          <div class="grid grid-cols-3 gap-2 py-1 border-b border-gray-100">
            <span class="text-gray-500 col-span-1">No. Referensi</span>
            <span class="font-medium text-gray-900 col-span-2 text-right">${item.reference}</span>
          </div>
          <div class="grid grid-cols-3 gap-2 py-1 border-b border-gray-100">
            <span class="text-gray-500 col-span-1">Anggota</span>
            <span class="font-medium text-gray-900 col-span-2 text-right">${item.user_name}</span>
          </div>
          <div class="grid grid-cols-3 gap-2 py-1 border-b border-gray-100">
            <span class="text-gray-500 col-span-1">Produk</span>
            <span class="font-medium text-gray-900 col-span-2 text-right">${item.category_name}</span>
          </div>
          <div class="grid grid-cols-3 gap-2 py-1 border-b border-gray-100">
            <span class="text-gray-500 col-span-1">Nominal</span>
            <span class="font-bold text-green-700 col-span-2 text-right">${formatRupiah(item.nominal)}</span>
          </div>
          <div class="grid grid-cols-3 gap-2 py-1 border-b border-gray-100">
            <span class="text-gray-500 col-span-1">Tenor</span>
            <span class="font-medium text-gray-900 col-span-2 text-right">${item.tenor} Bulan</span>
          </div>
          <div class="grid grid-cols-3 gap-2 py-1 border-b border-gray-100">
            <span class="text-gray-500 col-span-1">Tgl. Setuju</span>
            <span class="font-medium text-gray-900 col-span-2 text-right">${formatDate(item.date)}</span>
          </div>
          <div class="mt-3 bg-gray-50 p-2 rounded text-xs">
            <span class="block text-gray-400 mb-1 uppercase font-semibold">Deskripsi:</span>
            <span class="text-gray-700 italic">${item.description || "-"}</span>
          </div>
        </div>
      `,
      confirmButtonText: "Tutup",
      confirmButtonColor: "#374151",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Zap className="h-6 w-6 text-primary" />
        Realisasi Pembiayaan
      </h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-indigo-600">
            <ListChecks className="h-5 w-5" />
            Daftar Siap Realisasi
          </CardTitle>
          <p className="text-sm text-gray-500">
            Menampilkan pengajuan dengan status <b>Disetujui</b> yang menunggu pencairan dana.
          </p>
        </CardHeader>
        <CardContent>
          <ProdukToolbar
            onSearchChange={setQuery}
            showAddButton={false} 
            enableStatusFilter={false}
            showTemplateCsvButton={false}
            enableImport={false}
            enableExport={false}
          />

          <div className="mt-4 p-0 overflow-x-auto rounded-md border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-4 py-3 w-[140px]">Aksi</th>
                  <th className="px-4 py-3">No. Ref</th>
                  <th className="px-4 py-3">Anggota</th>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3 text-right">Nominal Disetujui</th>
                  <th className="px-4 py-3 text-center">Tenor</th>
                  <th className="px-4 py-3">Tgl. Setuju</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading || isFetching ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8 text-gray-500">
                        <Loader2 className="h-6 w-6 inline mr-2 animate-spin text-primary" />
                        Memuat data...
                    </td>
                  </tr>
                ) : listSiapRealisasi.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8 text-gray-500">
                      Tidak ada data pengajuan yang siap direalisasi.
                    </td>
                  </tr>
                ) : (
                  listSiapRealisasi.map((item) => {
                    const statusInfo = getStatusLabel(Number(item.status));
                    return (
                    <tr key={item.id} className="border-t hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                            onClick={() => handleRealisasi(item)}
                            disabled={isUpdating}
                          >
                            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin"/> : <Play className="h-3 w-3 mr-1" />} 
                            Cairkan
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDetail(item)}
                          >
                            <Info className="h-4 w-4 text-gray-500" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                        {item.reference}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                            <div className="bg-indigo-100 p-1 rounded-full">
                                <User className="h-3 w-3 text-indigo-600"/>
                            </div>
                            <span className="font-medium">{item.user_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate" title={item.category_name}>
                        {item.category_name}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-green-700 whitespace-nowrap">
                        {formatRupiah(item.nominal)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className="bg-gray-50">
                            {item.tenor} Bln
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                        <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3"/>
                            {formatDate(item.date)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={statusInfo.variant}>
                          <CheckCircle className="h-3 w-3 mr-1" /> {statusInfo.label}
                        </Badge>
                      </td>
                    </tr>
                  )})
                )}
              </tbody>
            </table>
          </div>
          
           {/* Pagination Simple */}
           <div className="flex justify-end mt-4 gap-2">
             <Button 
               variant="outline" 
               size="sm" 
               onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
               disabled={currentPage === 1 || isLoading}
             >
               Previous
             </Button>
             <Button 
               variant="outline" 
               size="sm" 
               onClick={() => setCurrentPage(p => p + 1)}
               disabled={listSiapRealisasi.length < itemsPerPage || isLoading}
             >
               Next
             </Button>
           </div>

        </CardContent>
      </Card>
    </div>
  );
}