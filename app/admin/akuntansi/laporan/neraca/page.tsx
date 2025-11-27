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
  ListChecks,
  Loader2,
} from "lucide-react";

import { useGetNeracaQuery } from "@/services/admin/report.service";

// --- TYPES SESUAI API ---

// Tipe data mentah dari API (Recursive)
interface ReportCoaItem {
  id: number;
  coa_id: number | null;
  code: string;
  name: string;
  description: string;
  level: number;
  type: string;
  debit: number;
  credit: number;
  children: ReportCoaItem[];
}

// Tipe data respon API wrapper
interface NeracaApiResponse {
  assets: ReportCoaItem;
  liabilities_equity: ReportCoaItem[];
}

// Tipe data untuk UI (Flat List)
interface NeracaItem {
  id: number;
  kode: string;
  nama: string;
  saldo: number;
  level: number;
  type: "HEADER" | "SUMMARY" | "DETAIL";
  hasChildren: boolean;
}

// --- HELPER FUNCTIONS ---

const formatRupiah = (number: number) => {
  if (isNaN(number) || number === null || number === undefined) return "Rp 0";
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Math.abs(number));
  return number < 0 ? `(${formatted})` : formatted;
};

// Fungsi rekursif untuk meratakan (flatten) tree data menjadi array baris tabel
const flattenNeracaTree = (
  nodes: ReportCoaItem[] | ReportCoaItem,
  groupType: "ASSET" | "PASIVA",
  result: NeracaItem[] = []
): NeracaItem[] => {
  const nodeList = Array.isArray(nodes) ? nodes : [nodes];

  nodeList.forEach((node) => {
    // 1. Hitung Saldo Normal
    // Aset: Debit - Kredit, Pasiva (Liabilitas/Modal): Kredit - Debit
    let saldo = 0;
    if (groupType === "ASSET") {
      saldo = node.debit - node.credit;
    } else {
      saldo = node.credit - node.debit;
    }

    // 2. Tentukan Tipe UI berdasarkan Level
    // Level 1 = HEADER, Level 4 (atau Detail) = DETAIL, Sisanya SUMMARY
    let uiType: "HEADER" | "SUMMARY" | "DETAIL" = "SUMMARY";
    if (node.level === 1) uiType = "HEADER";
    else if (node.type === "Detail" || node.children.length === 0) uiType = "DETAIL";

    // 3. Push ke array hasil
    result.push({
      id: node.id,
      kode: node.code,
      nama: node.name,
      saldo: saldo,
      level: node.level,
      type: uiType,
      hasChildren: node.children && node.children.length > 0,
    });

    // 4. Rekursif ke anak-anaknya
    if (node.children && node.children.length > 0) {
      flattenNeracaTree(node.children, groupType, result);
    }
  });

  return result;
};

// --- KOMPONEN BARIS TABEL ---

const NeracaItemRow: React.FC<{
  item: NeracaItem;
  toggleCollapse: (kode: string) => void;
  isCollapsed: boolean;
}> = ({ item, toggleCollapse, isCollapsed }) => {
  const isExpandable = item.hasChildren;
  const textColor = item.saldo < 0 ? "text-red-600" : "text-gray-800";
  
  let className = "py-2 px-4 border-b transition-colors";

  // Styling berdasarkan level
  if (item.level === 1) {
    className += " bg-gray-200 font-extrabold text-lg text-primary border-b-2 border-gray-400";
  } else if (item.level === 2) {
    className += " bg-gray-100 font-bold text-md pl-8";
  } else if (item.level === 3) {
    className += " bg-white font-semibold pl-12";
  } else if (item.level >= 4) {
    className += " text-sm pl-16 italic";
  }

  if (isExpandable) {
    className += " cursor-pointer hover:bg-black/5";
  }

  return (
    <tr
      className={className}
      onClick={() => isExpandable && toggleCollapse(item.kode)}
    >
      <td className="w-1/3 align-top">
        <div className="flex items-center gap-2">
          {isExpandable ? (
            isCollapsed ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <span className="w-4 h-4 inline-block"></span>
          )}
          <span>{item.kode}</span>
        </div>
      </td>
      <td className="align-top">{item.nama}</td>
      <td
        className={`text-right font-mono align-top ${textColor} ${
          item.level <= 2 ? "font-extrabold" : ""
        }`}
      >
        {formatRupiah(item.saldo)}
      </td>
    </tr>
  );
};

// --- MAIN PAGE COMPONENT ---

