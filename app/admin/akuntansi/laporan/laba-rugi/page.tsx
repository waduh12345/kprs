"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Calendar,
  FileDown,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  ListChecks,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

// --- DUMMY DATA & TYPES ---

interface LabaRugiItem {
  kode: string;
  nama: string;
  saldo: number;
  level: 1 | 2 | 3 | 4; // Level 1: Pendapatan, Beban
  type: "HEADER" | "SUMMARY" | "DETAIL";
  posisi: "PENAMBAH" | "PENGURANG"; // Untuk menentukan warna dan posisi di Laba/Rugi
}

// Data Laba Rugi Dummy (Periode 2025-11-01 s/d 2025-11-30)
const dummyLabaRugiData: LabaRugiItem[] = [
  // --- PENDAPATAN ---
  { kode: "4", nama: "PENDAPATAN", saldo: 250000000, level: 1, type: "HEADER", posisi: "PENAMBAH" },
  { kode: "41", nama: "PENDAPATAN USAHA (OPERASIONAL)", saldo: 200000000, level: 2, type: "SUMMARY", posisi: "PENAMBAH" },
  { kode: "411001", nama: "Pendapatan Jasa Pembiayaan", saldo: 150000000, level: 4, type: "DETAIL", posisi: "PENAMBAH" },
  { kode: "411002", nama: "Pendapatan Bunga Simjaka", saldo: 50000000, level: 4, type: "DETAIL", posisi: "PENAMBAH" },
  { kode: "42", nama: "PENDAPATAN LAIN-LAIN", saldo: 50000000, level: 2, type: "SUMMARY", posisi: "PENAMBAH" },
  { kode: "421001", nama: "Pendapatan Administrasi", saldo: 50000000, level: 4, type: "DETAIL", posisi: "PENAMBAH" },

  // --- BEBAN POKOK (HPP) ---
  { kode: "5", nama: "BEBAN POKOK PENDAPATAN (HPP)", saldo: 0, level: 1, type: "HEADER", posisi: "PENGURANG" },

  // --- BEBAN OPERASIONAL ---
  { kode: "6", nama: "BEBAN OPERASIONAL", saldo: -80000000, level: 1, type: "HEADER", posisi: "PENGURANG" },
  { kode: "61", nama: "BEBAN GAJI & KESEJAHTERAAN", saldo: -50000000, level: 2, type: "SUMMARY", posisi: "PENGURANG" },
  { kode: "611001", nama: "Beban Gaji Karyawan", saldo: -50000000, level: 4, type: "DETAIL", posisi: "PENGURANG" },
  { kode: "62", nama: "BEBAN ADMINISTRASI & UMUM", saldo: -30000000, level: 2, type: "SUMMARY", posisi: "PENGURANG" },
  { kode: "621001", nama: "Beban Listrik & Air", saldo: -10000000, level: 4, type: "DETAIL", posisi: "PENGURANG" },
  { kode: "621002", nama: "Beban ATK & Cetak", saldo: -20000000, level: 4, type: "DETAIL", posisi: "PENGURANG" },

  // --- BEBAN NON-OPERASIONAL ---
  { kode: "7", nama: "BEBAN NON-OPERASIONAL", saldo: -20000000, level: 1, type: "HEADER", posisi: "PENGURANG" },
  { kode: "71", nama: "BEBAN BUNGA/JASA", saldo: -20000000, level: 2, type: "SUMMARY", posisi: "PENGURANG" },
  { kode: "711001", nama: "Beban Bunga Pinjaman Bank", saldo: -20000000, level: 4, type: "DETAIL", posisi: "PENGURANG" },
];

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

const LabaRugiItemRow: React.FC<{ item: LabaRugiItem, toggleCollapse: (kode: string) => void, isCollapsed: boolean }> = ({ item, toggleCollapse, isCollapsed }) => {
  const isExpandable = item.type !== "DETAIL";
  const textColor = item.saldo < 0 ? "text-red-600" : (item.saldo > 0 ? "text-green-600" : "text-gray-800");
  let className = "py-2 px-4 border-b";

  if (item.level === 1) {
    className += " font-extrabold text-lg";
    if (item.posisi === 'PENAMBAH') className += " bg-green-50 text-green-800";
    if (item.posisi === 'PENGURANG') className += " bg-red-50 text-red-800";
  } else if (item.level === 2) {
    className += " font-bold text-md pl-8 bg-gray-50";
  } else if (item.level === 4) {
    className += " text-sm pl-16 italic bg-white";
  }
  
  if (item.type === "SUMMARY" || item.type === "HEADER") {
    className += " cursor-pointer hover:bg-gray-100";
  }

  return (
    <tr 
      className={className} 
      onClick={() => isExpandable && toggleCollapse(item.kode)}
    >
      <td className="w-1/3">
        <div className="flex items-center gap-2">
          {isExpandable ? (
            isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />
          ) : (
            <span className="w-4 h-4 inline-block"></span>
          )}
          <span>{item.nama}</span>
        </div>
      </td>
      <td className={`text-right font-mono ${textColor} ${item.level === 4 ? '' : 'font-extrabold'}`}>
        {formatRupiah(item.saldo)}
      </td>
    </tr>
  );
};


