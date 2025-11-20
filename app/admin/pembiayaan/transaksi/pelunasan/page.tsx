"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  DollarSign,
  User,
  CreditCard,
  CheckCircle,
  Loader2,
  Info,
  List,
  Calendar,
} from "lucide-react";
import Swal from "sweetalert2";
import { Separator } from "@/components/ui/separator";
import {
  useGetPinjamanListQuery,
  useGetPinjamanDetailsQuery,
  useCreatePaymentHistoryMutation,
  useUpdatePaymentStatusMutation,
  useBulkSettlementMutation,
} from "@/services/admin/pinjaman.service";

// --- TYPES (SAMA SEPERTI SEBELUMNYA) ---
interface PinjamanUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

interface PinjamanCategory {
  id: number;
  code: string;
  name: string;
}

interface PinjamanInstallment {
  id: number;
  pinjaman_id: number;
  month: number;
  paid: number;
  remaining: number;
  due_date: string;
  paid_at: string | null;
  description: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

interface PinjamanDetail {
  id: number;
  reference: string;
  user_id: number;
  nominal: number;
  tenor: number;
  status: number;
  monthly_principal: number;
  monthly_interest: number;
  monthly_installment: number;
  user: PinjamanUser;
  category: PinjamanCategory;
  details: PinjamanInstallment[];
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
  });
};

// --- KOMPONEN UTAMA ---

