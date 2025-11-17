"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  DollarSign,
  User,
  Zap,
  Calendar,
  CreditCard,
  AlertTriangle,
  Loader2,
  CheckCircle,
  FileText,
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
  tenor_total: number;
  tenor_sisa: number;
  jasa_bulanan: number; // Jasa/bunga flat per bulan
  status: "Aktif" | "Telat" | "Lunas";
}

const initialDummyData: PinjamanAktif[] = [
  {
    no_kontrak: "PJN/M/001",
    anggota_name: "Budi Santoso",
    produk: "Pembiayaan Mikro",
    nominal_pinjaman: 15000000,
    sisa_pokok: 10000000,
    tenor_total: 12,
    tenor_sisa: 8,
    jasa_bulanan: 200000,
    status: "Aktif",
  },
  {
    no_kontrak: "PJN/I/002",
    anggota_name: "Siti Rahayu",
    produk: "Pembiayaan Investasi",
    nominal_pinjaman: 50000000,
    sisa_pokok: 40000000,
    tenor_total: 24,
    tenor_sisa: 20,
    jasa_bulanan: 500000,
    status: "Aktif",
  },
  {
    no_kontrak: "PJN/M/003",
    anggota_name: "Joko Widodo",
    produk: "Pembiayaan Mikro",
    nominal_pinjaman: 10000000,
    sisa_pokok: 5000000,
    tenor_total: 10,
    tenor_sisa: 5,
    jasa_bulanan: 200000,
    status: "Telat", // Anggota yang telat bayar tetap bisa melunasi
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

/**
 * Simulasi Perhitungan Pelunasan Akselerasi (Flat Rate)
 * Tagihan Pelunasan = Sisa Pokok + Jasa/Bunga Bulan Berjalan + (Biaya Administrasi/Denda jika ada)
 * Discount Jasa = Total Sisa Jasa - (Jasa Bulan Berjalan + Penalti)
 */
const hitungPelunasan = (pinjaman: PinjamanAktif) => {
    // 1. Hitung Sisa Jasa/Bunga Belum Dibayar
    const sisaTotalJasa = pinjaman.tenor_sisa * pinjaman.jasa_bulanan;
    
    // 2. Tentukan Jasa/Bunga yang Tetap Ditagih (Misal, Jasa bulan berjalan + Penalti 1 bulan)
    const jasaYangDitagih = pinjaman.jasa_bulanan * 1; // Misal, hanya tagih 1 bulan jasa sebagai penalti/biaya administrasi
    
    // 3. Hitung Diskon Jasa (Sisa Jasa yang hangus)
    const diskonJasa = sisaTotalJasa - jasaYangDitagih;
    
    // 4. Hitung Total Tagihan Pelunasan
    const totalTagihanPelunasan = pinjaman.sisa_pokok + jasaYangDitagih;
    
    return {
        sisaTotalJasa,
        jasaYangDitagih,
        diskonJasa: Math.max(0, diskonJasa), // Pastikan diskon tidak negatif
        totalTagihanPelunasan,
    };
}


// --- KOMPONEN UTAMA ---

export default function PelunasanPembiayaanPage() {
  const [contractNumber, setContractNumber] = useState("");
  const [dataPinjaman, setDataPinjaman] = useState<PinjamanAktif | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const hasilPelunasan = useMemo(() => {
    if (!dataPinjaman) return null;
    return hitungPelunasan(dataPinjaman);
  }, [dataPinjaman]);


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
        if (found.status === 'Lunas') {
            setSearchError(`Kontrak ${contractNumber} sudah lunas.`);
            setDataPinjaman(null);
        } else {
            setDataPinjaman(found);
            setSearchError(null);
        }
      } else {
        setSearchError(`Nomor Kontrak ${contractNumber} tidak ditemukan.`);
      }
      setIsSearching(false);
    }, 1000);
  };
  
  // --- HANDLER PELUNASAN ---
  const handlePelunasan = async () => {
    if (!dataPinjaman || !hasilPelunasan) return;

    const totalBayar = hasilPelunasan.totalTagihanPelunasan;

    const { isConfirmed } = await Swal.fire({
      title: "Konfirmasi Pelunasan Penuh",
      html: `
        <p class="text-left mb-2">Anggota: <b>${dataPinjaman.anggota_name}</b></p>
        <p class="text-left mb-4 text-xl font-bold text-primary">TOTAL DIBAYAR: ${formatRupiah(totalBayar)}</p>
        
        <p class="text-left mb-2 text-sm text-red-600">Pelunasan akan menutup kontrak pembiayaan ini secara permanen.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Proses Pelunasan",
      cancelButtonText: "Batal",
      preConfirm: () => true, // Tidak perlu input tambahan
    });

    if (!isConfirmed) return;
    
    setIsProcessing(true);
    
    // Simulasi pemrosesan
    setTimeout(() => {
      // Logika update state (simulasi)
      const newData = initialDummyData.map(d => {
          if (d.no_kontrak === dataPinjaman.no_kontrak) {
              return { 
                  ...d, 
                  sisa_pokok: 0,
                  tenor_sisa: 0,
                  status: 'Lunas',
              };
          }
          return d;
      });
      
      // Di implementasi nyata, kita panggil API penutupan kontrak
      
      // Reset state
      setContractNumber("");
      setDataPinjaman(null);
      
      setIsProcessing(false);
      Swal.fire({
        icon: "success",
        title: "Pelunasan Berhasil!",
        html: `Kontrak <b>${dataPinjaman.no_kontrak}</b> atas nama <b>${dataPinjaman.anggota_name}</b> telah dilunasi penuh sebesar <b>${formatRupiah(totalBayar)}</b>.`,
      });
      
    }, 2000); 
  };


  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <DollarSign className="h-6 w-6 text-primary" />
        Transaksi Pelunasan Pembiayaan
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

      {/* --- KARTU DETAIL PERHITUNGAN PELUNASAN --- */}
      {dataPinjaman && hasilPelunasan && (
        <Card className="shadow-lg border-t-4 border-red-500">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-red-600">
              <FileText className="h-5 w-5" /> Perhitungan Pelunasan Akselerasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Informasi Anggota & Pinjaman */}
            <div className="grid grid-cols-3 gap-4 mb-6 pb-4 border-b">
              <div>
                <p className="text-sm text-gray-500">Anggota</p>
                <p className="font-bold flex items-center gap-1"><User className="h-4 w-4" /> {dataPinjaman.anggota_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Produk</p>
                <p className="font-semibold">{dataPinjaman.produk}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sisa Tenor</p>
                <p className="font-bold">{dataPinjaman.tenor_sisa} bulan</p>
              </div>
            </div>

            {/* Rincian Perhitungan */}
            <div className="space-y-3">
                <div className="flex justify-between font-semibold text-lg">
                    <span>1. Sisa Pokok Pinjaman</span>
                    <span className="text-primary">{formatRupiah(dataPinjaman.sisa_pokok)}</span>
                </div>
                
                <div className="flex justify-between text-gray-600 border-t pt-2">
                    <span className="text-sm">2. Sisa Jasa/Bunga Belum Ditagih ({dataPinjaman.tenor_sisa} bulan)</span>
                    <span className="text-sm">{formatRupiah(hasilPelunasan.sisaTotalJasa)}</span>
                </div>
                
                <div className="flex justify-between font-semibold text-green-600">
                    <span>3. Diskon Jasa/Bunga Akselerasi</span>
                    <span className="text-xl">- {formatRupiah(hasilPelunasan.diskonJasa)}</span>
                </div>

                <div className="flex justify-between font-semibold text-red-600">
                    <span>4. Jasa/Bunga Tetap (Penalti/Admin)</span>
                    <span>+ {formatRupiah(hasilPelunasan.jasaYangDitagih)}</span>
                </div>
            </div>
            
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4">
            <Separator className="my-2" />
            <div className="flex justify-between w-full font-bold text-2xl">
                <span>TOTAL TAGIHAN PELUNASAN</span>
                <span className="text-red-700">{formatRupiah(hasilPelunasan.totalTagihanPelunasan)}</span>
            </div>

            <Button
              onClick={handlePelunasan}
              disabled={isProcessing}
              className="w-full text-lg bg-red-600 hover:bg-red-700 mt-4"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Memproses Pelunasan...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Lunasi Penuh {formatRupiah(hasilPelunasan.totalTagihanPelunasan)}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {!dataPinjaman && !isSearching && !searchError && (
        <p className="text-center text-gray-500 mt-10">
          Masukkan Nomor Kontrak pinjaman yang akan dilunasi di kolom pencarian di atas.
        </p>
      )}
    </div>
  );
}