export default function LaporanLabaRugiPage() {
  const today = new Date().toISOString().substring(0, 10);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
  
  const [startDate, setStartDate] = useState(startOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set());

  // --- PERHITUNGAN HASIL KINERJA ---
  const { labaKotor, labaOperasi, labaBersih } = useMemo(() => {
    // Total Pendapatan
    const totalPendapatan = dummyLabaRugiData.find(item => item.kode === '4')?.saldo || 0;
    // Total HPP (Negatif)
    const totalHPP = dummyLabaRugiData.find(item => item.kode === '5')?.saldo || 0;
    // Total Beban Operasional (Negatif)
    const totalBebanOperasional = dummyLabaRugiData.find(item => item.kode === '6')?.saldo || 0;
    // Total Beban Non-Operasional (Negatif)
    const totalBebanNonOperasional = dummyLabaRugiData.find(item => item.kode === '7')?.saldo || 0;
    
    // Laba Kotor (Pendapatan - HPP)
    const labaKotor = totalPendapatan + totalHPP;
    
    // Laba Operasi (Laba Kotor - Beban Operasional)
    const labaOperasi = labaKotor + totalBebanOperasional;
    
    // Laba Bersih (Laba Operasi - Beban Non-Operasional)
    const labaBersih = labaOperasi + totalBebanNonOperasional;
    
    return {
      labaKotor,
      labaOperasi,
      labaBersih,
    };
  }, [dummyLabaRugiData]);

  // --- LOGIKA COLLAPSE ---
  const toggleCollapse = (kode: string) => {
    const newCollapsed = new Set(collapsedItems);
    if (newCollapsed.has(kode)) {
      newCollapsed.delete(kode);
    } else {
      newCollapsed.add(kode);
    }
    setCollapsedItems(newCollapsed);
  };
  
  const isParentCollapsed = (itemKode: string): boolean => {
    for (const collapsedKode of collapsedItems) {
      if (itemKode.startsWith(collapsedKode) && itemKode !== collapsedKode) {
        return true;
      }
    }
    return false;
  };
  
  const labaRugiItems = useMemo(() => {
    return dummyLabaRugiData.filter(item => !isParentCollapsed(item.kode));
  }, [collapsedItems]);


  // --- RENDERING LABA RUGI ---
  const renderLabaRugiTable = (data: LabaRugiItem[]) => (
    <div className="p-0 overflow-x-auto border rounded-lg">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-gray-100">
          <tr>
            <th className="px-4 py-3 text-left w-2/3">Keterangan</th>
            <th className="px-4 py-3 text-right">Nominal (IDR)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <LabaRugiItemRow
              key={item.kode}
              item={item}
              toggleCollapse={toggleCollapse}
              isCollapsed={collapsedItems.has(item.kode)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-primary" />
        Laporan Laba Rugi (Kinerja Keuangan)
      </h2>

      {/* --- KONTROL & PERIODE --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-indigo-600">
            <Calendar className="h-5 w-5" /> Kontrol Periode
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2 col-span-1">
            <Label htmlFor="start_date">Periode Awal</Label>
            <Input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2 col-span-1">
            <Label htmlFor="end_date">Periode Akhir</Label>
            <Input
              id="end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <Button
              onClick={() => {}}
              className="bg-primary hover:bg-indigo-700 w-full"
              disabled={true} // Non-fungsional di demo
            >
              Tarik Data Laporan
            </Button>
          </div>
        </CardContent>
        <CardFooter className="pt-4 flex justify-end items-center bg-gray-50 border-t">
          <Button
            onClick={() => { /* Simulasi Export */ }}
            className="bg-red-600 hover:bg-red-700"
          >
            <FileDown className="mr-2 h-4 w-4" /> Export ke PDF
          </Button>
        </CardFooter>
      </Card>
      
      {/* --- TABEL LABA RUGI --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ListChecks className="h-5 w-5" /> Detail Kinerja
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {renderLabaRugiTable(labaRugiItems)}
          
          <div className="mt-4 p-4 border-t-2 border-dashed border-gray-400">
            
            {/* LABA KOTOR */}
            <div className="flex justify-between font-bold text-lg py-1">
              <span>LABA KOTOR (Pendapatan - HPP)</span>
              <span className={labaKotor < 0 ? 'text-red-600' : 'text-green-600'}>
                {formatRupiah(labaKotor)}
              </span>
            </div>
            
            <Separator className="my-1" />

            {/* LABA OPERASI */}
            <div className="flex justify-between font-bold text-xl py-2">
              <span>LABA OPERASI (Laba Kotor - Beban Operasi)</span>
              <span className={labaOperasi < 0 ? 'text-red-700' : 'text-green-700'}>
                {formatRupiah(labaOperasi)}
              </span>
            </div>

            {/* LABA BERSIH */}
            <Separator className="my-1 border-black" />
            <div className="flex justify-between font-extrabold text-2xl py-2 bg-yellow-50">
              <span>LABA (RUGI) BERSIH TAHUN BERJALAN</span>
              <span className={labaBersih < 0 ? 'text-red-800' : 'text-primary'}>
                {formatRupiah(labaBersih)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-xs text-gray-500 mt-4">
        *Laporan Laba Rugi menunjukkan hasil kinerja operasional dan non-operasional selama periode yang dipilih.
      </p>
    </div>
  );
}