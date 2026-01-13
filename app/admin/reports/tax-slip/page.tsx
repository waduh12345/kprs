"use client";

import React from "react";
import {
  Printer,
  FileText,
  Building2,
  Calendar,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// --- DATA HARDCODED ---
const TAX_DATA = [
  // JANUARI
  {
    date: "22-Jan-2025",
    bilyet: "AA001290",
    name: "ASTO OR ROY WINART",
    desc: "Pajak Bunga Simpanan Berjangka",
    interest: 7622950.0,
    tax_rate: "10%",
    tax_nominal: 762295.0,
  },
  {
    date: "22-Jan-2025",
    bilyet: "AA001290",
    name: "ASTO OR ROY WINART",
    desc: "Cashback JULIATI SOENASTO OR ROY WI",
    interest: 423500.0,
    tax_rate: "10%",
    tax_nominal: 42350.0,
  },
  // FEBRUARI
  {
    date: "22-Feb-2025",
    bilyet: "AA001290",
    name: "ASTO OR ROY WINART",
    desc: "Pajak Bunga Simpanan Berjangka",
    interest: 7643830.0,
    tax_rate: "10%",
    tax_nominal: 764383.0,
  },
  {
    date: "22-Feb-2025",
    bilyet: "AA001290",
    name: "ASTO OR ROY WINART",
    desc: "Cashback JULIATI SOENASTO OR ROY WI",
    interest: 424660.0,
    tax_rate: "10%",
    tax_nominal: 42466.0,
  },
  // MARET
  {
    date: "22-Mar-2025",
    bilyet: "AA001290",
    name: "ASTO OR ROY WINART",
    desc: "Pajak Bunga Simpanan Berjangka",
    interest: 6904100.0,
    tax_rate: "10%",
    tax_nominal: 690410.0,
  },
  {
    date: "22-Mar-2025",
    bilyet: "AA001290",
    name: "ASTO OR ROY WINART",
    desc: "Cashback JULIATI SOENASTO OR ROY WI",
    interest: 383560.0,
    tax_rate: "10%",
    tax_nominal: 38356.0,
  },
  // APRIL
  {
    date: "22-Apr-2025",
    bilyet: "AA001290",
    name: "ASTO OR ROY WINART",
    desc: "Pajak Bunga Simpanan Berjangka",
    interest: 7643830.0,
    tax_rate: "10%",
    tax_nominal: 764383.0,
  },
  {
    date: "22-Apr-2025",
    bilyet: "AA001290",
    name: "ASTO OR ROY WINART",
    desc: "Cashback JULIATI SOENASTO OR ROY WI",
    interest: 424660.0,
    tax_rate: "10%",
    tax_nominal: 42466.0,
  },
  // MEI
  {
    date: "22-May-2025",
    bilyet: "AA001290",
    name: "ASTO OR ROY WINART",
    desc: "Pajak Bunga Simpanan Berjangka",
    interest: 7397260.0,
    tax_rate: "10%",
    tax_nominal: 739726.0,
  },
  {
    date: "22-May-2025",
    bilyet: "AA001290",
    name: "ASTO OR ROY WINART",
    desc: "Cashback JULIATI SOENASTO OR ROY WI",
    interest: 410960.0,
    tax_rate: "10%",
    tax_nominal: 41096.0,
  },
  // JUNI
  {
    date: "22-Jun-2025",
    bilyet: "AA001290",
    name: "ASTO OR ROY WINART",
    desc: "Pajak Bunga Simpanan Berjangka",
    interest: 7643830.0,
    tax_rate: "10%",
    tax_nominal: 764383.0,
  },
  {
    date: "22-Jun-2025",
    bilyet: "AA001290",
    name: "ASTO OR ROY WINART",
    desc: "Cashback JULIATI SOENASTO OR ROY WI",
    interest: 424660.0,
    tax_rate: "10%",
    tax_nominal: 42466.0,
  },
  // JULI
  {
    date: "22-Jul-2025",
    bilyet: "AA001290",
    name: "ASTO OR ROY WINART",
    desc: "Pajak Bunga Simpanan Berjangka",
    interest: 7397260.0,
    tax_rate: "10%",
    tax_nominal: 739726.0,
  },
  {
    date: "22-Jul-2025",
    bilyet: "AA001290",
    name: "ASTO OR ROY WINART",
    desc: "Cashback JULIATI SOENASTO OR ROY WI",
    interest: 410960.0,
    tax_rate: "10%",
    tax_nominal: 41096.0,
  },
  // AGUSTUS
  {
    date: "22-Aug-2025",
    bilyet: "AA001290",
    name: "ASTO OR ROY WINART",
    desc: "Pajak Bunga Simpanan Berjangka",
    interest: 7643830.0,
    tax_rate: "10%",
    tax_nominal: 764383.0,
  },
  {
    date: "22-Aug-2025",
    bilyet: "AA001290",
    name: "ASTO OR ROY WINART",
    desc: "Cashback JULIATI SOENASTO OR ROY WI",
    interest: 424660.0,
    tax_rate: "10%",
    tax_nominal: 42466.0,
  },
  // SEPTEMBER
  {
    date: "22-Sep-2025",
    bilyet: "AA001290",
    name: "ASTO OR ROY WINART",
    desc: "Pajak Bunga Simpanan Berjangka",
    interest: 7643830.0,
    tax_rate: "10%",
    tax_nominal: 764383.0,
  },
  {
    date: "22-Sep-2025",
    bilyet: "AA001290",
    name: "ASTO OR ROY WINART",
    desc: "Cashback JULIATI SOENASTO OR ROY WI",
    interest: 424660.0,
    tax_rate: "10%",
    tax_nominal: 42466.0,
  },
  // OKTOBER
  {
    date: "22-Oct-2025",
    bilyet: "AA001290",
    name: "ASTO OR ROY WINART",
    desc: "Pajak Bunga Simpanan Berjangka",
    interest: 7397260.0,
    tax_rate: "10%",
    tax_nominal: 739726.0,
  },
  {
    date: "22-Oct-2025",
    bilyet: "AA001290",
    name: "ASTO OR ROY WINART",
    desc: "Cashback JULIATI SOENASTO OR ROY WI",
    interest: 410960.0,
    tax_rate: "10%",
    tax_nominal: 41096.0,
  },
  // NOVEMBER
  {
    date: "22-Nov-2025",
    bilyet: "AA001290",
    name: "ASTO OR ROY WINART",
    desc: "Pajak Bunga Simpanan Berjangka",
    interest: 7643830.0,
    tax_rate: "10%",
    tax_nominal: 764383.0,
  },
  {
    date: "22-Nov-2025",
    bilyet: "AA001290",
    name: "ASTO OR ROY WINART",
    desc: "Cashback JULIATI SOENASTO OR ROY WI",
    interest: 424660.0,
    tax_rate: "10%",
    tax_nominal: 42466.0,
  },
  // DESEMBER
  {
    date: "22-Dec-2025",
    bilyet: "AA001290",
    name: "ASTO OR ROY WINART",
    desc: "Pajak Bunga Simpanan Berjangka",
    interest: 7397260.0,
    tax_rate: "10%",
    tax_nominal: 739726.0,
  },
  {
    date: "22-Dec-2025",
    bilyet: "AA001290",
    name: "ASTO OR ROY WINART",
    desc: "Cashback JULIATI SOENASTO OR ROY WI",
    interest: 410960.0,
    tax_rate: "10%",
    tax_nominal: 41096.0,
  },
];

// DATA SUMMARY HARDCODED
const SUMMARY = {
  nominal_simka: 1000000000,
  total_bunga: 94977930.0,
  total_pajak: 9497793.0,
};

// --- UTILITY FORMAT RUPIAH ---
const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace("Rp", "Rp ");
};

