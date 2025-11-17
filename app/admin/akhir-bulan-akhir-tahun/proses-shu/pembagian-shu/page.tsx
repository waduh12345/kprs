"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Zap,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ListChecks,
  Users,
  Coins,
  Share2,
} from "lucide-react";
import Swal from "sweetalert2";
import { Separator } from "@/components/ui/separator";

// --- DUMMY DATA & TYPES ---

interface AnggotaSHU {
  id: string;
  name: string;
  jasa_simpanan: number; // Proporsi jasa simpanan (misal: saldo rata-rata * persentase)
  jasa_pinjaman: number; // Proporsi jasa pinjaman (misal: bunga/jasa yang dibayar * persentase)
  shu_diterima: number;
}

const DANA_SHU_JASA_ANGGOTA = 200000000; // Misal 40% dari SHU Kotor 500 Juta
const TOTAL_BASIS_ANGGOTA = 8000000000; // Total basis perhitungan (simpanan + pinjaman) dari semua anggota

const dummyAnggotaData: AnggotaSHU[] = [
    { id: "A001", name: "Budi Santoso", jasa_simpanan: 15000000, jasa_pinjaman: 5000000, shu_diterima: 0 },
    { id: "A002", name: "Siti Rahayu", jasa_simpanan: 25000000, jasa_pinjaman: 10000000, shu_diterima: 0 },
    { id: "A003", name: "Joko Widodo", jasa_simpanan: 5000000, jasa_pinjaman: 0, shu_diterima: 0 },
];

const PROPORSI_SIMPANAN = 60; // 60% dari Dana Jasa Anggota dialokasikan berdasarkan Simpanan
const PROPORSI_PINJAMAN = 40; // 40% dari Dana Jasa Anggota dialokasikan berdasarkan Pinjaman

// --- HELPER FUNCTIONS ---

const formatRupiah = (number: number) => {
  if (isNaN(number) || number === null || number === undefined) return 'Rp 0';
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Math.abs(number));
  return number < 0 ? `(${formatted})` : formatted;
};

// --- KOMPONEN UTAMA ---

