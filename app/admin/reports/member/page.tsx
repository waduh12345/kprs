"use client";

import React, { useState } from "react";
import { Printer, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// --- TYPES & DATA ---

// Data Summary (Tabel Atas)
const SUMMARY_DATA = [
  {
    id: 1,
    name: "HERMANSJAH WIDJAJA",
    account: "0103003567",
    balance: 11324204.04,
  },
  {
    id: 2,
    name: "HERMANSJAH WIDJAJA",
    account: "0103004232",
    balance: 14108488.26,
  },
];

// Data Detail (Tabel Bawah)
const DETAIL_DATA = [
  {
    id: 1,
    marketing_code: "MCH-HW",
    bilyet: "AA002340",
    jatuh_tempo: "14-Jan-2026",
    jangka: 6,
    rate: 8.5,
    cb: "",
    nasabah: "LISA WAHAP",
    nominal: 250000000.0,
    aro: 0.0,
    notes: "",
  },
  {
    id: 2,
    marketing_code: "MCH-HW",
    bilyet: "AA002341",
    jatuh_tempo: "14-Jan-2026",
    jangka: 6,
    rate: 8.5,
    cb: "",
    nasabah: "LISA WAHAP",
    nominal: 250000000.0,
    aro: 0.0,
    notes: "",
  },
  {
    id: 3,
    marketing_code: "MCH-HW",
    bilyet: "AA002046",
    jatuh_tempo: "15-Jan-2026",
    jangka: 6,
    rate: 9.0,
    cb: "",
    nasabah: "HARSONO ERDUARTE HERMAWAN",
    nominal: 104016712.69,
    aro: 108264014.69,
    notes: "",
  },
  {
    id: 4,
    marketing_code: "MCH-HW",
    bilyet: "AA002344",
    jatuh_tempo: "17-Jan-2026",
    jangka: 6,
    rate: 8.5,
    cb: "0",
    nasabah: "WONG, YANY",
    nominal: 100000000.0,
    aro: 103856438.5,
    notes: "",
  },
  {
    id: 5,
    marketing_code: "MCH-HW",
    bilyet: "AA002093",
    jatuh_tempo: "18-Feb-2026",
    jangka: 3,
    rate: 9.0,
    cb: "",
    nasabah: "HERMANSJAH WIDJAJA",
    nominal: 100000000.0,
    aro: 0.0,
    notes: "",
  },
];

// Calculate totals
const TOTAL_SALDO = 25432692.3;
const TOTAL_SIMPANAN_BERJANGKA = 2000000000.0;

// Utility for currency formatting (IDR)
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export default function LaporanAnggotaPage() {
  // --- STATE UNTUK EDITABLE FIELDS ---
  const [reportInfo, setReportInfo] = useState({
    recipientName: "Bpk/Ibu HERMANSJAH WIDJAJA",
    recipientAddress: "Ditempat",
    subject: "Laporan Outstanding Dana Simpanan KSP TMU",
    cutoffDate: "4 January 2026",
    cityDate: "Jakarta, 5 January 2026",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setReportInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans flex justify-center items-start">
      {/* Tombol Print Mengambang (Hanya Layar) */}
      <div className="fixed top-18 right-4 z-50 print:hidden">
        <Button
          onClick={handlePrint}
          className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
        >
          <Printer className="w-4 h-4 mr-2" />
          Cetak
        </Button>
      </div>

      {/* Main Report Container */}
      <div className="bg-white shadow-lg w-full max-w-[1100px] print:shadow-none print:w-full print:max-w-none">
        {/* --- HEADER COMPACT --- */}
        <div className="p-5 border-b-2 border-red-600">
          <div className="flex justify-between items-start gap-4">
            {/* Logo & Company - KIRI */}
            <div className="flex items-center gap-3">
              <div className="p-2 border-2 border-red-600 rounded-lg">
                <Building2 className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-red-700 leading-none">
                  TUNAS MULIA UNGGUL
                </h1>
                <p className="text-xs text-red-500 font-bold tracking-widest uppercase mt-1">
                  Koperasi Simpan Pinjam
                </p>
              </div>
            </div>

            {/* Date & Kepada Yth - KANAN (Lebih Rapi) */}
            <div className="text-right text-sm space-y-1">
              <input
                type="text"
                name="cityDate"
                value={reportInfo.cityDate}
                onChange={handleInputChange}
                className="text-right font-medium text-gray-600 bg-transparent focus:outline-none w-48"
              />
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  Kepada Yth,
                </span>
                <input
                  type="text"
                  name="recipientName"
                  value={reportInfo.recipientName}
                  onChange={handleInputChange}
                  className="text-right font-bold text-gray-800 text-base bg-transparent focus:outline-none w-64"
                />
                <input
                  type="text"
                  name="recipientAddress"
                  value={reportInfo.recipientAddress}
                  onChange={handleInputChange}
                  className="text-right text-gray-500 text-sm bg-transparent focus:outline-none w-64"
                />
              </div>
            </div>
          </div>

          {/* Subject & Intro */}
          <div className="mt-4 pt-2 border-t border-gray-100 flex flex-col md:flex-row justify-between items-end md:items-center gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
              <span className="uppercase">Perihal:</span>
              <input
                type="text"
                name="subject"
                value={reportInfo.subject}
                onChange={handleInputChange}
                className="bg-transparent focus:outline-none font-bold underline decoration-red-300 w-80 md:w-96"
              />
            </div>

            <div className="text-xs text-gray-600 italic">
              Posisi Saldo per Tgl:{" "}
              <input
                type="text"
                name="cutoffDate"
                value={reportInfo.cutoffDate}
                onChange={handleInputChange}
                className="bg-transparent font-bold text-red-600 focus:outline-none w-28"
              />
            </div>
          </div>
        </div>

        {/* --- BODY CONTENT --- */}
        <div className="p-5 space-y-4">
          {/* Table 1: Summary Saldo */}
          <div className="border border-red-200 rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-red-600 text-white text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-2 py-1.5 text-center w-10 border-r border-red-500">
                    No
                  </th>
                  <th className="px-2 py-1.5 text-left border-r border-red-500">
                    Nama Anggota
                  </th>
                  <th className="px-2 py-1.5 text-center border-r border-red-500">
                    No. Rekening
                  </th>
                  <th className="px-2 py-1.5 text-right">Saldo Efektif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100 text-xs text-gray-800">
                {SUMMARY_DATA.map((item) => (
                  <tr key={item.id} className="hover:bg-red-50">
                    <td className="px-2 py-1.5 text-center">{item.id}</td>
                    <td className="px-2 py-1.5 font-medium border-l border-r border-red-50">
                      {item.name}
                    </td>
                    <td className="px-2 py-1.5 text-center border-r border-red-50 font-mono">
                      {item.account}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono font-bold">
                      {formatCurrency(item.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-red-50 font-bold text-red-900 border-t border-red-200 text-xs">
                <tr>
                  <td colSpan={3} className="px-2 py-1.5 text-right uppercase">
                    Total Simpanan
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono">
                    {formatCurrency(TOTAL_SALDO)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Table 2: Detailed Simpanan */}
          <div className="border border-red-200 rounded-sm overflow-hidden">
            <table className="w-full text-[10px] min-w-full leading-tight">
              <thead className="bg-red-700 text-white uppercase tracking-tight">
                <tr>
                  <th className="px-1 py-2 text-center border-r border-red-500 w-6">
                    No
                  </th>
                  <th className="px-1 py-2 text-center border-r border-red-500">
                    Marketing
                  </th>
                  <th className="px-1 py-2 text-center border-r border-red-500">
                    Bilyet
                  </th>
                  <th className="px-1 py-2 text-center border-r border-red-500">
                    Jatuh Tempo
                  </th>
                  <th className="px-1 py-2 text-center border-r border-red-500">
                    Jk.Wkt
                  </th>
                  <th className="px-1 py-2 text-center border-r border-red-500">
                    Rate%
                  </th>
                  <th className="px-1 py-2 text-center border-r border-red-500">
                    CB%
                  </th>
                  <th className="px-1 py-2 text-left border-r border-red-500 w-1/5">
                    Nasabah
                  </th>
                  <th className="px-1 py-2 text-right border-r border-red-500">
                    Nominal (Rp)
                  </th>
                  <th className="px-1 py-2 text-right border-r border-red-500">
                    ARO (Rp)
                  </th>
                  <th className="px-1 py-2 text-center">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100 text-gray-700">
                {DETAIL_DATA.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-red-50 transition-colors"
                  >
                    <td className="px-1 py-1 text-center border-r border-red-50">
                      {item.id}
                    </td>
                    <td className="px-1 py-1 text-center border-r border-red-50 font-mono">
                      {item.marketing_code}
                    </td>
                    <td className="px-1 py-1 text-center border-r border-red-50 font-mono">
                      {item.bilyet}
                    </td>
                    <td className="px-1 py-1 text-center border-r border-red-50 whitespace-nowrap">
                      {item.jatuh_tempo}
                    </td>
                    <td className="px-1 py-1 text-center border-r border-red-50">
                      {item.jangka}
                    </td>
                    <td className="px-1 py-1 text-center border-r border-red-50 font-bold text-red-700">
                      {item.rate.toFixed(2)}
                    </td>
                    <td className="px-1 py-1 text-center border-r border-red-50">
                      {item.cb}
                    </td>
                    <td className="px-1 py-1 text-left border-r border-red-50 uppercase font-medium">
                      {item.nasabah}
                    </td>
                    <td className="px-1 py-1 text-right border-r border-red-50 font-mono text-black">
                      {formatCurrency(item.nominal)}
                    </td>
                    <td className="px-1 py-1 text-right border-r border-red-50 font-mono text-gray-500">
                      {formatCurrency(item.aro)}
                    </td>
                    <td className="px-1 py-1 text-left">{item.notes}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-red-50 font-bold text-gray-900 border-t border-red-200 text-[10px]">
                <tr>
                  <td
                    colSpan={8}
                    className="px-2 py-1.5 text-right uppercase text-red-800"
                  >
                    Total Simpanan Berjangka
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono text-red-800">
                    {formatCurrency(TOTAL_SIMPANAN_BERJANGKA)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="text-[10px] text-gray-400 italic text-right mt-1">
            * Bunga yang tertera adalah nilai setelah dipotong PPh 10% sesuai
            regulasi yang berlaku.
          </div>
        </div>

        {/* --- FOOTER COMPACT --- */}
        <div className="p-5 pt-0">
          <div className="flex flex-row justify-between items-end">
            {/* Closing Text */}
            <div className="text-xs text-gray-700 leading-relaxed max-w-md">
              <p>
                Terima kasih atas kepercayaan Bpk/Ibu sebagai anggota KSP Tunas
                Mulia Unggul.
                <span className="block font-bold text-red-600 mt-1">
                  Salam Sehat & Sukses Selalu.
                </span>
              </p>
              <div className="mt-4">
                <p className="font-bold text-gray-900 uppercase">
                  KSP TUNAS MULIA UNGGUL
                </p>
              </div>
            </div>

            {/* Signature Compact */}
            <div className="flex border border-gray-400">
              <div className="border-r border-gray-400 w-32">
                <div className="bg-red-50 px-2 py-1 text-[10px] font-bold text-center border-b border-gray-400 uppercase text-red-800">
                  Mengetahui
                </div>
                <div className="h-16"></div>
              </div>
              <div className="w-32">
                <div className="bg-red-50 px-2 py-1 text-[10px] font-bold text-center border-b border-gray-400 uppercase text-red-800">
                  Dibuat
                </div>
                <div className="h-16"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styles for Print Optimization */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 5mm;
            size: landscape;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:w-full {
            width: 100% !important;
            max-width: none !important;
          }
          /* Hilangkan border input saat print */
          input {
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}