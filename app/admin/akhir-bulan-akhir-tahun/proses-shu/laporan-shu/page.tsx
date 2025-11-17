"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  BarChart2,
  FileDown,
  Users,
  Coins,
  DollarSign,
  ClipboardList,
  Target,
} from "lucide-react";
import Swal from "sweetalert2";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// --- DUMMY DATA & TYPES ---

interface Allocation {
  name: string;
  percentage: number;
  nominal: number;
}

interface AnggotaSHU {
  id: string;
  name: string;
  shu_simpanan: number;
  shu_pinjaman: number;
  shu_diterima: number;
}

const SHU_KOTOR_TAHUNAN = 500000000;

// Data Alokasi (Hasil dari Perhitungan SHU)
const fixedAllocations: Allocation[] = [
    { name: "Dana Cadangan", percentage: 25, nominal: 125000000 },
    { name: "Dana Jasa Anggota (Simpanan & Pinjaman)", percentage: 40, nominal: 200000000 },
    { name: "Dana Pengurus/Karyawan", percentage: 20, nominal: 100000000 },
    { name: "Dana Sosial & Pendidikan", percentage: 15, nominal: 75000000 },
];

// Data Pembagian Anggota (Hasil dari Pembagian SHU)
const fixedAnggotaData: AnggotaSHU[] = [
    { id: "A001", name: "Budi Santoso", shu_simpanan: 1000000, shu_pinjaman: 500000, shu_diterima: 1500000 },
    { id: "A002", name: "Siti Rahayu", shu_simpanan: 1500000, shu_pinjaman: 700000, shu_diterima: 2200000 },
    { id: "A003", name: "Joko Widodo", shu_simpanan: 800000, shu_pinjaman: 0, shu_diterima: 800000 },
    { id: "A004", name: "Rini Melati", shu_simpanan: 500000, shu_pinjaman: 150000, shu_diterima: 650000 },
    // Total Anggota di sini hanya 4, untuk simulasi total 200 juta, anggap ada 100 anggota lagi.
];

const TOTAL_SHU_DIBAGIKAN_KE_ANGGOTA = fixedAnggotaData.reduce((sum, a) => sum + a.shu_diterima, 0);


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