export default function PembagianSHUPage() {
  const currentYear = new Date().getFullYear() - 1; 
  
  const [tahunSHU, setTahunSHU] = useState(currentYear);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isPosted, setIsPosted] = useState(false);
  const [anggotaData, setAnggotaData] = useState<AnggotaSHU[]>(dummyAnggotaData);

  // --- LOGIKA PERHITUNGAN & ALLOCATION ---
  const calculatedSHU = useMemo(() => {
    
    // Total Dana SHU Jasa Anggota
    const danaSimpanan = DANA_SHU_JASA_ANGGOTA * (PROPORSI_SIMPANAN / 100);
    const danaPinjaman = DANA_SHU_JASA_ANGGOTA * (PROPORSI_PINJAMAN / 100);
    
    // Total basis (simpanan + pinjaman) untuk menghitung persentase anggota
    const totalBasisSimpanan = anggotaData.reduce((sum, a) => sum + a.jasa_simpanan, 0);
    const totalBasisPinjaman = anggotaData.reduce((sum, a) => sum + a.jasa_pinjaman, 0);

    const dataDenganSHU = anggotaData.map(anggota => {
        let shuSimpanan = 0;
        let shuPinjaman = 0;
        
        // Perhitungan Jasa Simpanan
        if (totalBasisSimpanan > 0) {
            const proporsi = anggota.jasa_simpanan / totalBasisSimpanan;
            shuSimpanan = proporsi * danaSimpanan;
        }
        
        // Perhitungan Jasa Pinjaman
        if (totalBasisPinjaman > 0) {
            const proporsi = anggota.jasa_pinjaman / totalBasisPinjaman;
            shuPinjaman = proporsi * danaPinjaman;
        }
        
        return {
            ...anggota,
            shu_simpanan: Math.round(shuSimpanan),
            shu_pinjaman: Math.round(shuPinjaman),
            shu_diterima: Math.round(shuSimpanan + shuPinjaman),
        };
    });
    
    const totalDiterima = dataDenganSHU.reduce((sum, a) => sum + a.shu_diterima, 0);
    
    return {
        data: dataDenganSHU,
        totalDiterima,
        selisih: DANA_SHU_JASA_ANGGOTA - totalDiterima,
    };
  }, [anggotaData]);

  // --- HANDLER EKSEKUSI PEMBAGIAN ---
  const handlePostSHU = async () => {
    if (isPosted) return;

    if (Math.abs(calculatedSHU.selisih) > 1) { // Toleransi selisih pembulatan
        return Swal.fire("Perhatian Pembulatan", `Ada selisih pembulatan sebesar ${formatRupiah(calculatedSHU.selisih)}. Koreksi akan dimasukkan ke SHU Ditahan. Lanjutkan?`, "warning");
    }

    const { isConfirmed } = await Swal.fire({
      title: "Konfirmasi Posting Pembagian SHU",
      html: `
        Anda akan memposting total **${formatRupiah(calculatedSHU.totalDiterima)}** ke saldo anggota untuk SHU Tahun ${tahunSHU}.
        <p class="mt-2 text-red-600 font-semibold">Proses ini tidak dapat dibatalkan dan akan menambah saldo simpanan anggota.</p>
      `,
      icon: "error",
      showCancelButton: true,
      confirmButtonText: "POST PEMBAGIAN SHU",
    });

    if (!isConfirmed) return;

    setIsCalculating(true);
    
    // Simulasi pemanggilan API Posting
    setTimeout(() => {
      setIsCalculating(false);
      setIsPosted(true);

      Swal.fire({
        icon: "success",
        title: "Pembagian Selesai!",
        text: `SHU Jasa Anggota Tahun ${tahunSHU} telah berhasil dibukukan ke masing-masing rekening anggota.`,
      });
      
    }, 4000); 
  };


  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Share2 className="h-6 w-6 text-primary" />
        Pembagian Sisa Hasil Usaha (SHU)
      </h2>
      <p className="text-gray-600">Langkah 2: Mendistribusikan Dana Jasa Anggota ke masing-masing anggota berdasarkan proporsi modal dan transaksi mereka.</p>

      {/* --- KARTU RINGKASAN DANA --- */}
      <Card className="border-t-4 border-indigo-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-indigo-600">
            <Coins className="h-5 w-5" /> Dana Tersedia untuk Dibagikan
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-4">
          <div className="col-span-1 space-y-2">
            <Label htmlFor="tahun_shu">Tahun Buku</Label>
            <Input
              id="tahun_shu"
              type="number"
              min={2020}
              value={tahunSHU}
              onChange={(e) => setTahunSHU(parseInt(e.target.value) || currentYear)}
              disabled={isPosted}
            />
          </div>
          <div className="col-span-3 space-y-2">
            <Label>Total Dana Jasa Anggota (Dari Perhitungan SHU)</Label>
            <Input
              value={formatRupiah(DANA_SHU_JASA_ANGGOTA)}
              readOnly
              className="font-extrabold text-2xl text-primary bg-indigo-50"
            />
          </div>
        </CardContent>
        <CardFooter className="pt-4 border-t mt-4">
            <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800 font-semibold">Alokasi Simpanan Wajib/Sukarela (60%)</p>
                    <span className="font-bold">{formatRupiah(DANA_SHU_JASA_ANGGOTA * 0.6)}</span>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800 font-semibold">Alokasi Jasa Pinjaman (40%)</p>
                    <span className="font-bold">{formatRupiah(DANA_SHU_JASA_ANGGOTA * 0.4)}</span>
                </div>
            </div>
        </CardFooter>
      </Card>

      {/* --- KARTU MATRIKS PEMBAGIAN --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ListChecks className="h-5 w-5" /> Matriks Perhitungan SHU Anggota
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-muted text-left">
              <tr>
                <th className="px-4 py-3 w-1/4">Anggota</th>
                <th className="px-4 py-3 text-right">Basis Simpanan (Rp)</th>
                <th className="px-4 py-3 text-right">Basis Pinjaman (Rp)</th>
                <th className="px-4 py-3 text-right bg-green-100">SHU Jasa Simpanan</th>
                <th className="px-4 py-3 text-right bg-green-100">SHU Jasa Pinjaman</th>
                <th className="px-4 py-3 text-right">TOTAL SHU Diterima</th>
              </tr>
            </thead>
            <tbody>
              {calculatedSHU.data.map((anggota) => (
                <tr key={anggota.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{anggota.name}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatRupiah(anggota.jasa_simpanan)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatRupiah(anggota.jasa_pinjaman)}</td>
                  <td className="px-4 py-3 text-right font-medium bg-green-50">{formatRupiah(anggota.shu_simpanan)}</td>
                  <td className="px-4 py-3 text-right font-medium bg-green-50">{formatRupiah(anggota.shu_pinjaman)}</td>
                  <td className={`px-4 py-3 text-right font-extrabold ${isPosted ? 'text-primary' : 'text-gray-800'}`}>
                    {formatRupiah(anggota.shu_diterima)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-200 font-extrabold">
                <tr>
                    <td colSpan={5} className="px-4 py-3 text-right">TOTAL SHU JASA ANGGOTA DIBAGIKAN</td>
                    <td className={`px-4 py-3 text-right text-lg ${Math.abs(calculatedSHU.selisih) > 1 ? 'text-red-600' : 'text-primary'}`}>
                        {formatRupiah(calculatedSHU.totalDiterima)}
                    </td>
                </tr>
            </tfoot>
          </table>
        </CardContent>

        <CardFooter className="flex justify-between pt-4">
            <div className={`font-semibold p-2 rounded-md ${Math.abs(calculatedSHU.selisih) > 1 ? 'bg-red-100 text-red-700' : 'text-green-700'}`}>
                <AlertTriangle className={`h-5 w-5 inline mr-2 ${Math.abs(calculatedSHU.selisih) > 1 ? '' : 'hidden'}`}/>
                Selisih Pembulatan: {formatRupiah(calculatedSHU.selisih)}
            </div>

            <Button
                onClick={handlePostSHU}
                disabled={isCalculating || isPosted}
                className="bg-primary hover:bg-indigo-700 text-lg"
            >
                {isCalculating ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Memposting ke Saldo...
                    </>
                ) : (
                    <>
                        <Zap className="mr-2 h-5 w-5" />
                        {isPosted ? 'SHU SUDAH DIPOSTING' : 'Post Pembagian SHU'}
                    </>
                )}
            </Button>
        </CardFooter>
      </Card>
      
      <p className="text-xs text-gray-500 mt-4">
        *Pembagian SHU ini didasarkan pada proporsi jasa simpanan dan jasa pinjaman setiap anggota terhadap total basis jasa seluruh anggota. Nominal SHU akan ditambahkan ke saldo simpanan wajib/sukarela anggota.
      </p>
    </div>
  );
}