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
  Search,
  ListChecks,
  Code,
  Zap,
  Badge,
} from "lucide-react";
import Swal from "sweetalert2";
import { Separator } from "@/components/ui/separator";

// --- DUMMY DATA & TYPES ---

interface JurnalDetail {
    id: number;
    coa: string;
    coa_name: string;
    debet: number;
    kredit: number;
    keterangan_baris: string;
}

interface JurnalTransaksi {
  no_bukti: string;
  tanggal: string;
  deskripsi: string;
  tipe_jurnal: "Otomatis" | "Manual";
  total_nominal: number;
  details: JurnalDetail[];
}

const dummyJurnalData: JurnalTransaksi[] = [
  {
    no_bukti: "JRN-20251117-001",
    tanggal: "2025-11-17",
    deskripsi: "Pencatatan angsuran pinjaman batch 1",
    tipe_jurnal: "Otomatis",
    total_nominal: 25000000,
    details: [
      { id: 1, coa: "111001", coa_name: "Kas di Tangan", debet: 25000000, kredit: 0, keterangan_baris: "Penerimaan angsuran" },
      { id: 2, coa: "121001", coa_name: "Piutang Anggota", debet: 0, kredit: 22000000, keterangan_baris: "Pengurangan pokok" },
      { id: 3, coa: "410001", coa_name: "Pendapatan Jasa", debet: 0, kredit: 3000000, keterangan_baris: "Pendapatan jasa" },
    ],
  },
  {
    no_bukti: "JRN-20251117-002",
    tanggal: "2025-11-17",
    deskripsi: "Pembelian ATK bulan ini (Jurnal Manual)",
    tipe_jurnal: "Manual",
    total_nominal: 850000,
    details: [
      { id: 4, coa: "621002", coa_name: "Beban ATK", debet: 850000, kredit: 0, keterangan_baris: "Nota pembelian" },
      { id: 5, coa: "112001", coa_name: "Bank Operasional", debet: 0, kredit: 850000, keterangan_baris: "Dibayar via bank" },
    ],
  },
  {
    no_bukti: "JRN-20251116-001",
    tanggal: "2025-11-16",
    deskripsi: "Realisasi pinjaman PNJ-005",
    tipe_jurnal: "Otomatis",
    total_nominal: 15000000,
    details: [
      { id: 6, coa: "121001", coa_name: "Piutang Anggota", debet: 15000000, kredit: 0, keterangan_baris: "Pencairan pinjaman" },
      { id: 7, coa: "112001", coa_name: "Bank Operasional", debet: 0, kredit: 15000000, keterangan_baris: "Dana dicairkan" },
    ],
  },
];

// --- HELPER FUNCTIONS ---

