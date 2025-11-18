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

import { useGetWalletListQuery } from "@/services/admin/penarikan-simpanan.service";
import { useCreateSimpananMutation } from "@/services/admin/simpanan.service";
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
    try {
      return JSON.stringify(d);
    } catch {
      // noop
    }
  }
  if ("status" in fbq) {
    const status = (fbq as unknown as { status?: unknown }).status;
    return `Error ${String(status ?? "")}`.trim();
  }
  return "Terjadi kesalahan pada server";
}

export default function TransaksiSimpananPage() {
  const [rekeningNumber, setRekeningNumber] = useState("");
  const [dataRekening, setDataRekening] = useState<Wallet | null>(null);

  // search trigger: value passed to query
  const [searchQuery, setSearchQuery] = useState<string>("");

  // transaksi state
  const [transaksiType, setTransaksiType] = useState<"SETOR" | "TARIK">(
    "SETOR"
  );
  const [nominalInput, setNominalInput] = useState<string>("");
  const [keterangan, setKeterangan] = useState<string>("");

  // processing flags
  const [isProcessing, setIsProcessing] = useState(false);

  // error message for search
  const [searchError, setSearchError] = useState<string | null>(null);

  const nominalTransaksi = useMemo(
    () => parseNominal(nominalInput),
    [nominalInput]
  );

  // === Wallet search query (RTK Query) ===
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

  // === Mutations ===
  const [createSimpanan] = useCreateSimpananMutation();

  const isSearching = walletFetching || walletLoading;

  // === Handlers ===
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

  // sync dataRekening from query result
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
    if (!dataRekening) {
      await Swal.fire("Gagal", "Pilih rekening terlebih dahulu.", "error");
      return;
    }
    if (nominalTransaksi <= 0) {
      await Swal.fire(
        "Gagal",
        "Nominal transaksi harus lebih dari nol.",
        "error"
      );
      return;
    }

    const today = new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD'

    const payload: CreateSimpananRequest = {
      simpanan_category_id: (dataRekening.reference?.id as number) ?? 0,
      user_id: (dataRekening.user?.id as number) ?? 0,
      description: keterangan || undefined,
      date: today,
      nominal: Number(nominalTransaksi),
      type: "manual", // Jenis transaksi manual
    };

    try {
      // Memastikan kita menggunakan endpoint yang benar yaitu /simpanan
      await createSimpanan(payload).unwrap();

      await Swal.fire(
        "Berhasil",
        `Setoran ${formatRupiah(nominalTransaksi)} berhasil.`,
        "success"
      );

      // Pembaruan saldo secara optimistik
      setDataRekening((prev) =>
        prev
          ? { ...prev, balance: (prev.balance ?? 0) + nominalTransaksi }
          : prev
      );

      // Reset input dan refetch data
      setNominalInput("");
      setKeterangan("");
      setRekeningNumber("");
      setSearchQuery("");
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

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-primary" />
        Transaksi Simpanan (Setor & Tarik)
      </h2>

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

      {dataRekening && (
        <Card className="shadow-lg border-t-4 border-green-500">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-green-600">
              <CheckCircleIcon className="h-5 w-5" /> Detail & Input Transaksi
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b">
              <div>
                <p className="text-sm text-gray-500">Anggota</p>
                <p className="font-bold flex items-center gap-1">
                  <User className="h-4 w-4" /> {dataRekening.user?.name ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Produk Simpanan</p>
                <p className="font-semibold">
                  {dataRekening.reference?.name ?? "-"}{" "}
                  <Badge variant="secondary">
                    {dataRekening.reference?.code ?? ""}
                  </Badge>
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Saldo Saat Ini</p>
                <p className="text-xl font-bold text-primary">
                  {formatRupiah(dataRekening.balance ?? 0)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1 space-y-2">
                <Label htmlFor="type">Jenis Transaksi</Label>
                <Select
                  onValueChange={(v) =>
                    setTransaksiType(v as "SETOR" | "TARIK")
                  }
                  value={transaksiType}
                >
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Pilih Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SETOR">Setoran (Deposit)</SelectItem>
                    <SelectItem
                      value="TARIK"
                      disabled={
                        !(dataRekening.reference?.name ?? "")
                          .toLowerCase()
                          .includes("sukarela")
                      }
                    >
                      Penarikan (Withdrawal)
                    </SelectItem>
                  </SelectContent>
                </Select>

                {transaksiType === "TARIK" &&
                  !(dataRekening.reference?.name ?? "")
                    .toLowerCase()
                    .includes("sukarela") && (
                    <p className="text-xs text-red-500">
                      Hanya Simpanan Sukarela yang bisa ditarik.
                    </p>
                  )}
              </div>

              <div className="col-span-1 space-y-2">
                <Label htmlFor="nominal">Nominal Transaksi</Label>
                <Input
                  id="nominal"
                  placeholder="0"
                  value={nominalInput}
                  onChange={(e) => {
                    const raw = e.target.value ?? "";
                    const digitsOnly = String(raw).replace(/\D/g, "");
                    const asNumber: number =
                      digitsOnly === "" ? 0 : parseInt(digitsOnly, 10);
                    const formatted = formatRupiah(asNumber);
                    setNominalInput(formatted);
                  }}
                  disabled={isProcessing}
                  className="font-bold text-lg text-right"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
                <Input
                  id="keterangan"
                  placeholder="Misal: Setor tunai, Tarik via ATM"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  disabled={isProcessing}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              onClick={handleTransaksi}
              disabled={isProcessing || nominalTransaksi <= 0}
              className={`w-full text-lg ${
                transaksiType === "SETOR"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memproses...
                </>
              ) : (
                <>
                  {transaksiType === "SETOR" ? (
                    <TrendingUpIcon className="mr-2 h-5 w-5" />
                  ) : (
                    <TrendingDownIcon className="mr-2 h-5 w-5" />
                  )}
                  Proses {transaksiType === "SETOR" ? "Setoran" : "Penarikan"}{" "}
                  {formatRupiah(nominalTransaksi)}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {!dataRekening && !isSearching && !searchError && (
        <p className="text-center text-gray-500 mt-10">
          Masukkan Nomor Rekening Simpanan di kolom pencarian di atas untuk
          memulai transaksi.
        </p>
      )}
    </div>
  );
}