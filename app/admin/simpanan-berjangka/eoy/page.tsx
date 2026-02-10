"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetEoyListQuery } from "@/services/admin/simpanan/simpanan-berjangka-eom-eoy.service";
import type { SimpananBerjangkaEoy } from "@/types/admin/simpanan/simpanan-berjangka-eom-eoy";
import { CalendarCheck, Search, Loader2, FileDown, ChevronLeft, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

export default function EoyBungaTahunanPage() {
  const [page, setPage] = useState(1);
  const [paginate] = useState(15);
  const [search, setSearch] = useState("");
  const [tahun, setTahun] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const params = useMemo(
    () => ({
      page,
      paginate,
      ...(search.trim() && { search: search.trim() }),
      ...(tahun && { tahun: Number(tahun) }),
    }),
    [page, paginate, search, tahun]
  );

  const { data, isFetching } = useGetEoyListQuery(params);
  const list = data?.data ?? [];
  const total = data?.total ?? 0;
  const lastPage = data?.last_page ?? 1;
  const currentPage = data?.current_page ?? 1;

  const handleExportExcel = () => {
    if (list.length === 0) {
      void Swal.fire("Info", "Tidak ada data untuk diexport.", "info");
      return;
    }
    const rows = list.map((row: SimpananBerjangkaEoy) => ({
      Tahun: row.tahun,
      "No. Bilyet": row.simpanan_berjangka?.no_bilyet ?? "-",
      "Nama Anggota": row.simpanan_berjangka?.user?.name ?? "-",
      Produk: row.simpanan_berjangka?.masterBilyet?.nama_produk ?? "-",
      "Total Bunga Tahunan": row.total_bunga_tahunan,
    }));
    setIsExporting(true);
    try {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bunga Tahunan");
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `laporan-bunga-tahunan-eoy-${dateStr}.xlsx`);
      void Swal.fire("Berhasil", `Berhasil export ${rows.length} data ke Excel.`, "success");
    } catch (e) {
      console.error(e);
      void Swal.fire("Gagal", "Export gagal diproses.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const applyFilters = () => setPage(1);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Laporan Bunga Tahunan (EOY)</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportExcel}
          disabled={list.length === 0 || isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          <span className="ml-2">Export Excel</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Laporan Bunga Tahunan</CardTitle>
          <p className="text-sm text-muted-foreground">
            Data hasil proses perhitungan schedular yang sudah tersimpan di database.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
              <Label>Pencarian (No. Bilyet / Nama)</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cari no. bilyet atau nama..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label>Tahun</Label>
              <Input
                type="number"
                placeholder="Contoh: 2025"
                min={2000}
                max={2100}
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={applyFilters}>Filter</Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            {isFetching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : list.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                Tidak ada data laporan bunga tahunan.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium w-12">No</th>
                    <th className="px-4 py-3 font-medium">Tahun</th>
                    <th className="px-4 py-3 font-medium">No. Bilyet</th>
                    <th className="px-4 py-3 font-medium">Nama / Produk</th>
                    <th className="px-4 py-3 font-medium text-right">Total Bunga Tahunan</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((row, idx) => (
                    <tr key={row.id} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">
                        {(currentPage - 1) * paginate + idx + 1}
                      </td>
                      <td className="px-4 py-3">{row.tahun}</td>
                      <td className="px-4 py-3 font-mono">
                        {row.simpanan_berjangka?.no_bilyet ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div>{row.simpanan_berjangka?.user?.name ?? "-"}</div>
                        {row.simpanan_berjangka?.masterBilyet?.nama_produk && (
                          <div className="text-xs text-muted-foreground">
                            {row.simpanan_berjangka.masterBilyet.nama_produk}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium">
                        {formatRupiah(row.total_bunga_tahunan)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {lastPage > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Menampilkan {(currentPage - 1) * paginate + 1}–{Math.min(currentPage * paginate, total)} dari {total} data
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || isFetching}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Halaman {currentPage} / {lastPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  disabled={currentPage >= lastPage || isFetching}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