const formatRupiah = (number: number) => {
  if (isNaN(number) || number === null || number === undefined) return '0';
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

const getStatusBadge = (tipe: JurnalTransaksi["tipe_jurnal"]) => {
  if (tipe === "Otomatis") return <Badge variant="default" className="bg-indigo-500 hover:bg-indigo-600">Sistem</Badge>;
  return <Badge variant="secondary">Manual</Badge>;
}

// --- KOMPONEN UTAMA ---

export default function LaporanJurnalTransaksiPage() {
  const today = new Date().toISOString().substring(0, 10);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
  
  const [startDate, setStartDate] = useState(startOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [query, setQuery] = useState("");
  const [expandedJurnal, setExpandedJurnal] = useState<Set<string>>(new Set());

  // --- FILTERING ---
  const filteredJurnal = useMemo(() => {
    let arr = dummyJurnalData;

    // 1. Filter Tanggal
    arr = arr.filter(
      (it) => it.tanggal >= startDate && it.tanggal <= endDate
    );

    // 2. Filter Query Pencarian
    if (!query.trim()) return arr;
    const q = query.toLowerCase();
    return arr.filter((it) =>
      [it.no_bukti, it.deskripsi].some(
        (f) => f?.toLowerCase?.().includes?.(q)
      )
    );
  }, [dummyJurnalData, query, startDate, endDate]);

  // --- LOGIKA EXPAND ---
  const toggleExpand = (no_bukti: string) => {
    const newExpanded = new Set(expandedJurnal);
    if (newExpanded.has(no_bukti)) {
      newExpanded.delete(no_bukti);
    } else {
      newExpanded.add(no_bukti);
    }
    setExpandedJurnal(newExpanded);
  };
  
  // --- HANDLER EXPORT ---
  const handleExportExcel = () => {
    Swal.fire({
      icon: "info",
      title: "Export Laporan Jurnal",
      text: `Mengekspor Laporan Jurnal Transaksi dari ${startDate} hingga ${endDate}. (Simulasi)`,
      confirmButtonText: "Oke",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" />
        Laporan Jurnal Transaksi (Jurnal Umum)
      </h2>

      {/* --- KARTU KONTROL FILTER --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-indigo-600">
            <Calendar className="h-5 w-5" /> Kontrol Laporan
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="start_date">Tanggal Awal</Label>
            <Input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date">Tanggal Akhir</Label>
            <Input
              id="end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="search_query">Cari Bukti / Deskripsi</Label>
            <Input
              id="search_query"
              placeholder="No. Bukti atau Keterangan Jurnal"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10"
            />
          </div>
        </CardContent>
        <CardFooter className="pt-4 flex justify-end items-center bg-gray-50 border-t">
          <Button
            onClick={handleExportExcel}
            className="bg-red-600 hover:bg-red-700"
          >
            <FileDown className="mr-2 h-4 w-4" /> Export ke PDF/Excel
          </Button>
        </CardFooter>
      </Card>

      {/* --- TABEL JURNAL TRANSAKSI --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ListChecks className="h-5 w-5" /> Daftar Jurnal Posting
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-0 overflow-x-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-muted text-left">
                <tr>
                  <th className="px-4 py-3 w-[50px]"></th> {/* Expand Button */}
                  <th className="px-4 py-3 w-[120px]">Tgl</th>
                  <th className="px-4 py-3 w-[180px]">No. Bukti</th>
                  <th className="px-4 py-3">Deskripsi</th>
                  <th className="px-4 py-3 w-[100px] text-center">Tipe</th>
                  <th className="px-4 py-3 text-right w-[150px]">Total Nominal</th>
                </tr>
              </thead>
              <tbody>
                {filteredJurnal.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-4">
                      Tidak ada jurnal yang ditemukan dalam periode yang dipilih.
                    </td>
                  </tr>
                ) : (
                  filteredJurnal.map((jurnal) => (
                    <React.Fragment key={jurnal.no_bukti}>
                      {/* --- BARIS UTAMA (HEADER) --- */}
                      <tr className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpand(jurnal.no_bukti)}>
                        <td className="px-4 py-3">
                          {expandedJurnal.has(jurnal.no_bukti) ? (
                            <ChevronUp className="h-4 w-4 text-primary" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{jurnal.tanggal}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium">{jurnal.no_bukti}</td>
                        <td className="px-4 py-3 italic text-gray-700">{jurnal.deskripsi}</td>
                        <td className="px-4 py-3 text-center">{getStatusBadge(jurnal.tipe_jurnal)}</td>
                        <td className="px-4 py-3 text-right font-bold text-primary">{formatRupiah(jurnal.total_nominal)}</td>
                      </tr>

                      {/* --- BARIS DETAIL (EXPANDABLE) --- */}
                      {expandedJurnal.has(jurnal.no_bukti) && (
                        <tr>
                          <td colSpan={6} className="p-0 bg-gray-50">
                            <div className="p-4 border-l-4 border-indigo-300">
                              <h5 className="font-semibold mb-2 flex items-center gap-1 text-sm text-indigo-600">
                                <Code className="h-4 w-4"/> Rincian Debet / Kredit:
                              </h5>
                              <table className="w-full text-xs">
                                <thead className="bg-white border-b">
                                  <tr>
                                    <th className="p-2 text-left w-[120px]">COA</th>
                                    <th className="p-2 text-left">Keterangan Baris</th>
                                    <th className="p-2 text-right w-[150px]">Debet</th>
                                    <th className="p-2 text-right w-[150px]">Kredit</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {jurnal.details.map((detail) => (
                                    <tr key={detail.id} className="border-t">
                                      <td className="p-2 font-mono">{detail.coa}</td>
                                      <td className="p-2 italic text-gray-600">{detail.keterangan_baris}</td>
                                      <td className="p-2 text-right text-red-600">{formatRupiah(detail.debet)}</td>
                                      <td className="p-2 text-right text-green-600">{formatRupiah(detail.kredit)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot className="bg-gray-100 font-bold">
                                  <tr>
                                    <td colSpan={2} className="p-2 text-right">Total</td>
                                    <td className="p-2 text-right">{formatRupiah(jurnal.total_nominal)}</td>
                                    <td className="p-2 text-right">{formatRupiah(jurnal.total_nominal)}</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-xs text-gray-500 mt-4">
        *Laporan ini menyajikan semua transaksi jurnal yang telah diposting secara kronologis berdasarkan periode yang dipilih.
      </p>
    </div>
  );
}