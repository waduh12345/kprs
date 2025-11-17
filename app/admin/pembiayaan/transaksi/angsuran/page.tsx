"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  DollarSign,
  User,
  Zap,
  Calendar,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";
import { Separator } from "@/components/ui/separator";

// --- DUMMY DATA & TYPES ---

interface PinjamanAktif {
  no_kontrak: string;
  anggota_name: string;
  produk: string;
  nominal_pinjaman: number;
  sisa_pokok: number;
  tenor_sisa: number;
  tagihan_berikutnya: number;
  jatuh_tempo_berikutnya: string;
  pokok_bulanan: number;
  jasa_bulanan: number;
  status: "Aktif" | "Telat" | "Lancar";
}

const initialDummyData: PinjamanAktif[] = [
  {
    no_kontrak: "PJN/M/001",
    anggota_name: "Budi Santoso",
    produk: "Pembiayaan Mikro",
    nominal_pinjaman: 15000000,
    sisa_pokok: 10000000,
    tenor_sisa: 8,
    tagihan_berikutnya: 1450000, // Angsuran pokok + jasa
    jatuh_tempo_berikutnya: "2025-12-15",
    pokok_bulanan: 1250000,
    jasa_bulanan: 200000,
    status: "Lancar",
  },
  {
    no_kontrak: "PJN/I/002",
    anggota_name: "Siti Rahayu",
    produk: "Pembiayaan Investasi",
    nominal_pinjaman: 50000000,
    sisa_pokok: 40000000,
    tenor_sisa: 10,
    tagihan_berikutnya: 5300000,
    jatuh_tempo_berikutnya: "2025-11-20", // Tanggal hari ini
    pokok_bulanan: 5000000,
    jasa_bulanan: 300000,
    status: "Lancar",
  },
  {
    no_kontrak: "PJN/M/003",
    anggota_name: "Joko Widodo",
    produk: "Pembiayaan Mikro",
    nominal_pinjaman: 10000000,
    sisa_pokok: 5000000,
    tenor_sisa: 5,
    tagihan_berikutnya: 1200000,
    jatuh_tempo_berikutnya: "2025-10-10", // Sudah lewat
    pokok_bulanan: 1000000,
    jasa_bulanan: 200000,
    status: "Telat",
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

// --- KOMPONEN UTAMA ---

export default function AngsuranPembiayaanPage() {
  const [contractNumber, setContractNumber] = useState("");
  const [dataPinjaman, setDataPinjaman] = useState<PinjamanAktif | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // --- HANDLER PENCARIAN ---
  const handleSearch = () => {
    if (!contractNumber.trim()) {
      setSearchError("Masukkan Nomor Kontrak Pembiayaan.");
      setDataPinjaman(null);
      return;
    }
    
    setIsSearching(true);
    setSearchError(null);
    setDataPinjaman(null);

    // Simulasi pencarian API
    setTimeout(() => {
      const found = initialDummyData.find(d => d.no_kontrak === contractNumber.trim());
      
      if (found) {
        setDataPinjaman(found);
        setSearchError(null);
      } else {
        setSearchError(`Nomor Kontrak ${contractNumber} tidak ditemukan atau sudah lunas.`);
      }
      setIsSearching(false);
    }, 1000);
  };
  
  // --- HANDLER PEMBAYARAN ANGSURAN ---
  const handlePayment = async () => {
    if (!dataPinjaman) return;

    const today = new Date().toISOString().substring(0, 10);
    const { value: paymentDetails } = await Swal.fire({
      title: "Konfirmasi Pembayaran Angsuran",
      html: `
        <p class="text-left mb-2">Tagihan Bulan Ini: <b>${formatRupiah(dataPinjaman.tagihan_berikutnya)}</b></p>
        <p class="text-left mb-4 text-sm text-red-500">Jatuh Tempo: ${dataPinjaman.jatuh_tempo_berikutnya}</p>
        
        <div class="space-y-2 text-left">
          <label for="payment_date" class="block text-sm font-medium text-gray-700">Tanggal Pembayaran</label>
          <input 
            id="payment_date" 
            type="date" 
            value="${today}"
            max="${today}" 
            class="swal2-input w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <p class="text-xs text-gray-500 mt-2 text-left">Metode Pembayaran:</p>
        <select id="payment_method" class="swal2-input w-full p-2 border border-gray-300 rounded-md">
            <option value="kas">Tunai (Kas)</option>
            <option value="transfer">Transfer Bank</option>
            <option value="potong_gaji">Potong Gaji</option>
        </select>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Bayar dan Catat",
      cancelButtonText: "Batal",
      input: "text", // Menggunakan input teks placeholder
      preConfirm: () => {
        const dateInput = document.getElementById("payment_date") as HTMLInputElement;
        const methodInput = document.getElementById("payment_method") as HTMLSelectElement;
        
        if (!dateInput.value) {
          Swal.showValidationMessage("Tanggal pembayaran wajib diisi.");
          return false;
        }
        return { date: dateInput.value, method: methodInput.value };
      },
      didOpen: () => {
        const swalInput = Swal.getInput();
        if (swalInput) swalInput.style.display = 'none';
      }
    });

    if (!paymentDetails) return;
    
    setIsProcessing(true);
    
    // Simulasi pemrosesan
    setTimeout(() => {
      // Logika update state (simulasi)
      const newSisaPokok = dataPinjaman.sisa_pokok - dataPinjaman.pokok_bulanan;
      const newTenorSisa = dataPinjaman.tenor_sisa - 1;
      
      // Di implementasi nyata, kita akan panggil API untuk mengurangi sisa pokok dan memajukan tenor
      
      // Update dummy data (untuk demo)
      const newData = initialDummyData.map(d => {
          if (d.no_kontrak === dataPinjaman.no_kontrak) {
              return { 
                  ...d, 
                  sisa_pokok: newSisaPokok,
                  tenor_sisa: newTenorSisa,
                  status: newTenorSisa > 0 ? 'Lancar' : 'Lunas',
                  // Majukan tanggal jatuh tempo berikutnya (simulasi)
                  jatuh_tempo_berikutnya: new Date(new Date(d.jatuh_tempo_berikutnya).setMonth(new Date(d.jatuh_tempo_berikutnya).getMonth() + 1)).toISOString().substring(0, 10),
              };
          }
          return d;
      });
      
      // Reset state untuk menampilkan hasil baru
      setContractNumber("");
      setDataPinjaman(null);
      // Di sini kita seharusnya memanggil refetch data pinjaman dari API
      
      setIsProcessing(false);
      Swal.fire({
        icon: "success",
        title: "Pembayaran Berhasil!",
        html: `Angsuran <b>${dataPinjaman.no_kontrak}</b> telah dicatat sebesar <b>${formatRupiah(dataPinjaman.tagihan_berikutnya)}</b>.`,
      });
      
    }, 2000); 
  };


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
            <Label htmlFor="kontrak">Nomor Kontrak/Rekening Pembiayaan</Label>
            <Input
              id="kontrak"
              placeholder="Contoh: PJN/M/001"
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value.toUpperCase())}
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

      {/* --- KARTU DETAIL TAGIHAN --- */}
      {dataPinjaman && (
        <Card className="shadow-lg border-t-4 border-green-500">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" /> Detail Tagihan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Informasi Anggota */}
            <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b">
              <div>
                <p className="text-sm text-gray-500">Anggota</p>
                <p className="font-bold flex items-center gap-1"><User className="h-4 w-4" /> {dataPinjaman.anggota_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Produk</p>
                <p className="font-semibold">{dataPinjaman.produk}</p>
              </div>
            </div>

            {/* Informasi Pinjaman */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Nominal Pinjaman</p>
                <p className="font-semibold">{formatRupiah(dataPinjaman.nominal_pinjaman)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sisa Pokok</p>
                <p className="text-xl font-bold text-red-600">{formatRupiah(dataPinjaman.sisa_pokok)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sisa Tenor</p>
                <p className="font-bold">{dataPinjaman.tenor_sisa} bulan</p>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Informasi Tagihan */}
            <div className="grid grid-cols-3 gap-4 bg-green-50 p-4 rounded-lg">
                <div className="col-span-1">
                    <p className="text-sm text-gray-500">Jatuh Tempo Berikutnya</p>
                    <p className="font-bold text-lg flex items-center gap-1"><Calendar className="h-5 w-5" /> {dataPinjaman.jatuh_tempo_berikutnya}</p>
                    {dataPinjaman.status === 'Telat' && (
                         <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Status: Telat Bayar</p>
                    )}
                </div>
                <div className="col-span-2 space-y-2">
                    <p className="text-sm text-gray-500">Rincian Angsuran</p>
                    <div className="flex justify-between font-semibold">
                        <span>Pokok:</span>
                        <span>{formatRupiah(dataPinjaman.pokok_bulanan)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                        <span>Jasa/Bunga:</span>
                        <span className="text-red-600">{formatRupiah(dataPinjaman.jasa_bulanan)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl border-t pt-2">
                        <span>TOTAL TAGIHAN:</span>
                        <span className="text-primary">{formatRupiah(dataPinjaman.tagihan_berikutnya)}</span>
                    </div>
                </div>
            </div>
            
          </CardContent>
          <CardContent>
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full text-lg bg-primary hover:bg-indigo-700 mt-4"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Memproses Pembayaran...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-5 w-5" />
                  Bayar Angsuran Sekarang
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}