"use client";

import { useMemo, useState } from "react";
import { useGetSimpananBerjangkaListQuery } from "@/services/admin/simpanan/simpanan-berjangka.service";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Printer, Filter, Calculator } from "lucide-react";

// --- TYPES ---
interface SimpananItem {
  id: number;
  reference: string;
  no_bilyet: string | null;
  no_ao: string | null;
  maturity_date: string;
  term_months: number;
  category_interest_rate: number;
  user_name: string;
  nominal: number;
  description: string | null;
}

// --- UTILS ---
const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .replace(/ /g, "-");
};

export default function JatuhTempoPage() {
  const currentYear = new Date().getFullYear();

  // --- STATE ---
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));

  // --- FETCH DATA ---
  const { data, isLoading, isFetching } = useGetSimpananBerjangkaListQuery(
    { page: 1, paginate: 100 },
    { refetchOnMountOrArgChange: true }
  );

  // --- DATA PROCESSING ---
  const rawList = useMemo<SimpananItem[]>(() => {
    const response = data as unknown as { data: { data: SimpananItem[] } };
    return response?.data?.data ?? [];
  }, [data]);

  const filteredList = useMemo<SimpananItem[]>(() => {
    if (!rawList || rawList.length === 0) return [];
    if (selectedMonth === "all") return rawList;

    return rawList.filter((item) => {
      if (!item.maturity_date) return false;
      const date = new Date(item.maturity_date);
      return (
        date.getMonth() + 1 === Number(selectedMonth) &&
        date.getFullYear() === Number(selectedYear)
      );
    });
  }, [rawList, selectedMonth, selectedYear]);

  const totalNominal = filteredList.reduce(
    (acc, curr) => acc + (Number(curr.nominal) || 0),
    0
  );

  const monthName =
    selectedMonth === "all"
      ? "SEMUA PERIODE"
      : new Date(2000, Number(selectedMonth) - 1, 1)
          .toLocaleString("id-ID", { month: "long" })
          .toUpperCase();

  // --- HANDLER PRINT ---
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white p-6 font-sans space-y-4">
      {/* --- HEADER --- */}
      <div
        id="printable-header"
        className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-200 pb-4"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-red-600" />
            LAPORAN JATUH TEMPO
          </h1>
        </div>

        <Button
          variant="outline"
          className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 print:hidden"
          onClick={handlePrint}
        >
          <Printer className="w-4 h-4 mr-2" />
          Cetak PDF
        </Button>
      </div>

      {/* --- FILTER TOOLBAR --- */}
      <Card className="shadow-none border border-gray-200 bg-gray-50 print:hidden">
        <CardContent className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
              <Filter className="w-4 h-4" /> Filter:
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[160px] bg-white h-9 text-sm">
                <SelectValue placeholder="Pilih Bulan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-semibold text-red-600">
                  Semua Bulan
                </SelectItem>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i} value={String(i + 1)}>
                    {new Date(0, i).toLocaleString("id-ID", { month: "long" })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px] bg-white h-9 text-sm">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => (
                  <SelectItem key={i} value={String(currentYear - 2 + i)}>
                    {currentYear - 2 + i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-white border border-red-100 px-4 py-2 rounded-lg shadow-sm">
            <span className="text-xs font-bold text-gray-500 uppercase mr-2">
              Total Jatuh Tempo:
            </span>
            <span className="text-lg font-bold text-red-600">
              {formatRupiah(totalNominal)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* --- TABEL AREA --- */}
      <div
        id="printable-table"
        className="border border-gray-300 rounded-md overflow-hidden print:border-none print:overflow-visible"
      >
        <div className="bg-white p-3 border-b border-gray-300 flex justify-between items-center print:border-b-2 print:border-black">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
            DAFTAR SIMPANAN - {monthName}{" "}
            {selectedMonth !== "all" ? selectedYear : ""}
          </h2>
          <span className="text-[10px] font-bold text-red-600 border border-red-200 px-2 py-0.5 rounded print:text-black print:border-black">
            KOPERASI MERAH PUTIH
          </span>
        </div>

        {/* NOTE: 
           - 'overflow-x-auto' membuat scroll horizontal jika layar kecil.
           - 'print:overflow-visible' memastikan saat print tidak ada scrollbar.
        */}
        <div className="overflow-x-auto print:overflow-visible">
          {/* NOTE:
             - 'min-w-[1500px]': Memaksa tabel lebar di layar agar kolom lega & memicu scroll.
             - 'print:min-w-0 print:w-full': Saat print, reset lebar agar pas kertas.
          */}
          <table className="w-full min-w-[1500px] text-xs text-left border-collapse print:min-w-0 print:w-full">
            <thead className="bg-red-700 text-white font-semibold print:bg-gray-200 print:text-black">
              <tr>
                <th className="px-2 py-3 border border-gray-300 w-10 text-center">
                  No
                </th>
                <th className="px-2 py-3 border border-gray-300 w-24 whitespace-nowrap">
                  Kode Marketing
                </th>
                <th className="px-2 py-3 border border-gray-300 w-28 whitespace-nowrap">
                  No Bilyet
                </th>
                <th className="px-2 py-3 border border-gray-300 w-24 text-center">
                  Tgl Jatuh Tempo
                </th>
                <th className="px-2 py-3 border border-gray-300 w-16 text-center">
                  Jangka Waktu (Bln)
                </th>
                <th className="px-2 py-3 border border-gray-300 w-16 text-center">
                  Rate %
                </th>
                <th className="px-2 py-3 border border-gray-300 w-12 text-center">
                  CB %
                </th>
                <th className="px-2 py-3 border border-gray-300">
                  Nama Nasabah
                </th>
                <th className="px-2 py-3 border border-gray-300 text-right w-32">
                  Nominal Simpanan (Rp.)
                </th>
                <th className="px-2 py-3 border border-gray-300 text-right w-32">
                  Nominal ARO (Rp.)
                </th>
                <th className="px-2 py-3 border border-gray-300 w-32">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {isLoading || isFetching ? (
                <tr>
                  <td colSpan={11} className="p-4 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                    </div>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-4 text-center italic">
                    Tidak ada data.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, index) => (
                  <tr key={item.id} className="print:break-inside-avoid">
                    <td className="px-2 py-1 border border-gray-300 text-center">
                      {index + 1}
                    </td>
                    <td className="px-2 py-1 border border-gray-300 font-mono">
                      {item.no_ao || "-"}
                    </td>
                    <td className="px-2 py-1 border border-gray-300 font-mono">
                      {item.no_bilyet || item.reference}
                    </td>
                    <td className="px-2 py-1 border border-gray-300 text-center whitespace-nowrap">
                      {formatDate(item.maturity_date)}
                    </td>
                    <td className="px-2 py-1 border border-gray-300 text-center">
                      {item.term_months}
                    </td>
                    <td className="px-2 py-1 border border-gray-300 text-center">
                      {Number(item.category_interest_rate).toFixed(2)}
                    </td>
                    <td className="px-2 py-1 border border-gray-300 text-center">
                      0
                    </td>

                    {/* Menggunakan whitespace-normal break-words agar nama panjang turun ke bawah (tidak tertimpa) */}
                    <td className="px-2 py-1 border border-gray-300 uppercase whitespace-normal break-words">
                      {item.user_name}
                    </td>

                    <td className="px-2 py-1 border border-gray-300 text-right font-mono whitespace-nowrap">
                      {formatRupiah(item.nominal).replace("Rp", "")}
                    </td>
                    <td className="px-2 py-1 border border-gray-300 text-right font-mono whitespace-nowrap">
                      0,00
                    </td>

                    {/* Menggunakan whitespace-normal break-words agar notes panjang turun ke bawah */}
                    <td className="px-2 py-1 border border-gray-300 text-xs whitespace-normal break-words">
                      {item.description || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!isLoading && filteredList.length > 0 && (
              <tfoot>
                <tr className="bg-gray-100 font-bold print:bg-transparent">
                  <td
                    colSpan={8}
                    className="px-2 py-2 border border-gray-300 text-right uppercase"
                  >
                    Total
                  </td>
                  <td className="px-2 py-2 border border-gray-300 text-right font-mono text-red-700 print:text-black">
                    {formatRupiah(totalNominal).replace("Rp", "")}
                  </td>
                  <td className="border border-gray-300 text-right font-mono">
                    0,00
                  </td>
                  <td className="border border-gray-300"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* --- GLOBAL CSS KHUSUS PRINT --- */}
      <style jsx global>{`
        @media print {
          /* 1. Kertas Landscape & Margin Tipis */
          @page {
            size: landscape;
            margin: 5mm;
          }

          /* 2. Sembunyikan Layout Global Next.js */
          body > *:not(#printable-root) {
          }

          /* 3. Reset Body */
          body,
          html {
            background-color: white;
            height: auto;
            width: 100%;
            overflow: visible;
          }

          /* 4. Sembunyikan elemen lain & Zoom Out Content */
          body * {
            visibility: hidden;
          }

          /* 5. Tampilkan Header & Tabel */
          #printable-header,
          #printable-header *,
          #printable-table,
          #printable-table * {
            visibility: visible;
          }

          /* 6. Posisikan Konten & Scaling (Zoom) agar muat 1 Halaman */
          #printable-header {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }
          #printable-table {
            position: absolute;
            top: 60px; /* Jarak dari header */
            left: 0;
            width: 100%;
            /* TRIK UTAMA: Zoom out. 
               Nilai 65% - 75% biasanya pas untuk tabel 11 kolom agar muat 1 page width.
            */
            zoom: 70%;
          }

          /* 7. Warna & Font */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Font tabel diperkecil saat print untuk menghemat ruang */
          table {
            font-size: 9px !important;
          }

          /* Pastikan text wrap saat print agar tidak tertimpa/terpotong */
          td,
          th {
            white-space: normal !important;
            word-wrap: break-word !important;
          }

          /* Utility */
          .print\:hidden {
            display: none !important;
          }
          .print\:border-black {
            border-color: #000 !important;
          }
          .print\:text-black {
            color: #000 !important;
          }
          .print\:overflow-visible {
            overflow: visible !important;
          }
          .print\:min-w-0 {
            min-width: 0 !important;
          }
          .print\:w-full {
            width: 100% !important;
          }

          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}