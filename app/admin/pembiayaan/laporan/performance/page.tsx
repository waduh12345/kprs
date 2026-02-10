"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart2,
  Calendar,
  FileDown,
  Percent,
  TrendingDown,
  Target,
  DollarSign,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";
import { Separator } from "@/components/ui/separator";
import { useGetPinjamanKolektibilitasQuery } from "@/services/admin/pinjaman.service";
import type {
  KolektibilitasSummary,
  KolektibilitasKategori,
} from "@/types/admin/pinjaman";

/** Ubah YYYY-MM ke tanggal akhir bulan (YYYY-MM-DD) untuk as_of_date */
function getLastDayOfMonth(monthStr: string): string {
  const [y, m] = monthStr.split("-").map(Number);
  const last = new Date(y, m, 0);
  return last.toISOString().slice(0, 10);
}

// --- HELPER FUNCTIONS ---

const formatRupiah = (number: number) => {
  if (isNaN(number) || number === null || number === undefined) return 'Rp 0';
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

const formatPercentage = (number: number) => {
    return `${(number * 100).toFixed(2)}%`;
}

const getKolektibilitasColor = (kategori: KolektibilitasKategori) => {
    switch (kategori) {
        case "Lancar": return "bg-green-100 text-green-700";
        case "DPK": return "bg-yellow-100 text-yellow-700";
        case "Kurang Lancar": return "bg-orange-100 text-orange-700";
        case "Diragukan": return "bg-red-100 text-red-700";
        case "Macet": return "bg-red-600 text-white";
        default: return "bg-gray-100 text-gray-700";
    }
}

// --- KOMPONEN UTAMA ---

export default function LaporanPerformancePage() {
  const today = new Date().toISOString().substring(0, 7);
  const [posisiPeriode, setPosisiPeriode] = useState(today);

  const asOfDate = useMemo(
    () => getLastDayOfMonth(posisiPeriode),
    [posisiPeriode]
  );

  const {
    data: dataKolektibilitasRaw,
    isLoading: isLoadingKolektibilitas,
    isError: isErrorKolektibilitas,
    refetch: refetchKolektibilitas,
  } = useGetPinjamanKolektibilitasQuery({ as_of_date: asOfDate });

  const dataKolektibilitas: KolektibilitasSummary[] = useMemo(
    () => Array.isArray(dataKolektibilitasRaw) ? dataKolektibilitasRaw : [],
    [dataKolektibilitasRaw]
  );

  // --- RASIO PERHITUNGAN (NPL/NPF) ---
  const performanceRatios = useMemo(() => {
    const totalOutstanding = dataKolektibilitas.reduce((sum, item) => sum + item.outstanding_pokok, 0);
    
    // Total Outstanding Non-Lancar (Kol 3, 4, 5)
    const totalNonLancar = dataKolektibilitas
      .filter(d => d.kategori !== 'Lancar' && d.kategori !== 'DPK')
      .reduce((sum, item) => sum + item.outstanding_pokok, 0);

    // Total Outstanding NPL (Kol 2, 3, 4, 5) - Biasanya DPK ke bawah
    const totalNPL = dataKolektibilitas
      .filter(d => d.kategori !== 'Lancar')
      .reduce((sum, item) => sum + item.outstanding_pokok, 0);
      
    const nplRatio = totalOutstanding > 0 ? totalNPL / totalOutstanding : 0;
    const nonLancarRatio = totalOutstanding > 0 ? totalNonLancar / totalOutstanding : 0;
    
    // Jumlah Rekening
    const totalRekening = dataKolektibilitas.reduce((sum, item) => sum + item.jumlah_rekening, 0);

    return {
        totalOutstanding,
        totalRekening,
        nplRatio,
        nonLancarRatio,
        totalNPL,
    };
  }, [dataKolektibilitas]);

  // --- HANDLER EXPORT ---
  const handleExportExcel = () => {
    Swal.fire({
      icon: "info",
      title: "Export Laporan Performance",
      text: `Mengekspor Laporan Kualitas Pembiayaan posisi ${posisiPeriode}.`,
      confirmButtonText: "Oke",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Target className="h-6 w-6 text-primary" />
        Laporan Kualitas (Performance) Pembiayaan
      </h2>

      {/* --- KARTU KONTROL PERIODE --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-indigo-600">
            <Calendar className="h-5 w-5" /> Kontrol Laporan
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="posisi_periode">Posisi Periode Laporan (Akhir Bulan)</Label>
            <Input
              id="posisi_periode"
              type="month"
              value={posisiPeriode}
              onChange={(e) => setPosisiPeriode(e.target.value)}
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Tanggal Laporan Dibuat</Label>
            <Input type="text" value={new Date().toLocaleDateString('id-ID')} disabled />
          </div>
        </CardContent>
      </Card>
      
      {/* --- SUMMARY RASIO & OUTSTANDING --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Outstanding */}
        <Card className="bg-white border-l-4 border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding Pinjaman</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingKolektibilitas ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Memuat...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatRupiah(performanceRatios.totalOutstanding)}</div>
                <p className="text-xs text-muted-foreground">{performanceRatios.totalRekening} Rekening</p>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* NPL Ratio (Kol 2-5) */}
        <Card className="bg-white border-l-4 border-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NPF / NPL Ratio</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoadingKolektibilitas ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Memuat...</span>
              </div>
            ) : (
              <>
                <div className={`text-2xl font-bold ${performanceRatios.nplRatio > 0.05 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatPercentage(performanceRatios.nplRatio)}
                </div>
                <p className="text-xs text-muted-foreground">Target Ideal: {'<'} 5%</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total NPL Nominal */}
        <Card className="bg-white border-l-4 border-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding NPF</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoadingKolektibilitas ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Memuat...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatRupiah(performanceRatios.totalNPL)}</div>
                <p className="text-xs text-muted-foreground">Outstanding Kol. 2 s/d 5</p>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Non-Lancar Ratio (Kol 3-5) */}
        <Card className="bg-white border-l-4 border-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rasio Non-Lancar</CardTitle>
            <Percent className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoadingKolektibilitas ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Memuat...</span>
              </div>
            ) : (
              <>
                <div className={`text-2xl font-bold ${performanceRatios.nonLancarRatio > 0.01 ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatPercentage(performanceRatios.nonLancarRatio)}
                </div>
                <p className="text-xs text-muted-foreground">Outstanding Kol. 3 s/d 5</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator label={""} />

      {/* --- TABEL BREAKDOWN KOLEKTIBILITAS --- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart2 className="h-5 w-5" /> Breakdown Kualitas Kolektibilitas
          </CardTitle>
          <Button
                onClick={handleExportExcel}
                className="bg-primary hover:bg-indigo-700"
            >
                <FileDown className="mr-2 h-4 w-4" />
                Export Detail
            </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-3">Kolektibilitas</th>
                <th className="px-4 py-3 text-right">Outstanding Pokok</th>
                <th className="px-4 py-3 text-right">Persentase (%)</th>
                <th className="px-4 py-3 text-right">Jumlah Rekening</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingKolektibilitas ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin inline-block mr-2" />
                    Memuat data kolektibilitas...
                  </td>
                </tr>
              ) : isErrorKolektibilitas ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-destructive">
                    Gagal memuat data.{" "}
                    <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => refetchKolektibilitas()}>
                      Coba lagi
                    </Button>
                  </td>
                </tr>
              ) : dataKolektibilitas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Tidak ada data kolektibilitas untuk periode ini.
                  </td>
                </tr>
              ) : (
                <>
                  {dataKolektibilitas.map((item) => {
                    const totalOut = performanceRatios.totalOutstanding || 1;
                    const percentage = item.outstanding_pokok / totalOut;
                    return (
                      <tr key={item.kategori} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge className={getKolektibilitasColor(item.kategori)}>
                            {item.kategori}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-gray-800">
                          {formatRupiah(item.outstanding_pokok)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right font-medium">
                          {formatPercentage(percentage)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-gray-600">
                          {item.jumlah_rekening}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Total Row */}
                  <tr className="border-t-2 border-gray-700 bg-gray-100 font-bold">
                    <td className="px-4 py-3">TOTAL KESELURUHAN</td>
                    <td className="px-4 py-3 text-right text-lg text-primary">{formatRupiah(performanceRatios.totalOutstanding)}</td>
                    <td className="px-4 py-3 text-right">100.00%</td>
                    <td className="px-4 py-3 text-right">{performanceRatios.totalRekening}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
      
      <p className="text-xs text-gray-500 mt-4">
        *Laporan ini menyajikan analisis kualitas aset pembiayaan berdasarkan posisi terakhir. Data DPK (Dalam Perhatian Khusus) dan di bawahnya termasuk dalam kategori NPL/NPF.
      </p>
    </div>
  );
}