export default function PelunasanPembiayaanPage() {
  const [contractNumber, setContractNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // 1. QUERY LIST
  const { data: listData, isFetching: isListFetching } = useGetPinjamanListQuery(
    { 
      page: 1, 
      paginate: 1, 
      searchBySpecific: "reference", 
      search: searchQuery, 
      status: "3" // Status Aktif/Realisasi
    },
    { skip: searchQuery === "" }
  );

  // 2. QUERY DETAIL
  const { 
    data: detailResponse, 
    isFetching: isDetailFetching, 
    refetch: refetchDetail 
  } = useGetPinjamanDetailsQuery(
    selectedId as number,
    { skip: selectedId === null }
  );

  // 3. MUTATIONS

  const [bulkSettlement] = useBulkSettlementMutation();

  const pinjamanDetail = (detailResponse as PinjamanDetail) || null;

  // --- EFFECT SEARCH ---
  useEffect(() => {
    if (!isListFetching && searchQuery !== "") {
      const foundItem = listData?.data?.[0];
      if (foundItem && foundItem.reference.toLowerCase().includes(searchQuery.toLowerCase())) {
        setSelectedId(foundItem.id);
        setSearchError(null);
      } else {
        setSelectedId(null);
        setSearchError(`Nomor Kontrak "${contractNumber}" tidak ditemukan.`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listData, isListFetching]);

  // --- LOGIKA PELUNASAN (Hitung Total Sisa) ---
  const pelunasanInfo = useMemo(() => {
    if (!pinjamanDetail || !pinjamanDetail.details) return null;

    // Ambil semua angsuran yang belum lunas
    const unpaidInstallments = pinjamanDetail.details.filter((d) => d.status === false);
    
    // Hitung total nominal yang harus dilunasi
    const totalAmount = unpaidInstallments.reduce((acc, curr) => acc + curr.remaining, 0);
    
    const remainingMonths = unpaidInstallments.length;

    return {
        unpaidInstallments,
        totalAmount,
        remainingMonths
    };
  }, [pinjamanDetail]);

  // --- HANDLERS ---

  const handleSearch = () => {
    if (!contractNumber.trim()) {
      setSearchError("Masukkan Nomor Kontrak Pembiayaan.");
      return;
    }
    setSearchError(null);
    setSelectedId(null);
    setSearchQuery(contractNumber.trim());
  };

  const handlePelunasan = async () => {
    if (!pinjamanDetail || !pelunasanInfo) return;

    const { totalAmount, unpaidMonthsCount } = { 
        totalAmount: pelunasanInfo.totalAmount, 
        unpaidMonthsCount: pelunasanInfo.remainingMonths 
    };
    
    const today = new Date().toISOString().substring(0, 10);

    const { value: paymentDetails } = await Swal.fire({
      title: "Konfirmasi Pelunasan",
      width: '600px',
      html: `
        <div class="text-left text-sm font-sans">
          <div class="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100 text-center">
             <p class="text-xs text-gray-500 uppercase font-semibold">Total Wajib Bayar</p>
             <p class="text-3xl font-extrabold text-blue-700 tracking-tight">${formatRupiah(totalAmount)}</p>
             <p class="text-xs text-gray-500 mt-1">Melunasi ${unpaidMonthsCount} bulan sisa angsuran</p>
          </div>
        
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Proses Pelunasan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#2563eb", // Blue
      reverseButtons: true,
    });

    if (!paymentDetails) return;

    setIsProcessing(true);

    try {
      const payload = pelunasanInfo.unpaidInstallments.map((item) => item.id);
      const result = await bulkSettlement(payload).unwrap();

      Swal.fire({
        icon: "success",
        title: "Pelunasan Berhasil!",
        text: `Pembiayaan telah berhasil dilunasi sebesar ${formatRupiah(totalAmount)}.`,
        confirmButtonColor: "#2563eb",
      });

      refetchDetail();
    } catch (error: any) {
      console.error("Payment Error:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal Memproses",
        text: error?.data?.message || "Terjadi kesalahan saat memproses pelunasan.",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoadingData = isListFetching || isDetailFetching;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <CheckCircle className="h-6 w-6 text-primary" />
        Pelunasan Pembiayaan (Settlement)
      </h2>

      {/* --- KARTU PENCARIAN --- */}
      <Card className="shadow-lg border-t-4 border-indigo-500">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-indigo-600">
            <Search className="h-5 w-5" /> Cari Kontrak Pinjaman
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 items-end">
          <div className="flex-grow space-y-2">
            <Label htmlFor="kontrak">Nomor Referensi / Kontrak</Label>
            <Input
              id="kontrak"
              placeholder="Contoh: PINJ/20251120/00002"
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              disabled={isLoadingData || isProcessing}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isLoadingData || isProcessing}
            className="h-10 min-w-[100px]"
          >
            {isLoadingData ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>
        </CardContent>
        {searchError && <p className="text-sm text-red-500 px-6 pb-4">{searchError}</p>}
      </Card>

      {/* --- KARTU DETAIL & DAFTAR TAGIHAN --- */}
      {pinjamanDetail && pelunasanInfo && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-50 slide-in-from-bottom-2">
            
          {/* KOLOM KIRI: Summary & Action */}
          <div className="lg:col-span-1 space-y-6">
             <Card className="shadow-md border-l-4 border-blue-600">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                        <User className="h-5 w-5" /> Data Anggota
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-500">Nama Anggota</p>
                        <p className="font-bold text-gray-800">{pinjamanDetail.user.name}</p>
                        <p className="text-xs text-gray-500">{pinjamanDetail.user.email}</p>
                    </div>
                    <Separator />
                    <div>
                        <p className="text-sm text-gray-500">Produk Pembiayaan</p>
                        <p className="font-semibold text-gray-800">{pinjamanDetail.category.name}</p>
                        <p className="text-xs font-mono bg-gray-100 inline-block px-2 py-0.5 rounded mt-1">{pinjamanDetail.reference}</p>
                    </div>
                </CardContent>
             </Card>

             <Card className="shadow-lg bg-blue-50 border border-blue-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-blue-900">Ringkasan Pelunasan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700">Sisa Tenor</span>
                        <span className="font-bold text-blue-900">{pelunasanInfo.remainingMonths} Bulan</span>
                    </div>
                    <Separator className="bg-blue-200"/>
                    <div>
                        <p className="text-sm text-blue-700 mb-1">Total Tagihan Pelunasan</p>
                        <p className="text-3xl font-extrabold text-blue-800">{formatRupiah(pelunasanInfo.totalAmount)}</p>
                    </div>
                    
                    {pelunasanInfo.remainingMonths > 0 ? (
                         <Button
                            onClick={handlePelunasan}
                            disabled={isProcessing}
                            className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                        >
                            {isProcessing ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memproses...</>
                            ) : (
                                <><DollarSign className="mr-2 h-5 w-5" /> Lunasi Sekarang</>
                            )}
                        </Button>
                    ) : (
                        <div className="bg-green-100 text-green-800 p-3 rounded-md text-center font-bold flex items-center justify-center gap-2">
                            <CheckCircle className="h-5 w-5"/> SUDAH LUNAS
                        </div>
                    )}
                   
                </CardContent>
             </Card>
          </div>

          {/* KOLOM KANAN: List Detail Angsuran */}
          <Card className="lg:col-span-2 shadow-md h-fit">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-gray-800">
                <List className="h-5 w-5" /> Rincian Angsuran Belum Lunas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {pelunasanInfo.unpaidInstallments.length > 0 ? (
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3">Bulan Ke</th>
                                    <th className="px-6 py-3">Jatuh Tempo</th>
                                    <th className="px-6 py-3 text-right">Nominal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pelunasanInfo.unpaidInstallments.map((item) => (
                                    <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {item.month}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4"/>
                                                {formatDate(item.due_date)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-800">
                                            {formatRupiah(item.remaining)}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                                    <td className="px-6 py-4 text-right" colSpan={2}>TOTAL PELUNASAN</td>
                                    <td className="px-6 py-4 text-right text-blue-700 text-lg">
                                        {formatRupiah(pelunasanInfo.totalAmount)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-green-600 bg-green-50 m-4 rounded-lg">
                        <CheckCircle className="h-12 w-12 mb-2" />
                        <p className="font-bold text-lg">Tidak ada tagihan tersisa.</p>
                        <p className="text-sm">Pinjaman ini sudah lunas.</p>
                    </div>
                )}
            </CardContent>
          </Card>

        </div>
      )}

      {/* Empty State */}
      {!pinjamanDetail && !isLoadingData && !searchError && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 opacity-60 border-2 border-dashed rounded-xl">
          <Info className="h-16 w-16 mb-4" />
          <p className="text-lg font-medium">Masukkan nomor kontrak untuk melakukan pelunasan.</p>
        </div>
      )}
    </div>
  );
}