export default function TaxSlipPage() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white p-0 font-sans text-gray-800">
      {/* Floating Action Button (Print) */}
      <div className="fixed top-18 right-6 z-50 print:hidden">
        <Button
          onClick={handlePrint}
          className="bg-red-600 hover:bg-red-700 text-white shadow-xl flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          Cetak Dokumen
        </Button>
      </div>

      {/* --- DOKUMEN UTAMA --- */}
      <div className="w-full bg-white shadow-none rounded-none overflow-hidden">
        {/* HEADER */}
        <div className="p-8 border-b-4 border-red-600 bg-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-red-50 rounded-lg flex items-center justify-center border border-red-100">
                <Building2 className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                  KSP TUNAS MULIA UNGGUL
                </h1>
                <p className="text-sm text-red-600 font-semibold tracking-wider uppercase mt-1">
                  Bukti Potong Pajak
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 bg-red-50 px-4 py-2 rounded-full border border-red-100">
                <FileText className="w-4 h-4 text-red-600" />
                <span className="text-sm font-bold text-red-800">
                  PERIODE: JANUARI - DESEMBER 2025
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg border border-gray-100 print:bg-transparent print:border-gray-300">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                Judul Laporan
              </p>
              <h2 className="text-lg font-bold text-gray-800 leading-snug">
                REKAP BUKTI POTONG PAJAK <br /> SIMPANAN BERJANGKA
              </h2>
            </div>
            <div className="flex flex-col md:items-end justify-center">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                Nominal SIMKA
              </p>
              <div className="text-2xl font-mono font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-400" />
                {formatRupiah(SUMMARY.nominal_simka)}
              </div>
            </div>
          </div>
        </div>

        {/* TABLE CONTENT */}
        <div className="p-8">
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-red-600 text-white uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3 border-r border-red-500 w-32">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 border-r border-red-500 w-32">
                    No. Bilyet
                  </th>
                  <th className="px-4 py-3 border-r border-red-500">
                    Nama Anggota
                  </th>
                  <th className="px-4 py-3 border-r border-red-500 w-1/4">
                    Keterangan
                  </th>
                  <th className="px-4 py-3 border-r border-red-500 text-right">
                    Nominal Bunga
                  </th>
                  <th className="px-4 py-3 border-r border-red-500 text-center w-16">
                    Pajak
                  </th>
                  <th className="px-4 py-3 text-right">Nominal Pajak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {TAX_DATA.map((row, index) => (
                  <tr
                    key={index}
                    className={`hover:bg-red-50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50 print:bg-white"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium whitespace-nowrap border-r border-gray-100">
                      {row.date}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600 border-r border-gray-100">
                      {row.bilyet}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-800 border-r border-gray-100">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 border-r border-gray-100">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          row.desc.includes("Cashback")
                            ? "bg-amber-100 text-amber-800 border border-amber-200 print:bg-transparent print:text-black print:border-none"
                            : "bg-blue-100 text-blue-800 border border-blue-200 print:bg-transparent print:text-black print:border-none"
                        }`}
                      >
                        {row.desc}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono border-r border-gray-100">
                      {formatRupiah(row.interest)}
                    </td>
                    <td className="px-4 py-3 text-center border-r border-gray-100">
                      {row.tax_rate}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-gray-900">
                      {formatRupiah(row.tax_nominal)}
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* FOOTER TOTAL */}
              <tfoot className="bg-gray-100 border-t-2 border-red-600 font-bold text-gray-900 print:bg-gray-200">
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-4 text-right uppercase text-xs tracking-wider text-gray-600"
                  >
                    Total Pembayaran Bunga Simka & Pajak Simka
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-red-700 text-base">
                    {formatRupiah(SUMMARY.total_bunga)}
                  </td>
                  <td className="px-4 py-4 text-center text-gray-400">-</td>
                  <td className="px-4 py-4 text-right font-mono text-red-700 text-base bg-red-50 print:bg-transparent">
                    {formatRupiah(SUMMARY.total_pajak)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* FOOTER / SIGNATURE AREA */}
        <div className="p-8 pt-0 mt-4">
          <div className="flex flex-col md:flex-row justify-between items-end gap-10">
            <div className="text-xs text-gray-500 italic max-w-md">
              * Dokumen ini diterbitkan secara otomatis oleh sistem dan sah
              tanpa tanda tangan basah.
              <br />* Nilai Pajak dihitung berdasarkan tarif PPh Final 10% atas
              bunga simpanan.
            </div>

            <div className="flex flex-col items-center gap-16 print:break-inside-avoid">
              <div className="text-center">
                <p className="text-sm font-bold text-gray-900">
                  Surakarta,{" "}
                  {new Date().toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="text-xs text-gray-500 uppercase mt-1">
                  Bagian Keuangan
                </p>
              </div>
              <div className="border-t border-gray-400 w-48 text-center pt-2">
                <p className="text-sm font-bold text-gray-900 uppercase">
                  ( __________________ )
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 10mm;
          }
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:w-full {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}