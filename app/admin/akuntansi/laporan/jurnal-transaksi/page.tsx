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
  ListChecks,
  Code,
  Loader2,
  Search,
} from "lucide-react";
import Swal from "sweetalert2";
import { Badge } from "@/components/ui/badge";

// ⬇️ IMPORT DARI SERVICE
import {
  useGetJournalListQuery,
  useGetJournalByIdQuery,
  type Journal,
  type JournalDetail,
} from "@/services/admin/journal.service";

// --- HELPER FUNCTIONS ---

const formatRupiah = (number: number) => {
  if (isNaN(number) || number === null || number === undefined) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// --- SUB-COMPONENT: DETAIL ROW (Lazy Load) ---
const JournalDetailRow = ({ id, colSpan }: { id: number; colSpan: number }) => {
  // Mengambil detail berdasarkan ID (type Journal otomatis dari transformResponse)
  const { data: journal, isLoading, isError } = useGetJournalByIdQuery(id);

  if (isLoading) {
    return (
      <tr>
        <td colSpan={colSpan} className="p-4 text-center bg-gray-50 text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat rincian jurnal...
          </div>
        </td>
      </tr>
    );
  }

  if (isError || !journal) {
    return (
      <tr>
        <td colSpan={colSpan} className="p-4 text-center bg-red-50 text-red-500">
          Gagal memuat rincian data.
        </td>
      </tr>
    );
  }

  // Mengambil details dari response
  const detailsData = journal.details || [];

  // Hitung total untuk footer
  const totalDebit = detailsData.reduce((acc, curr) => acc + Number(curr.debit), 0);
  const totalCredit = detailsData.reduce((acc, curr) => acc + Number(curr.credit), 0);

  return (
    <tr>
      <td colSpan={colSpan} className="p-0 bg-gray-50 border-b shadow-inner">
        <div className="p-4 border-l-4 border-indigo-300 ml-4 my-2 rounded-r-md bg-white/50">
          <div className="flex justify-between items-start mb-3">
            <h5 className="font-semibold flex items-center gap-1 text-sm text-indigo-600">
              <Code className="h-4 w-4" /> Rincian Jurnal: {journal.reference}
            </h5>
            <div className="text-xs text-gray-500 space-y-1 text-right">
               <p>Dibuat: {formatDate(journal.created_at)}</p>
               {detailsData.length === 0 && <span className="text-orange-500 italic">(Data detail kosong)</span>}
            </div>
          </div>
          
          <table className="w-full text-xs border border-gray-200 rounded overflow-hidden">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-2 text-left w-[150px]">Akun (COA)</th>
                <th className="p-2 text-left">Memo / Keterangan Baris</th>
                <th className="p-2 text-right w-[150px]">Debet</th>
                <th className="p-2 text-right w-[150px]">Kredit</th>
              </tr>
            </thead>
            <tbody>
              {detailsData.map((detail: JournalDetail) => (
                <tr key={detail.id} className="border-t hover:bg-gray-50">
                  <td className="p-2 font-mono text-gray-700">
                    <div className="flex flex-col">
                      {/* Menampilkan Kode dan Nama Akun jika object coa ada */}
                      <span className="font-bold">{detail.coa?.code ?? `ID: ${detail.coa_id}`}</span>
                      <span className="text-[10px] text-gray-500">{detail.coa?.name ?? "-"}</span>
                    </div>
                  </td>
                  <td className="p-2 italic text-gray-600">
                    {detail.memo || "-"}
                  </td>
                  <td className="p-2 text-right font-medium text-gray-700">
                    {Number(detail.debit) > 0 ? formatRupiah(detail.debit) : "-"}
                  </td>
                  <td className="p-2 text-right font-medium text-gray-700">
                    {Number(detail.credit) > 0 ? formatRupiah(detail.credit) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-indigo-50 font-bold border-t border-indigo-100">
              <tr>
                <td colSpan={2} className="p-2 text-right text-indigo-900">Total</td>
                <td className="p-2 text-right text-indigo-700">{formatRupiah(totalDebit)}</td>
                <td className="p-2 text-right text-indigo-700">{formatRupiah(totalCredit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </td>
    </tr>
  );
};

// --- KOMPONEN UTAMA ---

export default function LaporanJurnalTransaksiPage() {
  // State
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [expandedJurnal, setExpandedJurnal] = useState<Set<number>>(new Set());
  
  // Tanggal default
  const today = new Date().toISOString().substring(0, 10);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
  const [startDate, setStartDate] = useState(startOfMonth);
  const [endDate, setEndDate] = useState(today);

  // Hook API List
  // Perhatikan: Karena transformResponse di service me-return 'data' (JournalListResponse),
  // maka 'journalResp' di sini strukturnya langsung { current_page, data: Journal[], ... }
  const { data: journalResp, isLoading, isFetching } = useGetJournalListQuery({
    page,
    paginate: 10,
    search: query,
    from_date: startDate,
    to_date: endDate,
    // Jika backend mendukung filter tanggal, tambahkan parameter di interface GetJournalListParams service dulu
    // contoh: startDate, endDate (saat ini interface service belum ada, jadi filter tanggal hanya UI dummy atau perlu update service)
  });

  const list = useMemo(() => journalResp?.data ?? [], [journalResp]);
  const meta = journalResp; // meta data pagination ada di root response

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedJurnal);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedJurnal(newExpanded);
  };

  const handleExportExcel = () => {
    Swal.fire({
      icon: "info",
      title: "Export Laporan Jurnal",
      text: "Fitur export akan memproses data sesuai filter saat ini.",
      confirmButtonText: "Oke",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" />
        Laporan Jurnal Transaksi
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
            <Label htmlFor="search_query">Cari Referensi / Deskripsi</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="search_query"
                placeholder="Cth: JOUR/2025..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1); // Reset page saat searching
                }}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-4 flex justify-between items-center bg-gray-50 border-t">
          <div className="text-xs text-gray-500">
            Menampilkan data halaman {meta?.current_page ?? 1} dari {meta?.last_page ?? 1}
          </div>
          <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white">
            <FileDown className="mr-2 h-4 w-4" /> Export Data
          </Button>
        </CardFooter>
      </Card>

      {/* --- TABEL JURNAL TRANSAKSI --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ListChecks className="h-5 w-5" /> Daftar Jurnal Posting
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-0 overflow-x-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-4 py-3 w-[50px]"></th>
                  <th className="px-4 py-3 w-[120px]">Tanggal</th>
                  <th className="px-4 py-3 w-[200px]">No. Referensi</th>
                  <th className="px-4 py-3">Deskripsi</th>
                  <th className="px-4 py-3 w-[100px] text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8">
                      <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p>Mengambil data jurnal...</p>
                      </div>
                    </td>
                  </tr>
                ) : list.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-gray-500">
                      Tidak ada jurnal yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  list.map((item: Journal) => (
                    <React.Fragment key={item.id}>
                      {/* --- BARIS UTAMA --- */}
                      <tr 
                        className={`border-t cursor-pointer transition-colors ${
                          expandedJurnal.has(item.id) ? "bg-indigo-50/50" : "hover:bg-gray-50"
                        }`}
                        onClick={() => toggleExpand(item.id)}
                      >
                        <td className="px-4 py-3 text-center">
                          {expandedJurnal.has(item.id) ? (
                            <ChevronUp className="h-4 w-4 text-primary mx-auto" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400 mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                          {formatDate(item.date)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-indigo-700">
                          {item.reference}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {item.description}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.is_posted ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 shadow-none">
                              Posted
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Draft</Badge>
                          )}
                        </td>
                      </tr>

                      {/* --- BARIS DETAIL (COMPONENT) --- */}
                      {expandedJurnal.has(item.id) && (
                        <JournalDetailRow id={item.id} colSpan={5} />
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* --- PAGINATION --- */}
          {meta && meta.last_page > 1 && (
            <div className="p-4 flex items-center justify-between bg-white border-t">
              <div className="text-sm text-gray-500">
                Halaman {meta.current_page} dari {meta.last_page}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.current_page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}