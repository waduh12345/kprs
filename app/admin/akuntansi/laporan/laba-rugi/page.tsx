"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  FileDown,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  ListChecks,
  Loader2,
  Search,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Import Service sesuai permintaan
import { useLazyGetLabaRugiQuery } from "@/services/admin/report.service";

// --- TYPES SESUAI API ---

// Node data mentah dari API (Recursive)
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

// Wrapper response API
interface LabaRugiApiResponse {
  revenues: ReportCoaItem; // Pendapatan (Object tunggal)
  expenses: ReportCoaItem[]; // Beban (Array of Objects, misal HPP, Operasional, dll)
}

// Tipe data untuk UI (Flat List)
interface LabaRugiItem {
  id: number;
  kode: string;
  nama: string;
  saldo: number;
  level: number;
  type: "HEADER" | "SUMMARY" | "DETAIL";
  hasChildren: boolean;
  group: "REVENUE" | "EXPENSE"; // Penanda kelompok untuk styling
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

// Fungsi rekursif untuk meratakan (flatten) tree data
const flattenLabaRugiTree = (
  nodes: ReportCoaItem[] | ReportCoaItem,
  group: "REVENUE" | "EXPENSE",
  result: LabaRugiItem[] = []
): LabaRugiItem[] => {
  const nodeList = Array.isArray(nodes) ? nodes : [nodes];

  nodeList.forEach((node) => {
    // 1. Hitung Saldo Normal
    // Pendapatan (Akun 4): Kredit - Debit
    // Beban (Akun 5,6,7): Debit - Kredit
    let saldo = 0;
    if (group === "REVENUE") {
      saldo = node.credit - node.debit;
    } else {
      saldo = node.debit - node.credit;
    }

    // 2. Tentukan Tipe UI
    let uiType: "HEADER" | "SUMMARY" | "DETAIL" = "SUMMARY";
    if (node.level === 1) uiType = "HEADER";
    else if (node.type === "Detail" || node.children.length === 0) uiType = "DETAIL";

    // 3. Push ke array
    result.push({
      id: node.id,
      kode: node.code,
      nama: node.name,
      saldo: saldo,
      level: node.level,
      type: uiType,
      hasChildren: node.children && node.children.length > 0,
      group: group,
    });

    // 4. Rekursif
    if (node.children && node.children.length > 0) {
      flattenLabaRugiTree(node.children, group, result);
    }
  });

  return result;
};

// --- KOMPONEN BARIS TABEL ---

const LabaRugiItemRow: React.FC<{
  item: LabaRugiItem;
  toggleCollapse: (kode: string) => void;
  isCollapsed: boolean;
}> = ({ item, toggleCollapse, isCollapsed }) => {
  const isExpandable = item.hasChildren;
  
  // Styling warna saldo
  let textColor = "text-gray-800";
  if (item.group === "REVENUE") {
      // Pendapatan positif = Hijau, Negatif = Merah
      textColor = item.saldo >= 0 ? "text-green-700" : "text-red-600";
  } else {
      // Beban positif = Merah (mengurangi laba), Negatif = Hijau (koreksi beban)
      textColor = item.saldo >= 0 ? "text-red-700" : "text-green-600";
  }

  let className = "py-2 px-4 border-b transition-colors";

  if (item.level === 1) {
    className += " font-extrabold text-lg border-t-2 mt-2 bg-gray-50";
  } else if (item.level === 2) {
    className += " font-bold text-md pl-8 bg-gray-50/50";
  } else if (item.level >= 3) {
    className += " text-sm pl-12 bg-white";
  }
  
  if (isExpandable) {
    className += " cursor-pointer hover:bg-gray-100";
  }

  return (
    <tr
      className={className}
      onClick={() => isExpandable && toggleCollapse(item.kode)}
    >
      <td className="w-2/3 align-top">
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
          <span className="flex flex-col md:flex-row md:gap-2">
             <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1 rounded w-fit h-fit mt-0.5">{item.kode}</span>
             <span>{item.nama}</span>
          </span>
        </div>
      </td>
      <td className={`text-right font-mono align-top ${textColor} ${item.level <= 2 ? 'font-extrabold' : ''}`}>
        {formatRupiah(item.saldo)}
      </td>
    </tr>
  );
};

// --- MAIN PAGE ---

export default function LaporanLabaRugiPage() {
  const today = new Date().toISOString().substring(0, 10);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
  
  const [startDate, setStartDate] = useState(startOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set());

  // --- API HOOK (LAZY) ---
  const [trigger, { data: apiResponse, isLoading, isFetching }] = useLazyGetLabaRugiQuery();

  // Handler untuk tombol "Tarik Data"
  const handleFetchData = () => {
    trigger({ from_date: startDate, to_date: endDate });
  };

  // --- DATA PROCESSING (MEMOIZED) ---
  const { allRows, labaKotor, labaOperasi, labaBersih } = useMemo(() => {
    if (!apiResponse) {
      return { allRows: [], labaKotor: 0, labaOperasi: 0, labaBersih: 0 };
    }

    // 1. Flatten Pendapatan (Revenues)
    const revenueRows = flattenLabaRugiTree(apiResponse.revenues, "REVENUE");

    // 2. Flatten Beban (Expenses - array)
    const expenseRows = flattenLabaRugiTree(apiResponse.expenses, "EXPENSE");

    // 3. Gabungkan untuk tabel
    const allRows = [...revenueRows, ...expenseRows];

    // 4. Kalkulasi Total (Berdasarkan Kode Akun Level 1)
    // Asumsi: 
    // Kode 4 = Pendapatan
    // Kode 5 = Beban Pokok (HPP)
    // Kode 6 = Beban Operasional
    // Kode 7 = Beban Lain-lain/Non Ops
    // Kita cari row level 1 yang sesuai kodenya di hasil flatten.
    
    // Helper untuk cari saldo berdasarkan awalan kode (untuk level 1)
    const getSaldoByPrefix = (prefix: string, rows: LabaRugiItem[]) => {
       const found = rows.find(r => r.kode.startsWith(prefix) && r.level === 1);
       return found ? found.saldo : 0;
    };

    const totalPendapatan = getSaldoByPrefix("4", revenueRows);
    const totalHPP = getSaldoByPrefix("5", expenseRows);
    const totalBebanOps = getSaldoByPrefix("6", expenseRows);
    const totalBebanLain = getSaldoByPrefix("7", expenseRows);

    // Rumus Laba Rugi
    // Laba Kotor = Pendapatan - HPP
    const labaKotor = totalPendapatan - totalHPP;
    
    // Laba Operasi = Laba Kotor - Beban Operasional
    const labaOperasi = labaKotor - totalBebanOps;
    
    // Laba Bersih = Laba Operasi - Beban Lain-lain
    const labaBersih = labaOperasi - totalBebanLain;

    return {
      allRows,
      labaKotor,
      labaOperasi,
      labaBersih
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
    for (const collapsedKode of collapsedItems) {
      // Logic collapse untuk kode yang diawali parent code (misal: "4.1" di collapse oleh "4")
      if (itemKode.startsWith(collapsedKode) && itemKode !== collapsedKode) {
        return true;
      }
    }
    return false;
  };
  
  const visibleRows = allRows.filter(item => !isParentCollapsed(item.kode));

  // --- RENDERING ---
  const renderTable = (rows: LabaRugiItem[]) => (
    <div className="p-0 overflow-x-auto border rounded-lg bg-white">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-gray-100 z-10 border-b">
          <tr>
            <th className="px-4 py-3 text-left w-2/3 font-semibold text-gray-700">Keterangan Akun</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-700">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((item) => (
              <LabaRugiItemRow
                key={item.id}
                item={item}
                toggleCollapse={toggleCollapse}
                isCollapsed={collapsedItems.has(item.kode)}
              />
            ))
          ) : (
            <tr>
              <td colSpan={2} className="text-center py-8 text-gray-500">
                Data belum tersedia. Silakan tentukan periode dan klik "Tarik Data Laporan".
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
        <TrendingUp className="h-6 w-6 text-primary" />
        Laporan Laba Rugi (Profit & Loss)
      </h2>

      {/* --- KONTROL FILTER --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-indigo-600">
            <Calendar className="h-5 w-5" /> Filter Periode
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2 col-span-1">
            <Label htmlFor="start_date">Dari Tanggal</Label>
            <Input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2 col-span-1">
            <Label htmlFor="end_date">Sampai Tanggal</Label>
            <Input
              id="end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <Button
              onClick={handleFetchData}
              className="bg-primary hover:bg-indigo-700 w-full"
              disabled={isLoading || isFetching}
            >
              {isLoading || isFetching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat Data...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" /> Tarik Data Laporan
                </>
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="pt-4 flex justify-end items-center bg-gray-50 border-t">
          <Button
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50"
            disabled={!apiResponse}
          >
            <FileDown className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </CardFooter>
      </Card>
      
      {/* --- TABEL DETAIL --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ListChecks className="h-5 w-5" /> Rincian Pendapatan & Beban
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {renderTable(visibleRows)}
          
          {/* --- SUMMARY SECTION --- */}
          {apiResponse && (
            <div className="mt-6 p-4 border-t-2 border-dashed border-gray-300 bg-gray-50/50 rounded-b-lg">
              
              {/* LABA KOTOR */}
              <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-300">
                <span className="font-bold text-gray-600">LABA KOTOR (Pendapatan - HPP)</span>
                <span className={`text-lg font-bold ${labaKotor < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatRupiah(labaKotor)}
                </span>
              </div>
              
              {/* LABA OPERASI */}
              <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-300">
                <span className="font-bold text-gray-600">LABA OPERASI (Laba Kotor - Beban Operasional)</span>
                <span className={`text-lg font-bold ${labaOperasi < 0 ? 'text-red-700' : 'text-green-700'}`}>
                  {formatRupiah(labaOperasi)}
                </span>
              </div>

              {/* LABA BERSIH */}
              <div className="flex justify-between items-center py-4 mt-2 bg-yellow-100/50 px-4 rounded-lg border border-yellow-200">
                <span className="font-extrabold text-xl text-gray-800">LABA (RUGI) BERSIH TAHUN BERJALAN</span>
                <span className={`text-2xl font-extrabold ${labaBersih < 0 ? 'text-red-800' : 'text-primary'}`}>
                  {formatRupiah(labaBersih)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <p className="text-xs text-gray-500 mt-4 text-center">
        *Laporan Laba Rugi menunjukkan hasil kinerja operasional dan non-operasional selama periode yang dipilih.
      </p>
    </div>
  );
}