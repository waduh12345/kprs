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
  Calendar,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Info,
} from "lucide-react";
import Swal from "sweetalert2";
import { Separator } from "@/components/ui/separator";
import {
  useGetPinjamanListQuery,
  useGetPinjamanDetailsQuery,
  useCreatePaymentHistoryMutation,
  useUpdatePaymentStatusMutation,
} from "@/services/admin/pinjaman.service";

// --- TYPES SESUAI RESPONSE API ---
// ... (Type definitions tetap sama seperti sebelumnya)
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
// ... (Type lain disembunyikan untuk ringkas)

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
    month: "long",
    year: "numeric",
  });
};

// --- KOMPONEN UTAMA ---

export default function AngsuranPembiayaanPage() {
  const [contractNumber, setContractNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // --- API HOOKS ---
  const { data: listData, isFetching: isListFetching } = useGetPinjamanListQuery(
    { page: 1, paginate: 1, searchBySpecific: "reference", search: searchQuery, status: "3" }, // Status 3 = Menunggu Pembayaran
    { skip: searchQuery === "" }
  );

  const { data: detailResponse, isFetching: isDetailFetching, refetch: refetchDetail } = useGetPinjamanDetailsQuery(
    selectedId as number,
    { skip: selectedId === null }
  );

  // 2. Define Mutation Hook
  const [createPaymentHistory] = useCreatePaymentHistoryMutation();
  const [updatePaymentStatus] = useUpdatePaymentStatusMutation();

  const pinjamanDetail = (detailResponse) || null;

  // --- EFFECT & MEMO ---
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
  }, [listData, isListFetching]);

  const billingInfo = useMemo(() => {
    if (!pinjamanDetail || !pinjamanDetail.details) return null;
    const nextBill = pinjamanDetail.details.find((d: PinjamanInstallment) => d.status === false); // false = Belum Lunas
    const outstandingTotal = pinjamanDetail.details
      .filter((d: PinjamanInstallment) => d.status === false)
      .reduce((acc: number, curr: PinjamanInstallment) => acc + curr.remaining, 0);
    const unpaidMonthsCount = pinjamanDetail.details.filter((d: PinjamanInstallment) => d.status === false).length;
    const today = new Date();
    const isLate = nextBill ? new Date(nextBill.due_date) < today : false;

    return { nextBillItem: nextBill, outstandingTotal, remainingTenor: unpaidMonthsCount, isLate };
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

  // --- FUNGSI BAYAR DENGAN FORMDATA ---
  const handlePayment = async () => {
    if (!pinjamanDetail || !billingInfo?.nextBillItem) return;

    const bill = billingInfo.nextBillItem;
    const today = new Date().toISOString().substring(0, 10);

    // Tampilkan Modal Konfirmasi
    const { value: paymentDetails } = await Swal.fire({
      title: "Konfirmasi Pembayaran",
      html: `
        <div class="text-left text-sm font-sans">
          <div class="bg-green-50 p-3 rounded-lg mb-4 border border-green-100 text-center">
             <p class="text-xs text-gray-500 uppercase font-semibold">Total Bayar</p>
             <p class="text-2xl font-bold text-green-700">${formatRupiah(bill.remaining)}</p>
             <p class="text-xs text-gray-500 mt-1">Angsuran Bulan Ke-${bill.month}</p>
          </div>
          
          <div class="space-y-3">
            <div>
                <label class="block font-medium text-gray-700 mb-1">Tanggal Bayar</label>
                <input id="payment_date" type="date" value="${today}" max="${today}" class="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" />
            </div>
            
            <div>
                <label class="block font-medium text-gray-700 mb-1">Metode Bayar</label>
                <select id="payment_method" class="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                    <option value="kas">Tunai (Kas)</option>
                    <option value="transfer">Transfer Bank</option>
                </select>
            </div>

             <div>
                <label class="block font-medium text-gray-700 mb-1">Bukti Bayar (Opsional)</label>
                <input id="payment_proof" type="file" accept="image/*" class="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm cursor-pointer" />
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Bayar Sekarang",
      cancelButtonText: "Batal",
      confirmButtonColor: "#16a34a",
      preConfirm: () => {
        const dateInput = document.getElementById("payment_date") as HTMLInputElement;
        const methodInput = document.getElementById("payment_method") as HTMLSelectElement;
        const fileInput = document.getElementById("payment_proof") as HTMLInputElement;

        if (!dateInput.value) {
          Swal.showValidationMessage("Tanggal pembayaran wajib diisi.");
        }
        return { 
            date: dateInput.value, 
            method: methodInput.value,
            file: fileInput.files?.[0] || null 
        };
      }
    });

    if (!paymentDetails) return;

    setIsProcessing(true);

    try {
      // 3. Buat FormData Object
      const formData = new FormData();
      
      // Append data text
      formData.append("pinjaman_id", String(pinjamanDetail.id));
      formData.append("pinjaman_detail_id", String(bill.id)); // ID spesifik cicilan bulan ini
      formData.append("amount", String(bill.remaining));
      formData.append("type", "manual");
 
      // Append file jika ada
      if (paymentDetails.file) {
        formData.append("image", paymentDetails.file); 
      }

      const result = await createPaymentHistory(formData).unwrap();
      await updatePaymentStatus({ id: result.id, status: '1' }).unwrap();
      Swal.fire({
        icon: "success",
        title: "Pembayaran Berhasil!",
        text: `Angsuran bulan ke-${bill.month} telah berhasil dibayar.`,
        confirmButtonColor: "#16a34a",
      });

      refetchDetail(); // Refresh data agar UI terupdate
    } catch (error: unknown) {
      console.error("Payment Error:", error);
      let errorMessage = "Terjadi kesalahan saat memproses pembayaran.";
      interface ErrorWithMessage {
        data?: {
          message?: string;
        };
      }
      if (
        typeof error === "object" &&
        error !== null &&
        "data" in error &&
        typeof (error as ErrorWithMessage).data === "object" &&
        (error as ErrorWithMessage).data !== null &&
        "message" in (error as ErrorWithMessage).data!
      ) {
        errorMessage = (error as ErrorWithMessage).data?.message || errorMessage;
      }
      Swal.fire({
        icon: "error",
        title: "Gagal Membayar",
        text: errorMessage,
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
        <CreditCard className="h-6 w-6 text-primary" />
        Transaksi Angsuran Pembiayaan
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

      {/* --- KARTU DETAIL TAGIHAN --- */}
      {pinjamanDetail && billingInfo && (
        <Card className="shadow-lg border-t-4 border-green-500 animate-in fade-in-50 slide-in-from-bottom-2">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" /> Detail Tagihan Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Informasi Anggota & Produk */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-dashed">
              <div>
                <p className="text-sm text-gray-500 mb-1">Anggota Koperasi</p>
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-50 p-2 rounded-full text-indigo-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-gray-800">{pinjamanDetail.user.name}</p>
                    <p className="text-xs text-gray-500">{pinjamanDetail.user.email}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Produk Pembiayaan</p>
                <div className="flex items-center gap-3">
                  <div className="bg-green-50 p-2 rounded-full text-green-600">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{pinjamanDetail.category.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{pinjamanDetail.reference}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistik Global Pinjaman */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Pinjaman</p>
                <p className="font-bold text-lg text-gray-800">{formatRupiah(pinjamanDetail.nominal)}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-xs text-red-500 uppercase font-semibold mb-1">Sisa Kewajiban</p>
                <p className="text-xl font-extrabold text-red-600">{formatRupiah(billingInfo.outstandingTotal)}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-500 uppercase font-semibold mb-1">Sisa Tenor</p>
                <p className="font-bold text-lg text-blue-700">
                  {billingInfo.remainingTenor} <span className="text-sm font-normal text-gray-500">/ {pinjamanDetail.tenor} Bulan</span>
                </p>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Informasi Tagihan Bulan Ini */}
            {billingInfo.nextBillItem ? (
              <div className="flex flex-col md:flex-row bg-green-50 rounded-xl border border-green-200 overflow-hidden">
                <div className="md:w-1/3 p-5 bg-green-100/50 border-r border-green-200 flex flex-col justify-center">
                  <p className="text-sm text-green-800 font-medium mb-2">Jatuh Tempo</p>
                  <div className="flex items-center gap-2 text-green-900 mb-3">
                    <Calendar className="h-5 w-5" />
                    <span className="text-lg font-bold">{formatDate(billingInfo.nextBillItem.due_date)}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white text-green-700 border border-green-200 shadow-sm">
                      Angsuran Ke-{billingInfo.nextBillItem.month}
                    </span>
                    {billingInfo.isLate && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700 border border-red-200 shadow-sm animate-pulse">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Terlambat
                      </span>
                    )}
                  </div>
                </div>

                <div className="md:w-2/3 p-5">
                  <p className="text-xs font-bold text-green-800 uppercase tracking-wide mb-3">Rincian Tagihan</p>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-500 mb-0.5">Pokok</p>
                      <p className="font-semibold text-gray-800">{formatRupiah(pinjamanDetail.monthly_principal)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">Jasa/Bunga</p>
                      <p className="font-semibold text-gray-800">{formatRupiah(pinjamanDetail.monthly_interest)}</p>
                    </div>
                  </div>

                  <div className="border-t border-green-200 pt-3 flex justify-between items-center">
                    <span className="font-bold text-gray-600 text-sm">TOTAL TAGIHAN</span>
                    <span className="text-2xl font-extrabold text-green-700">{formatRupiah(billingInfo.nextBillItem.remaining)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-3" />
                <p className="text-lg font-bold text-gray-800">Pinjaman Lunas!</p>
                <p className="text-sm text-gray-500">Tidak ada tagihan berjalan untuk kontrak ini.</p>
              </div>
            )}
          </CardContent>

          {billingInfo.nextBillItem && (
            <CardContent className="pt-0 pb-6">
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 transition-all hover:scale-[1.01] active:scale-[0.98]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-5 w-5" />
                    Bayar Angsuran
                  </>
                )}
              </Button>
            </CardContent>
          )}
        </Card>
      )}

      {!pinjamanDetail && !isLoadingData && !searchError && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 opacity-60 border-2 border-dashed rounded-xl">
          <Info className="h-16 w-16 mb-4" />
          <p className="text-lg font-medium">Masukkan nomor kontrak untuk melihat tagihan.</p>
        </div>
      )}
    </div>
  );
}