"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Printer, Building2, Search, User, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetAnggotaListQuery } from "@/services/koperasi-service/anggota.service";
import type { AnggotaKoperasi } from "@/types/koperasi-types/anggota";

// --- PENCARIAN ANGGOTA ---
const SEARCH_MIN_CHARS = 3;
const SEARCH_DEBOUNCE_MS = 400;

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
  // --- STATE PENCARIAN ANGGOTA ---
  const [memberSearchInput, setMemberSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<AnggotaKoperasi | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(memberSearchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [memberSearchInput]);

  const shouldFetch = debouncedSearch.length >= SEARCH_MIN_CHARS;
  const { data: anggotaData, isLoading: anggotaLoading, isFetching: anggotaFetching } = useGetAnggotaListQuery(
    { page: 1, paginate: 20, status: 1, search: debouncedSearch },
    { skip: !shouldFetch }
  );

  const anggotaList = useMemo(() => anggotaData?.data ?? [], [anggotaData]);
  const showRecommendations = showDropdown && memberSearchInput.length >= SEARCH_MIN_CHARS;
  const isSearching = anggotaLoading || anggotaFetching;

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectMember = (member: AnggotaKoperasi) => {
    setSelectedMember(member);
    setMemberSearchInput("");
    setShowDropdown(false);
  };

  const handleClearMember = () => {
    setSelectedMember(null);
    setMemberSearchInput("");
  };

  // --- STATE UNTUK EDITABLE FIELDS ---
  const [reportInfo, setReportInfo] = useState({
    recipientName: "Bpk/Ibu HERMANSJAH WIDJAJA",
    recipientAddress: "Ditempat",
    subject: "Laporan Outstanding Dana Simpanan KSP TMU",
    cutoffDate: "4 January 2026",
    cityDate: "Jakarta, 5 January 2026",
  });

  // Sync recipient when member selected
  useEffect(() => {
    if (selectedMember) {
      const name = selectedMember.user_name ?? selectedMember.name ?? "Anggota";
      setReportInfo((prev) => ({
        ...prev,
        recipientName: `Bpk/Ibu ${name}`,
      }));
    }
  }, [selectedMember]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setReportInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans flex flex-col items-center gap-6">
      {/* === CARD PENCARIAN ANGGOTA (hanya di layar, tidak di-print) === */}
      <div className="w-full max-w-[1100px] print:hidden">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-visible">
          <div className="px-5 py-4 border-b border-gray-100 rounded-t-xl">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5 text-red-600" />
              Pilih Anggota untuk Laporan
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Cari berdasarkan nomor anggota atau nama, lalu pilih dari daftar rekomendasi.
            </p>
          </div>
          <div className="p-5">
            {selectedMember ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 border border-red-100 text-gray-800">
                  <User className="w-4 h-4 text-red-600" />
                  <span className="font-medium">
                    {selectedMember.reference} — {selectedMember.user_name ?? selectedMember.name ?? "-"}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearMember}
                  className="text-gray-600 hover:text-red-600"
                >
                  <X className="w-4 h-4 mr-1" />
                  Ganti anggota
                </Button>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={memberSearchInput}
                    onChange={(e) => {
                      setMemberSearchInput(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => memberSearchInput.length >= SEARCH_MIN_CHARS && setShowDropdown(true)}
                    placeholder="Ketik nomor anggota atau nama (min. 3 karakter)..."
                    className="w-full h-12 pl-10 pr-4 rounded-lg border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  />
                  {isSearching && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                    </span>
                  )}
                </div>
                {memberSearchInput.length > 0 && memberSearchInput.length < SEARCH_MIN_CHARS && (
                  <p className="mt-2 text-xs text-amber-600">
                    Ketik minimal {SEARCH_MIN_CHARS} karakter untuk melihat rekomendasi.
                  </p>
                )}
                {showRecommendations && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] max-h-64 overflow-y-auto">
                    {anggotaList.length === 0 && !isSearching ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-500">
                        Tidak ada anggota ditemukan.
                      </div>
                    ) : (
                      <ul className="py-1">
                        {anggotaList.map((member) => (
                          <li key={member.id}>
                            <button
                              type="button"
                              onClick={() => handleSelectMember(member)}
                              className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                            >
                              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                <User className="w-4 h-4 text-red-600" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <span className="block font-medium text-gray-900 truncate">
                                  {member.user_name ?? member.name ?? "-"}
                                </span>
                                <span className="block text-xs text-gray-500 font-mono">
                                  No. Anggota: {member.reference}
                                </span>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tombol Print Mengambang (Hanya Layar) - tampil hanya jika sudah pilih anggota */}
      {selectedMember && (
        <div className="fixed top-18 right-4 z-50 print:hidden">
          <Button
            onClick={handlePrint}
            className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
          >
            <Printer className="w-4 h-4 mr-2" />
            Cetak
          </Button>
        </div>
      )}

      {/* Main Report Container - hanya tampil setelah anggota dipilih */}
      {selectedMember && (
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
                  MERAH PUTIH
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
                Terima kasih atas kepercayaan Bpk/Ibu sebagai anggota KSP Merah Putih.
                <span className="block font-bold text-red-600 mt-1">
                  Salam Sehat & Sukses Selalu.
                </span>
              </p>
              <div className="mt-4">
                <p className="font-bold text-gray-900 uppercase">
                  KSP MERAH PUTIH
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
      )}

      {/* Placeholder saat belum pilih anggota */}
      {!selectedMember && (
        <div className="w-full max-w-[1100px] rounded-xl border-2 border-dashed border-gray-200 bg-white/60 py-16 px-6 text-center print:hidden">
          <User className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Pilih anggota terlebih dahulu</p>
          <p className="text-sm text-gray-400 mt-1">Gunakan pencarian di atas untuk memilih anggota dan menampilkan laporan.</p>
        </div>
      )}

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