"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Calendar,
  FileDown,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertTriangle,
  Zap,
  ListChecks,
} from "lucide-react";

// --- DUMMY DATA & TYPES ---

interface NeracaItem {
  kode: string;
  nama: string;
  saldo: number;
  level: 1 | 2 | 3 | 4; // Level 1: Aset, Liabilitas, Ekuitas
  type: "HEADER" | "SUMMARY" | "DETAIL";
}

// Data Neraca Dummy (Posisi 2025-11-30)
const dummyNeracaData: NeracaItem[] = [
  // --- ASET ---
  { kode: "1", nama: "ASET", saldo: 1200000000, level: 1, type: "HEADER" },
  { kode: "11", nama: "ASET LANCAR", saldo: 550000000, level: 2, type: "SUMMARY" },
  { kode: "111", nama: "Kas & Bank", saldo: 300000000, level: 3, type: "SUMMARY" },
  { kode: "111001", nama: "Kas di Tangan", saldo: 5000000, level: 4, type: "DETAIL" },
  { kode: "111002", nama: "Bank Operasional", saldo: 295000000, level: 4, type: "DETAIL" },
  { kode: "112", nama: "Piutang", saldo: 250000000, level: 3, type: "SUMMARY" },
  { kode: "112001", nama: "Piutang Anggota", saldo: 250000000, level: 4, type: "DETAIL" },
  { kode: "12", nama: "ASET TETAP", saldo: 650000000, level: 2, type: "SUMMARY" },
  { kode: "121", nama: "Tanah & Bangunan", saldo: 700000000, level: 3, type: "SUMMARY" },
  { kode: "122", nama: "Akumulasi Penyusutan", saldo: -50000000, level: 3, type: "SUMMARY" },

  // --- LIABILITAS ---
  { kode: "2", nama: "LIABILITAS", saldo: 400000000, level: 1, type: "HEADER" },
  { kode: "21", nama: "LIABILITAS JANGKA PENDEK", saldo: 150000000, level: 2, type: "SUMMARY" },
  { kode: "211001", nama: "Utang Dagang", saldo: 50000000, level: 4, type: "DETAIL" },
  { kode: "211002", nama: "Utang Gaji", saldo: 100000000, level: 4, type: "DETAIL" },
  { kode: "22", nama: "LIABILITAS JANGKA PANJANG", saldo: 250000000, level: 2, type: "SUMMARY" },
  { kode: "221001", nama: "Utang Bank Jangka Panjang", saldo: 250000000, level: 4, type: "DETAIL" },
  
  // --- EKUITAS ---
  { kode: "3", nama: "EKUITAS", saldo: 800000000, level: 1, type: "HEADER" },
  { kode: "31", nama: "Modal", saldo: 500000000, level: 2, type: "SUMMARY" },
  { kode: "311001", nama: "Modal Anggota", saldo: 500000000, level: 4, type: "DETAIL" },
  { kode: "32", nama: "Laba Ditahan / SHU", saldo: 300000000, level: 2, type: "SUMMARY" },
  { kode: "321001", nama: "SHU Tahun Lalu", saldo: 200000000, level: 4, type: "DETAIL" },
  { kode: "321002", nama: "Laba (Rugi) Berjalan", saldo: 100000000, level: 4, type: "DETAIL" },
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

const NeracaItemRow: React.FC<{ item: NeracaItem, toggleCollapse: (kode: string) => void, isCollapsed: boolean }> = ({ item, toggleCollapse, isCollapsed }) => {
  const isExpandable = item.type !== "DETAIL";
  const textColor = item.saldo < 0 ? "text-red-600" : "text-gray-800";
  let className = "py-2 px-4 border-b";

  if (item.level === 1) {
    className += " bg-gray-200 font-extrabold text-lg text-primary";
  } else if (item.level === 2) {
    className += " bg-gray-100 font-bold text-md pl-8";
  } else if (item.level === 3) {
    className += " bg-white font-semibold pl-12";
  } else if (item.level === 4) {
    className += " text-sm pl-16 italic";
  }
  
  if (item.type === "SUMMARY" || item.type === "HEADER") {
    className += " cursor-pointer hover:bg-gray-100";
  }
  if (item.level === 1) {
    className += " border-b-2 border-gray-400";
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
          <span>{item.kode}</span>
        </div>
      </td>
      <td>{item.nama}</td>
      <td className={`text-right font-mono ${textColor} ${item.level <= 2 ? 'font-extrabold' : ''}`}>
        {formatRupiah(item.saldo)}
      </td>
      {item.level <= 2 && (
          <td className={`w-1/4 text-right ${textColor}`}></td>
      )}
    </tr>
  );
};


export default function LaporanNeracaPage() {
  const today = new Date().toISOString().substring(0, 10);
  const [posisiTanggal, setPosisiTanggal] = useState(today);
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set());

  // --- LOGIKA KESEIMBANGAN NERACA ---
  const { totalAset, totalLiabilitasEkuitas, isBalanced } = useMemo(() => {
    const totalAset = dummyNeracaData.find(item => item.kode === '1')?.saldo || 0;
    // Liabilitas dan Ekuitas sudah dijumlahkan di dummy data
    const totalLiabilitas = dummyNeracaData.find(item => item.kode === '2')?.saldo || 0;
    const totalEkuitas = dummyNeracaData.find(item => item.kode === '3')?.saldo || 0;
    
    const totalLiabilitasEkuitas = totalLiabilitas + totalEkuitas;
    
    return {
      totalAset,
      totalLiabilitasEkuitas,
      isBalanced: totalAset === totalLiabilitasEkuitas,
    };
  }, [dummyNeracaData]);

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
    // Cek apakah ada kode induk yang sedang dikunci (collapsed)
    for (const collapsedKode of collapsedItems) {
      if (itemKode.startsWith(collapsedKode) && itemKode !== collapsedKode) {
        return true;
      }
    }
    return false;
  };
  
  const neracaItems = useMemo(() => {
    return dummyNeracaData.filter(item => !isParentCollapsed(item.kode));
  }, [collapsedItems]);


  // --- RENDERING NERACA ---
  const renderNeracaTable = (data: NeracaItem[]) => (
    <div className="p-0 overflow-x-auto border rounded-lg">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-gray-100">
          <tr>
            <th className="px-4 py-3 text-left w-1/3">Kode Akun</th>
            <th className="px-4 py-3 text-left">Nama Akun</th>
            <th className="px-4 py-3 text-right">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <NeracaItemRow
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
        <FileText className="h-6 w-6 text-primary" />
        Laporan Neraca (Posisi Keuangan)
      </h2>

      {/* --- KONTROL & KESEIMBANGAN --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-indigo-600">
            <Calendar className="h-5 w-5" /> Kontrol Laporan
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="posisi_tanggal">Posisi Tanggal Laporan</Label>
            <Input
              id="posisi_tanggal"
              type="date"
              value={posisiTanggal}
              onChange={(e) => setPosisiTanggal(e.target.value)}
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
        <CardFooter className="pt-4 flex justify-between items-center bg-gray-50 border-t">
          <div className="flex items-center gap-2">
            {isBalanced ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-red-600" />
            )}
            <span className="font-bold text-lg">Status Keseimbangan:</span>
            <span className={`text-lg font-extrabold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
              {isBalanced ? 'SEIMBANG' : 'TIDAK SEIMBANG'}
            </span>
          </div>
          <Button
            onClick={() => { /* Simulasi Export */ }}
            className="bg-red-600 hover:bg-red-700"
          >
            <FileDown className="mr-2 h-4 w-4" /> Export ke PDF
          </Button>
        </CardFooter>
      </Card>
      
      {/* --- TABEL NERACA --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ListChecks className="h-5 w-5" /> Struktur Neraca
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Bagian Aset */}
            <div className="border rounded-lg overflow-hidden">
                <h3 className="text-xl font-bold p-3 bg-blue-100 text-blue-800 flex justify-between items-center">
                    ASET
                    <span className="text-2xl">{formatRupiah(totalAset)}</span>
                </h3>
                {renderNeracaTable(neracaItems.filter(item => item.kode.startsWith('1')))}
                <div className="p-3 bg-blue-50 font-extrabold text-xl flex justify-between">
                    <span>TOTAL ASET</span>
                    <span className="text-primary">{formatRupiah(totalAset)}</span>
                </div>
            </div>
            
            {/* Bagian Liabilitas & Ekuitas */}
            <div className="border rounded-lg overflow-hidden">
                 <h3 className="text-xl font-bold p-3 bg-red-100 text-red-800 flex justify-between items-center">
                    LIABILITAS & EKUITAS
                    <span className="text-2xl">{formatRupiah(totalLiabilitasEkuitas)}</span>
                </h3>
                {renderNeracaTable(neracaItems.filter(item => !item.kode.startsWith('1')))}
                <div className="p-3 bg-red-50 font-extrabold text-xl flex justify-between">
                    <span>TOTAL LIABILITAS & EKUITAS</span>
                    <span className="text-red-600">{formatRupiah(totalLiabilitasEkuitas)}</span>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-xs text-gray-500 mt-4">
        *Data Neraca disajikan berdasarkan tanggal posisi yang dipilih dan harus seimbang (Aset = Liabilitas + Ekuitas).
      </p>
    </div>
  );
}