"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  CreditCard,
  Loader2,
  User,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Building2, // Icon bank
} from "lucide-react";
import Swal from "sweetalert2";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/format-utils";

// --- SERVICES ---
import {
  useGetWalletListQuery,
  useCreatePenarikanSimpananWalletMutation,
} from "@/services/admin/penarikan-simpanan.service";

import { useCreateSimpananSetoranMutation, useUpdateSimpananStatusMutation } from "@/services/admin/simpanan/simpanan.service";

import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { Wallet } from "@/types/admin/penarikan-simpanan";
import type { CreateSimpananRequest } from "@/types/admin/simpanan";

/* Helper: parse nominal & format */
const parseNominal = (value: string) => {
  const parsed = parseFloat(value.replace(/[^0-9]/g, ""));
  return isNaN(parsed) ? 0 : parsed;
};

function extractMessageFromFetchBaseQueryError(
  fbq: FetchBaseQueryError
): string {
  const data = (fbq as unknown as { data?: unknown }).data;
  if (typeof data === "string") return data;
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    if ("message" in d && typeof d.message === "string") return d.message;
    if ("errors" in d) {
      try {
        return JSON.stringify(d.errors);
      } catch {
        // fallback
      }
    }
  }
  if ("status" in fbq) {
    return `Error ${String((fbq as FetchBaseQueryError & { status?: unknown }).status ?? "")}`.trim();
  }
  return "Terjadi kesalahan pada server";
}

