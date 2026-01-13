"use client";

import { useMemo, useState } from "react";
import { useGetAnggotaListQuery } from "@/services/koperasi-service/anggota.service";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Printer } from "lucide-react";
import Image from "next/image";

// Helper format tanggal
const formatDate = (dateString?: string | null) => {
  if (!dateString) return "-";
  const date = new window.Date(dateString);
  if (isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .replace(/ /g, "-");
};

export default function BirthdayPage() {
  const itemsPerPage = 20;
  const [currentPage, setCurrentPage] = useState(1);

  // Default: "all" agar semua data langsung tampil saat pertama load
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  // Default Tahun: Tahun saat ini
  const [selectedYear, setSelectedYear] = useState<string>(
    String(new Date().getFullYear())
  );

  const { data, isLoading, isFetching } = useGetAnggotaListQuery(
    {
      page: currentPage,
      paginate: itemsPerPage,
    },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  const list = useMemo(() => data?.data ?? [], [data]);
  const lastPage = useMemo(() => data?.last_page ?? 1, [data]);

  // --- LOGIC FILTER DIPERBAIKI ---
  const filteredList = useMemo(() => {
    // 1. Jika filter "all", kembalikan semua data di page ini
    if (selectedMonth === "all") {
      return list;
    }

    // 2. Jika filter bulan spesifik dipilih
    return list.filter((item) => {
      if (!item.individu_birth_date) return false;
      const dob = new Date(item.individu_birth_date);
      // getMonth() mulai dari 0 (Jan) s/d 11 (Des), jadi perlu +1
      return dob.getMonth() + 1 === Number(selectedMonth);
    });
  }, [list, selectedMonth]);

  // Hitung Total Data berdasarkan yang TAMPIL (filtered)
  const totalDisplayedData = filteredList.length;

  // Nama bulan untuk Header Laporan
  const monthName =
    selectedMonth === "all"
      ? "SEMUA BULAN"
      : new Date(2000, Number(selectedMonth) - 1, 1).toLocaleString("id-ID", {
          month: "long",
        });

  return (
    <div className="min-h-screen bg-white text-black p-8 font-sans">
      {/* --- HEADER SECTION --- */}
      <div className="mb-6 border-b-2 border-black pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 border-2 border-blue-600 flex items-center justify-center rounded-lg text-blue-600 overflow-hidden relative">
              {/* Pastikan path image benar */}
              <Image
                src="/logo-koperasi-merah-putih-online.webp"
                alt="Logo"
                fill
                className="object-contain p-1"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-600 uppercase tracking-wide">
                Koperasi Merah Putih
              </h1>
              <p className="text-sm font-semibold text-gray-600">
                Koperasi Simpan Pinjam
              </p>
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-sm font-bold uppercase tracking-wider">
              DAFTAR ULANG TAHUN ANGGOTA <br />
              BULAN: {monthName} {selectedYear}
            </h2>
          </div>
        </div>
      </div>

      {/* --- TOOLBAR --- */}
      <div className="flex justify-between items-center mb-4 print:hidden">
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">Filter:</span>

          {/* SELECT BULAN */}
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pilih Bulan" />
            </SelectTrigger>
            <SelectContent>
              {/* Opsi Semua Bulan */}
              <SelectItem value="all">Semua Bulan</SelectItem>
              {/* Loop 12 Bulan */}
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i} value={String(i + 1)}>
                  {new Date(0, i).toLocaleString("id-ID", { month: "long" })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" /> Print Laporan
        </Button>
      </div>

      {/* --- TABLE SECTION --- */}
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse border border-black text-xs md:text-sm">
          <thead>
            <tr className="bg-black text-white">
              <th className="border border-black px-2 py-3 w-12 text-center">
                NO.
              </th>
              <th className="border border-black px-4 py-3 text-left">
                NOMOR ANGGOTA
              </th>
              <th className="border border-black px-4 py-3 text-left">
                NAMA ANGGOTA
              </th>
              <th className="border border-black px-4 py-3 text-left">
                TANGGAL LAHIR
              </th>
              <th className="border border-black px-4 py-3 text-center">
                AO SIMPANAN
              </th>
              <th className="border border-black px-4 py-3 text-center">
                AO SIMPANAN BERJANGKA
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading || isFetching ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-8 border border-black"
                >
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="animate-spin h-5 w-5" /> Memuat Data...
                  </div>
                </td>
              </tr>
            ) : filteredList.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-8 border border-black italic text-gray-500"
                >
                  Tidak ada anggota yang berulang tahun di bulan {monthName}{" "}
                  (pada halaman ini).
                </td>
              </tr>
            ) : (
              filteredList.map((item, index) => (
                <tr key={item.id} className="even:bg-gray-50 hover:bg-gray-100">
                  <td className="border border-black px-2 py-2 text-center">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="border border-black px-4 py-2 font-medium">
                    {item.reference || item.id}
                  </td>
                  <td className="border border-black px-4 py-2 uppercase">
                    {item.individu_name ?? item.user_name ?? "-"}
                  </td>
                  <td className="border border-black px-4 py-2">
                    {formatDate(item.individu_birth_date)}
                  </td>
                  <td className="border border-black px-4 py-2 text-center">
                    -
                  </td>
                  <td className="border border-black px-4 py-2 text-center">
                    -
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- FOOTER / PAGINATION --- */}
      <div className="mt-6 flex items-center justify-between print:hidden">
        <div className="text-sm text-gray-500">
          {/* LOGIC TOTAL DATA DIPERBAIKI DISINI */}
          Total Data Tampil: <strong>{totalDisplayedData}</strong> | Halaman{" "}
          <strong>{currentPage}</strong> dari <strong>{lastPage}</strong>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1 || isLoading}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= lastPage || isLoading}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}