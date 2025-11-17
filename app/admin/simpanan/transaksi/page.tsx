"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  DollarSign,
  User,
  Zap,
  CreditCard,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Coins,
  Loader2,
  Badge,
} from "lucide-react";
import Swal from "sweetalert2";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- DUMMY DATA & TYPES ---

interface RekeningSimpanan {
  no_rekening: string;
  anggota_name: string;
  produk: string;
  saldo_terakhir: number;
  tipe_simpanan: "Pokok" | "Wajib" | "Sukarela";
}

const initialDummyData: RekeningSimpanan[] = [
  {
    no_rekening: "SWJ-001",
    anggota_name: "Budi Santoso",
    produk: "Simpanan Sukarela",
    saldo_terakhir: 1500000,
    tipe_simpanan: "Sukarela",
  },
  {
    no_rekening: "WJB-002",
    anggota_name: "Siti Rahayu",
    produk: "Simpanan Wajib",
    saldo_terakhir: 5000000,
    tipe_simpanan: "Wajib",
  },
  {
    no_rekening: "POK-003",
    anggota_name: "Joko Widodo",
    produk: "Simpanan Pokok",
    saldo_terakhir: 1000000,
    tipe_simpanan: "Pokok",
  },
];

// --- HELPER FUNCTIONS ---