export default function TransaksiSimpananPage() {
  // --- State Data ---
  const [rekeningNumber, setRekeningNumber] = useState("");
  const [dataRekening, setDataRekening] = useState<Wallet | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchError, setSearchError] = useState<string | null>(null);

  // --- State Form Transaksi ---
  const [transaksiType, setTransaksiType] = useState<"SETOR" | "TARIK">("SETOR");
  const [nominalInput, setNominalInput] = useState<string>("");
  const [keterangan, setKeterangan] = useState<string>("");
  
  // --- State Khusus Penarikan (Bank Info) ---
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);

  const nominalTransaksi = useMemo(
    () => parseNominal(nominalInput),
    [nominalInput]
  );

  // =====================================================================
  // 1. QUERY: Cek Wallet / Cari Rekening
  // =====================================================================
  const {
    data: walletResp,
    isFetching: walletFetching,
    isLoading: walletLoading,
    refetch: refetchWallet,
  } = useGetWalletListQuery(
    {
      page: 1,
      paginate: 1,
      searchBySpecific: "account_number",
      search: searchQuery,
    },
    { skip: searchQuery.trim() === "" }
  );

  const foundWallet: Wallet | null =
    walletResp && Array.isArray(walletResp.data) && walletResp.data.length > 0
      ? walletResp.data[0]
      : null;

  // =====================================================================
  // 2. MUTATIONS
  // =====================================================================
  const [createSetoran, { isLoading: loadingSetor }] = useCreateSimpananSetoranMutation();
  const [createPenarikan, { isLoading: loadingTarik }] = useCreatePenarikanSimpananWalletMutation();
  const [updateSimpananStatus] = useUpdateSimpananStatusMutation();

  const isSearching = walletFetching || walletLoading;

  // --- Handlers ---

  const handleSearch = () => {
    setSearchError(null);
    setDataRekening(null);

    const trimmed = rekeningNumber.trim();
    if (!trimmed) {
      setSearchError("Masukkan Nomor Rekening Simpanan.");
      return;
    }
    setSearchQuery(trimmed);
  };

  // Reset form bank jika tipe transaksi berubah ke SETOR
  useEffect(() => {
    if (transaksiType === "SETOR") {
      setBankName("");
      setBankAccountName("");
      setBankAccountNumber("");
    }
  }, [transaksiType]);

  useEffect(() => {
    if (foundWallet) {
      setDataRekening(foundWallet);
      setSearchError(null);
    } else if (searchQuery.trim() !== "" && !isSearching) {
      setDataRekening(null);
      setSearchError(`Nomor Rekening ${searchQuery} tidak ditemukan.`);
    }
  }, [foundWallet, isSearching, searchQuery]);

  const handleTransaksi = async () => {
    // 1. Validasi Dasar
    if (!dataRekening) {
      await Swal.fire("Gagal", "Pilih rekening terlebih dahulu.", "error");
      return;
    }
    if (nominalTransaksi <= 0) {
      await Swal.fire("Gagal", "Nominal transaksi harus lebih dari nol.", "error");
      return;
    }

    // 2. Validasi Khusus Penarikan
    if (transaksiType === "TARIK") {
      const currentBalance = dataRekening.balance ?? 0;
      
      // Cek Saldo
      if (nominalTransaksi > currentBalance) {
        await Swal.fire({
          icon: "error",
          title: "Saldo Tidak Cukup",
          text: `Saldo saat ini: ${formatRupiah(currentBalance)}, Penarikan: ${formatRupiah(nominalTransaksi)}`
        });
        return;
      }

      // Cek Kelengkapan Data Bank
      if (!bankName || !bankAccountName || !bankAccountNumber) {
        await Swal.fire("Gagal", "Mohon lengkapi data Bank Tujuan Transfer.", "warning");
        return;
      }
    }

    // Konfirmasi User
    const confirmResult = await Swal.fire({
      title: `Konfirmasi ${transaksiType === "SETOR" ? "Setoran" : "Penarikan"}`,
      text: `Anda akan melakukan transaksi sebesar ${formatRupiah(nominalTransaksi)}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Proses",
      cancelButtonText: "Batal",
      confirmButtonColor: transaksiType === "SETOR" ? "#16a34a" : "#dc2626",
    });

    if (!confirmResult.isConfirmed) return;

    setIsProcessing(true);
    const today = new Date().toISOString().split("T")[0];

    try {
      if (transaksiType === "SETOR") {
        // --- LOGIKA SETORAN ---
        const payload: CreateSimpananRequest = {
          simpanan_category_id: (dataRekening.reference?.id as number) ?? 0,
          user_id: (dataRekening.user?.id as number) ?? 0,
          description: keterangan || "Setoran Tunai",
          date: today,
          nominal: Number(nominalTransaksi),
          type: "manual",
          image: undefined,
        };
        // Create setoran, get response
        const response = await createSetoran(payload).unwrap();
        // Ambil id dari response, lalu update status
        const id = Number(response?.id);
        if (id) {
          await updateSimpananStatus({ id, status: 1 }).unwrap();
        }
        await Swal.fire("Berhasil", `Setoran ${formatRupiah(nominalTransaksi)} berhasil.`, "success");
        // await Swal.fire("Berhasil", `Setoran ${formatRupiah(nominalTransaksi)} berhasil.`, "success");

      } else {
        // --- LOGIKA PENARIKAN ---
        const payload = {
          user_id: (dataRekening.user?.id as number) ?? 0,
          // wallet_id: dataRekening.id, // Opsional: jika backend butuh ID wallet
          bank_name: bankName,
          bank_account_name: bankAccountName,
          bank_account_number: bankAccountNumber,
          amount: String(nominalTransaksi),
          description: keterangan || "Penarikan Tunai",
        };

        await createPenarikan(payload).unwrap();
        await Swal.fire("Berhasil", `Penarikan ${formatRupiah(nominalTransaksi)} berhasil diproses.`, "success");
      }

      // --- Post Success Actions ---
      // refetchWallet();
      // setNominalInput("");
      // setKeterangan("");
      // setBankName("");
      // setBankAccountName("");
      // setBankAccountNumber("");

    } catch (err) {
      console.error(err);
      if (typeof err === "object" && err !== null && "status" in err) {
        const fbq = err as FetchBaseQueryError;
        const msg = extractMessageFromFetchBaseQueryError(fbq);
        await Swal.fire("Gagal", msg, "error");
      } else {
        await Swal.fire("Gagal", String(err ?? "Error"), "error");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const isReferenceSukarela = (dataRekening?.reference?.name ?? "").toLowerCase().includes("sukarela");

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-primary" />
        Transaksi Simpanan (Setor & Tarik)
      </h2>

      {/* KARTU PENCARIAN */}
      <Card className="shadow-lg border-t-4 border-indigo-500">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-indigo-600">
            <Search className="h-5 w-5" /> Cari Rekening Anggota
          </CardTitle>
        </CardHeader>

        <CardContent className="flex gap-4 items-end">
          <div className="flex-grow space-y-2">
            <Label htmlFor="rekening">Nomor Rekening Simpanan</Label>
            <Input
              id="rekening"
              placeholder="Contoh: SWJ-001"
              value={rekeningNumber}
              onChange={(e) => setRekeningNumber(e.target.value.toUpperCase())}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              disabled={isSearching || isProcessing}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isSearching || isProcessing}
            className="h-10"
          >
            {isSearching ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>
        </CardContent>

        {searchError && (
          <p className="text-sm text-red-500 px-6 pb-4">{searchError}</p>
        )}
      </Card>

      {/* KARTU DETAIL & TRANSAKSI */}
      {dataRekening && (
        <Card className="shadow-lg border-t-4 border-green-500">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-green-600">
              <CheckCircleIcon className="h-5 w-5" /> Detail & Input Transaksi
            </CardTitle>
          </CardHeader>

          <CardContent>
            {/* Info Nasabah */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-4 border-b">
              <div>
                <p className="text-sm text-gray-500">Anggota</p>
                <p className="font-bold flex items-center gap-1 text-lg">
                  <User className="h-4 w-4" /> {dataRekening.user?.name ?? "-"}
                </p>
                <span className="text-xs text-gray-400">ID: {dataRekening.user_id}</span>
              </div>

              <div>
                <p className="text-sm text-gray-500">Produk Simpanan</p>
                <p className="font-semibold text-lg">
                  {dataRekening.reference?.name ?? "-"}{" "}
                </p>
                <Badge variant="secondary">
                  {dataRekening.reference?.code ?? ""}
                </Badge>
              </div>

              <div className="md:text-right">
                <p className="text-sm text-gray-500">Saldo Saat Ini</p>
                <p className="text-2xl font-bold text-primary">
                  {formatRupiah(dataRekening.balance ?? 0)}
                </p>
              </div>
            </div>

            {/* Form Input Utama */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* KOLOM KIRI: Tipe & Nominal */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="type">Jenis Transaksi</Label>
                  <Select
                    onValueChange={(v) => setTransaksiType(v as "SETOR" | "TARIK")}
                    value={transaksiType}
                  >
                    <SelectTrigger id="type" className="w-full">
                      <SelectValue placeholder="Pilih Tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SETOR">Setoran (Deposit)</SelectItem>
                      <SelectItem value="TARIK">Penarikan (Withdrawal)</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {transaksiType === "TARIK" && !isReferenceSukarela && (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                      Perhatian: Produk ini mungkin tidak mengizinkan penarikan bebas.
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nominal">Nominal (Rp)</Label>
                  <Input
                    id="nominal"
                    placeholder="0"
                    value={nominalInput}
                    onChange={(e) => {
                      const raw = e.target.value ?? "";
                      const digitsOnly = String(raw).replace(/\D/g, "");
                      const asNumber = digitsOnly === "" ? 0 : parseInt(digitsOnly, 10);
                      setNominalInput(formatRupiah(asNumber));
                    }}
                    disabled={isProcessing}
                    className="font-bold text-lg text-right tracking-wider h-12"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
                  <Input
                    id="keterangan"
                    placeholder="Contoh: Setoran awal bulan"
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
              </div>

              {/* KOLOM KANAN: Informasi Bank (Hanya jika TARIK) */}
              {transaksiType === "TARIK" && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 border-b pb-2">
                    <Building2 className="h-4 w-4" /> Informasi Tujuan Transfer
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bankName" className="text-xs">Nama Bank</Label>
                    <Input
                      id="bankName"
                      placeholder="Contoh: BCA, Mandiri, BRI"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      disabled={isProcessing}
                      className="bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="accNumber" className="text-xs">No. Rekening</Label>
                      <Input
                        id="accNumber"
                        placeholder="123xxxxxx"
                        value={bankAccountNumber}
                        type="number"
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        disabled={isProcessing}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accName" className="text-xs">Atas Nama</Label>
                      <Input
                        id="accName"
                        placeholder="Nama Pemilik"
                        value={bankAccountName}
                        onChange={(e) => setBankAccountName(e.target.value)}
                        disabled={isProcessing}
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <Button
              onClick={handleTransaksi}
              disabled={isProcessing || nominalTransaksi <= 0 || loadingSetor || loadingTarik}
              className={`w-full text-lg py-6 transition-colors mt-4 ${
                transaksiType === "SETOR"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Memproses...
                </>
              ) : (
                <>
                  {transaksiType === "SETOR" ? (
                    <TrendingUpIcon className="mr-2 h-6 w-6" />
                  ) : (
                    <TrendingDownIcon className="mr-2 h-6 w-6" />
                  )}
                  Proses {transaksiType === "SETOR" ? "Setor Tunai" : "Tarik Tunai"}{" "}
                  {formatRupiah(nominalTransaksi)}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {!dataRekening && !isSearching && !searchError && (
        <div className="flex flex-col items-center justify-center mt-10 text-gray-400">
          <Search className="h-16 w-16 mb-2 opacity-20" />
          <p>Masukkan Nomor Rekening di atas untuk memulai.</p>
        </div>
      )}
    </div>
  );
}