export default function LaporanSHUPage() {
  const currentYear = new Date().getFullYear() - 1; 
  
  const [tahunLaporan, setTahunLaporan] = useState(currentYear);
  const [queryAnggota, setQueryAnggota] = useState("");

  const filteredAnggota = useMemo(() => {
    if (!queryAnggota.trim()) return fixedAnggotaData;
    const q = queryAnggota.toLowerCase();
    return fixedAnggotaData.filter(a => a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q));
  }, [queryAnggota]);

  // --- HANDLER EXPORT ---
  const handleExport = () => {
    Swal.fire({
      title: "Pilih Format Export",
      html: `Mengekspor Laporan SHU Tahun ${tahunLaporan}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Export Detail Anggota (.xlsx)',
      cancelButtonText: 'Export Ringkasan Alokasi (.pdf)',
    }).then((result) => {
        if (result.isConfirmed) {
            alert('Mengekspor detail SHU per anggota...');
        } else if (result.dismiss === Swal.DismissReason.cancel) {
             alert('Mengekspor ringkasan alokasi SHU...');
        }
    });
  };
  
  const totalAnggota = fixedAnggotaData.length;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <BarChart2 className="h-6 w-6 text-primary" />
        Laporan Sisa Hasil Usaha (SHU)
      </h2>
      <p className="text-gray-600">Laporan hasil SHU tahunan, alokasi, dan detail pembagian kepada anggota.</p>

      {/* --- KARTU KONTROL TAHUN & SUMMARY --- */}
      <Card className="border-t-4 border-indigo-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-indigo-600">
            <Calendar className="h-5 w-5" /> Kontrol Laporan
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-4 items-end">
          <div className="col-span-1 space-y-2">
            <Label htmlFor="tahun_laporan">Tahun Buku</Label>
            <Input
              id="tahun_laporan"
              type="number"
              min={2020}
              value={tahunLaporan}
              onChange={(e) => setTahunLaporan(parseInt(e.target.value) || currentYear)}
            />
          </div>
          <div className="col-span-3 space-y-2">
            <Label>Total SHU Kotor (Laba Bersih)</Label>
            <Input
              value={formatRupiah(SHU_KOTOR_TAHUNAN)}
              readOnly
              className="font-extrabold text-2xl text-primary bg-indigo-50"
            />
          </div>
        </CardContent>
        <CardFooter className="pt-4 flex justify-end items-center bg-gray-50 border-t">
          <Button onClick={handleExport} className="bg-red-600 hover:bg-red-700">
            <FileDown className="mr-2 h-4 w-4" /> Export Laporan
          </Button>
        </CardFooter>
      </Card>

      {/* --- KARTU ALOKASI SHU --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" /> Alokasi SHU Sesuai AD/ART
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-3 w-1/2">Pos Alokasi</th>
                <th className="px-4 py-3 text-right w-[150px]">Persentase (%)</th>
                <th className="px-4 py-3 text-right">Nominal Alokasi (IDR)</th>
              </tr>
            </thead>
            <tbody>
              {fixedAllocations.map((item, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-700">{item.percentage}%</td>
                  <td className="px-4 py-3 text-right font-bold text-green-700">{formatRupiah(item.nominal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-200 font-extrabold">
              <tr>
                <td className="px-4 py-3">TOTAL SHU KOTOR</td>
                <td className="px-4 py-3 text-right">100%</td>
                <td className="px-4 py-3 text-right text-lg text-primary">
                  {formatRupiah(SHU_KOTOR_TAHUNAN)}
                </td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      {/* --- KARTU DETAIL PEMBAGIAN ANGGOTA --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Detail Pembagian Jasa Anggota
            </div>
            <Badge variant="default" className="bg-indigo-600">Total {totalAnggota} Anggota</Badge>
          </CardTitle>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Total Dana Jasa Anggota yang Dibagikan: **{formatRupiah(TOTAL_SHU_DIBAGIKAN_KE_ANGGOTA)}**</p>
            <Input 
                placeholder="Cari anggota berdasarkan nama/ID..." 
                value={queryAnggota}
                onChange={(e) => setQueryAnggota(e.target.value)}
                className="w-full"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-3 w-1/4">Anggota (ID/Nama)</th>
                <th className="px-4 py-3 text-right">SHU Jasa Simpanan</th>
                <th className="px-4 py-3 text-right">SHU Jasa Pinjaman</th>
                <th className="px-4 py-3 text-right">TOTAL DITERIMA</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnggota.length === 0 ? (
                <tr>
                    <td colSpan={4} className="text-center p-4">Tidak ada anggota yang sesuai dengan pencarian.</td>
                </tr>
              ) : (
                filteredAnggota.map((anggota) => (
                  <tr key={anggota.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{anggota.id} - {anggota.name}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatRupiah(anggota.shu_simpanan)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatRupiah(anggota.shu_pinjaman)}</td>
                    <td className="px-4 py-3 text-right font-bold text-primary">{formatRupiah(anggota.shu_diterima)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-gray-200 font-extrabold">
                <tr>
                    <td className="px-4 py-3 text-right">TOTAL DIBAYARKAN</td>
                    <td className="px-4 py-3 text-right"></td>
                    <td className="px-4 py-3 text-right"></td>
                    <td className="px-4 py-3 text-right text-lg text-primary">
                      {formatRupiah(TOTAL_SHU_DIBAGIKAN_KE_ANGGOTA)}
                    </td>
                </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>
      
      <p className="text-xs text-gray-500 mt-4">
        *Laporan ini menyajikan hasil akhir SHU yang dibukukan dari perhitungan dan pembagian yang telah dilakukan.
      </p>
    </div>
  );
}