const formatRupiah = (number: number) => {
  if (isNaN(number) || number === null || number === undefined) return 'Rp 0';
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

const parseNominal = (value: string) => {
    const parsed = parseFloat(value.replace(/[^0-9]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
}

// --- KOMPONEN UTAMA ---

export default function TransaksiSimpananPage() {
  const [rekeningNumber, setRekeningNumber] = useState("");
  const [dataRekening, setDataRekening] = useState<RekeningSimpanan | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  const [transaksiType, setTransaksiType] = useState<"SETOR" | "TARIK">("SETOR");
  const [nominalInput, setNominalInput] = useState<string>("");
  const [keterangan, setKeterangan] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const nominalTransaksi = useMemo(() => parseNominal(nominalInput), [nominalInput]);

  // --- HANDLER PENCARIAN ---
  const handleSearch = () => {
    if (!rekeningNumber.trim()) {
      setSearchError("Masukkan Nomor Rekening Simpanan.");
      setDataRekening(null);
      return;
    }
    
    setIsSearching(true);
    setSearchError(null);
    setDataRekening(null);

    // Simulasi pencarian API
    setTimeout(() => {
      const found = initialDummyData.find(d => d.no_rekening === rekeningNumber.trim().toUpperCase());
      
      if (found) {
        setDataRekening(found);
        setSearchError(null);
      } else {
        setSearchError(`Nomor Rekening ${rekeningNumber} tidak ditemukan.`);
      }
      setIsSearching(false);
    }, 1000);
  };
  
  // --- HANDLER TRANSAKSI ---
  const handleTransaksi = async () => {
    if (!dataRekening || nominalTransaksi <= 0) {
      return Swal.fire("Gagal", "Nominal transaksi harus lebih dari nol.", "error");
    }
    
    // Validasi Penarikan
    if (transaksiType === "TARIK" && nominalTransaksi > dataRekening.saldo_terakhir) {
      return Swal.fire("Gagal", "Saldo tidak mencukupi untuk penarikan ini.", "error");
    }
    // Tambahan validasi untuk Simpanan Pokok/Wajib (Biasanya tidak boleh ditarik)
    if (transaksiType === "TARIK" && (dataRekening.tipe_simpanan === "Pokok" || dataRekening.tipe_simpanan === "Wajib")) {
        return Swal.fire("Ditolak", `${dataRekening.tipe_simpanan} hanya bisa ditarik jika anggota keluar/mengundurkan diri.`, "error");
    }

    const actionText = transaksiType === "SETOR" ? "Setor" : "Tarik";
    const newSaldo = transaksiType === "SETOR" ? dataRekening.saldo_terakhir + nominalTransaksi : dataRekening.saldo_terakhir - nominalTransaksi;

    const { isConfirmed } = await Swal.fire({
      title: `Konfirmasi Transaksi ${actionText}`,
      html: `
        <p class="text-left mb-2">Anggota: <b>${dataRekening.anggota_name}</b></p>
        <p class="text-left mb-2">Nominal ${actionText}: <b>${formatRupiah(nominalTransaksi)}</b></p>
        <p class="text-left mb-4">Saldo Akhir Baru: <b>${formatRupiah(newSaldo)}</b></p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Proses ${actionText}`,
    });

    if (!isConfirmed) return;

    setIsProcessing(true);
    
    // Simulasi pemrosesan API
    setTimeout(() => {
      // Update dummy data (simulasi update saldo)
      const updatedData = initialDummyData.map(d => {
        if (d.no_rekening === dataRekening.no_rekening) {
          return { ...d, saldo_terakhir: newSaldo };
        }
        return d;
      });
      
      // Update state dengan saldo baru
      setDataRekening(prev => prev ? { ...prev, saldo_terakhir: newSaldo } : null);

      setIsProcessing(false);
      setNominalInput("");
      setKeterangan("");
      setSearchError(null);
      setRekeningNumber(""); // Clear search field

      Swal.fire({
        icon: "success",
        title: "Transaksi Berhasil!",
        text: `${actionText} sebesar ${formatRupiah(nominalTransaksi)} berhasil dicatat.`,
      });
      
    }, 2000); 
  };


  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-primary" />
        Transaksi Simpanan (Setor & Tarik)
      </h2>

      {/* --- KARTU PENCARIAN REKENING --- */}
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
                if (e.key === 'Enter') handleSearch();
              }}
              disabled={isSearching || isProcessing}
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={isSearching || isProcessing}
            className="h-10"
          >
            {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          </Button>
        </CardContent>
        {searchError && <p className="text-sm text-red-500 px-6 pb-4">{searchError}</p>}
      </Card>

      {/* --- KARTU DETAIL REKENING & TRANSAKSI --- */}
      {dataRekening && (
        <Card className="shadow-lg border-t-4 border-green-500">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" /> Detail & Input Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Informasi Rekening */}
            <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b">
              <div>
                <p className="text-sm text-gray-500">Anggota</p>
                <p className="font-bold flex items-center gap-1"><User className="h-4 w-4" /> {dataRekening.anggota_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Produk Simpanan</p>
                <p className="font-semibold">{dataRekening.produk} <Badge variant="secondary">{dataRekening.tipe_simpanan}</Badge></p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Saldo Saat Ini</p>
                <p className="text-xl font-bold text-primary">{formatRupiah(dataRekening.saldo_terakhir)}</p>
              </div>
            </div>

            {/* Formulir Transaksi */}
            <div className="grid grid-cols-4 gap-4">
              {/* Jenis Transaksi */}
              <div className="col-span-1 space-y-2">
                <Label htmlFor="type">Jenis Transaksi</Label>
                <Select onValueChange={(v: "SETOR" | "TARIK") => setTransaksiType(v)} value={transaksiType}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Pilih Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SETOR">Setoran (Deposit)</SelectItem>
                    <SelectItem value="TARIK" disabled={dataRekening.tipe_simpanan !== "Sukarela"}>
                        Penarikan (Withdrawal)
                    </SelectItem>
                  </SelectContent>
                </Select>
                {transaksiType === "TARIK" && dataRekening.tipe_simpanan !== "Sukarela" && (
                    <p className="text-xs text-red-500">Hanya Simpanan Sukarela yang bisa ditarik.</p>
                )}
              </div>
              
              {/* Nominal */}
              <div className="col-span-1 space-y-2">
                <Label htmlFor="nominal">Nominal Transaksi</Label>
                <Input
                  id="nominal"
                  placeholder="0"
                  value={nominalInput}
                  onChange={(e) => setNominalInput(formatRupiah(parseNominal(e.target.value)).replace('Rp', '').trim())}
                  disabled={isProcessing}
                  className="font-bold text-lg text-right"
                />
              </div>

              {/* Keterangan */}
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
              className={`w-full text-lg ${transaksiType === "SETOR" ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  {transaksiType === "SETOR" ? <TrendingUp className="mr-2 h-5 w-5" /> : <TrendingDown className="mr-2 h-5 w-5" />}
                  Proses {transaksiType === "SETOR" ? 'Setoran' : 'Penarikan'} {formatRupiah(nominalTransaksi)}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {!dataRekening && !isSearching && !searchError && (
        <p className="text-center text-gray-500 mt-10">
          Masukkan Nomor Rekening Simpanan di kolom pencarian di atas untuk memulai transaksi.
        </p>
      )}
    </div>
  );
}