export default function LaporanNeracaPage() {
  // Setup Tanggal (Default: Hari ini)
  const today = new Date().toISOString().substring(0, 10);
  const [fromDate, setFromDate] = useState<string>("2024-01-01"); // Contoh default start
  const [toDate, setToDate] = useState<string>(today);
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set());

  // --- FETCH DATA API ---
  const { data: apiResponse, isLoading, isFetching, refetch } = useGetNeracaQuery({
    from_date: fromDate,
    to_date: toDate,
  });

  // --- TRANSFORM DATA (MEMOIZED) ---
  const { assetRows, pasivaRows, totalAset, totalPasiva, isBalanced } = useMemo(() => {
    if (!apiResponse) {
      return {
        assetRows: [],
        pasivaRows: [],
        totalAset: 0,
        totalPasiva: 0,
        isBalanced: true,
      };
    }

    // 1. Flatten Data Aset
    const flatAssets = flattenNeracaTree(apiResponse.assets, "ASSET");
    
    // 2. Flatten Data Liabilitas & Ekuitas
    const flatPasiva = flattenNeracaTree(apiResponse.liabilities_equity, "PASIVA");

    // 3. Ambil Total dari Root Level (Level 1)
    // Asumsi: Elemen pertama dari hasil flatten Aset adalah Header Aset
    const totalAsetVal = flatAssets.find((i) => i.level === 1)?.saldo || 0;
    
    // Total Pasiva adalah penjumlahan semua elemen level 1 di array pasiva (Liabilitas + Ekuitas)
    const totalPasivaVal = flatPasiva
      .filter((i) => i.level === 1)
      .reduce((sum, item) => sum + item.saldo, 0);

    return {
      assetRows: flatAssets,
      pasivaRows: flatPasiva,
      totalAset: totalAsetVal,
      totalPasiva: totalPasivaVal,
      isBalanced: totalAsetVal === totalPasivaVal,
    };
  }, [apiResponse]);

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
    // Cek apakah kode ini adalah anak dari kode yang sedang di-collapse
    // Contoh: itemKode "1.1.01", collapsed "1.1" -> True
    for (const collapsedKode of collapsedItems) {
      if (itemKode.startsWith(collapsedKode + ".") || itemKode.startsWith(collapsedKode + " ")) {
         // Logic startsWith ini asumsi kode menggunakan titik (1.1). 
         // Jika format kode murni string tanpa pemisah jelas tapi hierarki panjang (1, 11, 111),
         // kita bisa gunakan logika: itemKode.startsWith(collapsedKode) && itemKode !== collapsedKode
         return true;
      }
      // Fallback untuk format "1", "1.1"
      if (itemKode.startsWith(collapsedKode) && itemKode !== collapsedKode) {
        return true;
      }
    }
    return false;
  };

  // Filter baris yang akan dirender berdasarkan status collapse parent
  const visibleAssetRows = assetRows.filter((item) => !isParentCollapsed(item.kode));
  const visiblePasivaRows = pasivaRows.filter((item) => !isParentCollapsed(item.kode));

  // --- RENDER TABLE ---
  const renderNeracaTable = (data: NeracaItem[]) => (
    <div className="p-0 overflow-x-auto border rounded-lg bg-white">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-gray-50 z-10 border-b">
          <tr>
            <th className="px-4 py-3 text-left w-1/3 font-semibold text-gray-600">Kode Akun</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Nama Akun</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">Saldo Akhir</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((item) => (
              <NeracaItemRow
                key={item.id}
                item={item}
                toggleCollapse={toggleCollapse}
                isCollapsed={collapsedItems.has(item.kode)}
              />
            ))
          ) : (
            <tr>
              <td colSpan={3} className="text-center py-8 text-gray-400">
                Tidak ada data untuk ditampilkan
              </td>
            </tr>
          )}
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

      {/* --- KONTROL FILTER --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-indigo-600">
            <Calendar className="h-5 w-5" /> Filter Periode
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="from_date">Dari Tanggal</Label>
            <Input
              id="from_date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to_date">Sampai Tanggal</Label>
            <Input
              id="to_date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="">
            <Button
              onClick={() => refetch()}
              className="bg-primary hover:bg-indigo-700 w-full"
              disabled={isLoading || isFetching}
            >
              {isLoading || isFetching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat...
                </>
              ) : (
                "Terapkan Filter"
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="pt-4 flex flex-col md:flex-row justify-between items-center bg-gray-50 border-t gap-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border shadow-sm">
            {isBalanced ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-red-600" />
            )}
            <span className="font-bold text-sm text-gray-600">Kontrol:</span>
            <span
              className={`text-sm font-extrabold ${
                isBalanced ? "text-green-600" : "text-red-600"
              }`}
            >
              {isBalanced ? "SEIMBANG" : "TIDAK SEIMBANG"}
            </span>
          </div>
          <Button
            onClick={() => { /* Implementasi Export PDF nanti */ }}
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <FileDown className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </CardFooter>
      </Card>

      {/* --- KONTEN UTAMA --- */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* KOLOM KIRI: ASET */}
          <Card className="flex flex-col h-full border-t-4 border-t-blue-500 shadow-md">
            <CardHeader className="bg-blue-50/50 pb-4 border-b">
              <CardTitle className="text-lg flex justify-between items-center text-blue-800">
                <span>AKTIVA (ASET)</span>
                <span className="font-mono text-xl">{formatRupiah(totalAset)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-grow bg-gray-50/30">
              {renderNeracaTable(visibleAssetRows)}
            </CardContent>
            <div className="p-4 bg-blue-100 text-blue-900 font-extrabold flex justify-between text-lg rounded-b-lg">
              <span>TOTAL ASET</span>
              <span>{formatRupiah(totalAset)}</span>
            </div>
          </Card>

          {/* KOLOM KANAN: LIABILITAS & EKUITAS */}
          <Card className="flex flex-col h-full border-t-4 border-t-red-500 shadow-md">
            <CardHeader className="bg-red-50/50 pb-4 border-b">
              <CardTitle className="text-lg flex justify-between items-center text-red-800">
                <span>PASIVA (LIABILITAS + EKUITAS)</span>
                <span className="font-mono text-xl">{formatRupiah(totalPasiva)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-grow bg-gray-50/30">
              {renderNeracaTable(visiblePasivaRows)}
            </CardContent>
            <div className="p-4 bg-red-100 text-red-900 font-extrabold flex justify-between text-lg rounded-b-lg">
              <span>TOTAL PASIVA</span>
              <span>{formatRupiah(totalPasiva)}</span>
            </div>
          </Card>
        </div>
      )}

      <p className="text-xs text-gray-500 text-center mt-8">
        *Laporan ini dihasilkan otomatis dari sistem akuntansi. Pastikan periode tanggal yang dipilih benar.
      </p>
    </div>
  );
}