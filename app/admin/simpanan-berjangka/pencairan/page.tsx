"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useGetSimpananBerjangkaListQuery,
  useCairNormalSimpananBerjangkaMutation,
  useCairAwalSimpananBerjangkaMutation,
} from "@/services/admin/simpanan/simpanan-berjangka.service";
import type { SimpananBerjangka } from "@/types/admin/simpanan/simpanan-berjangka";
import { Droplets, Search, Calendar, Wallet } from "lucide-react";
import Swal from "sweetalert2";

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

const displayDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("id-ID") : "-";

export default function PencairanSimpananBerjangkaPage() {
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const listParams = useMemo(
    () => ({
      page: currentPage,
      paginate: itemsPerPage,
      status: 1 as const,
      status_bilyet: "aktif" as const,
      ...(query.trim() && { search: query.trim() }),
    }),
    [currentPage, itemsPerPage, query]
  );

  const { data, isLoading, refetch } = useGetSimpananBerjangkaListQuery(
    listParams
  );

  const list = useMemo(() => data?.data ?? [], [data]);
  const lastPage = useMemo(() => data?.last_page ?? 1, [data]);

  const [cairNormal, { isLoading: isCairNormal }] =
    useCairNormalSimpananBerjangkaMutation();
  const [cairAwal, { isLoading: isCairAwal }] =
    useCairAwalSimpananBerjangkaMutation();

  const handleCairNormal = async (item: SimpananBerjangka) => {
    const confirm = await Swal.fire({
      title: "Pencairan Normal",
      html: `
        <p class="text-left text-sm text-gray-600 mb-2">Proses pencairan simpanan berjangka pada jatuh tempo.</p>
        <div class="text-left space-y-1 text-sm">
          <p><strong>No. Bilyet:</strong> ${item.no_bilyet}</p>
          <p><strong>Anggota:</strong> ${item.user_name ?? "-"}</p>
          <p><strong>Nominal:</strong> ${formatRupiah(item.nominal)}</p>
          <p><strong>Jatuh tempo:</strong> ${displayDate(item.maturity_date)}</p>
        </div>
        <p class="text-left text-sm mt-3">Lanjutkan pencairan?</p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Cairkan",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    try {
      const result = await cairNormal(item.id).unwrap();
      await refetch();

      Swal.fire({
        title: "Pencairan Berhasil",
        html: `
          <div class="text-left space-y-2 text-sm">
            <p><strong>${result.message}</strong></p>
            <p>No. Bilyet: ${result.no_bilyet}</p>
            <p>Nominal pokok: ${formatRupiah(result.nominal_bayar)}</p>
            <p>Bunga dibayar: ${formatRupiah(result.bunga_bayar)}</p>
            <p class="text-base font-semibold pt-2 border-t">Total diterima: ${formatRupiah(result.total)}</p>
            <p class="text-muted-foreground">Status: ${result.status_bilyet}</p>
          </div>
        `,
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Gagal",
        text: "Pencairan normal gagal. Periksa jatuh tempo atau kondisi bilyet.",
        icon: "error",
      });
    }
  };

  const handleCairAwal = async (item: SimpananBerjangka) => {
    const confirm = await Swal.fire({
      title: "Pencairan Awal (Sebelum Jatuh Tempo)",
      html: `
        <p class="text-left text-sm text-amber-800 bg-amber-50 p-2 rounded mb-2">
          Pencairan awal dikenakan penalti. Bunga dapat dikurangi sesuai ketentuan produk.
        </p>
        <div class="text-left space-y-1 text-sm">
          <p><strong>No. Bilyet:</strong> ${item.no_bilyet}</p>
          <p><strong>Anggota:</strong> ${item.user_name ?? "-"}</p>
          <p><strong>Nominal:</strong> ${formatRupiah(item.nominal)}</p>
          <p><strong>Jatuh tempo:</strong> ${displayDate(item.maturity_date)}</p>
        </div>
        <p class="text-left text-sm mt-3">Lanjutkan pencairan awal?</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Cairkan Awal",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    try {
      const result = await cairAwal(item.id).unwrap();
      await refetch();

      Swal.fire({
        title: "Pencairan Awal Berhasil",
        html: `
          <div class="text-left space-y-2 text-sm">
            <p><strong>${result.message}</strong></p>
            <p>No. Bilyet: ${result.no_bilyet}</p>
            <p>Nominal pokok: ${formatRupiah(result.nominal_bayar)}</p>
            <p>Bunga bruto: ${formatRupiah(result.bunga_bruto)}</p>
            <p>Bunga hangus (penalti): ${formatRupiah(result.bunga_hangus)}</p>
            <p>Bunga diberikan: ${formatRupiah(result.bunga_diberikan)}</p>
            <p>Penalti: ${result.penalti_persen}%</p>
            <p class="text-base font-semibold pt-2 border-t">Total diterima: ${formatRupiah(result.total)}</p>
            <p class="text-muted-foreground">Status: ${result.status_bilyet}</p>
          </div>
        `,
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Gagal",
        text: "Pencairan awal gagal. Periksa syarat produk atau hubungi admin.",
        icon: "error",
      });
    }
  };

  const colSpan = 9;

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b bg-muted/30">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Pencairan Simpanan Berjangka</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Hanya menampilkan bilyet dengan status <strong>Aktif</strong> dan <strong>Disetujui</strong>.
              </p>
            </div>
          </div>

          <div className="p-4 border-b">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari referensi, anggota, no. bilyet..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Referensi</th>
                  <th className="px-4 py-3 font-medium">No. Bilyet</th>
                  <th className="px-4 py-3 font-medium">Anggota</th>
                  <th className="px-4 py-3 font-medium">Produk</th>
                  <th className="px-4 py-3 font-medium text-right">Nominal</th>
                  <th className="px-4 py-3 font-medium text-center">Jangka</th>
                  <th className="px-4 py-3 font-medium">Tgl. Mulai</th>
                  <th className="px-4 py-3 font-medium">Jatuh Tempo</th>
                  <th className="px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={colSpan} className="text-center p-10">
                      <span className="text-muted-foreground">Memuat data...</span>
                    </td>
                  </tr>
                ) : list.length === 0 ? (
                  <tr>
                    <td colSpan={colSpan} className="text-center p-10">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Wallet className="h-10 w-10 opacity-50" />
                        <p>Tidak ada simpanan berjangka aktif yang dapat dicairkan.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  list.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs">
                        {item.reference ?? "-"}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {item.no_bilyet ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        {item.user_name ?? item.user?.name ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        {item.category_name ??
                          item.masterBilyet?.nama_produk ??
                          item.kode_bilyet_master ??
                          "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatRupiah(item.nominal)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.term_months ?? "-"} bln
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {displayDate(item.date)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {displayDate(item.maturity_date)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleCairNormal(item)}
                            disabled={isCairNormal || isCairAwal}
                          >
                            Cair Normal
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-300 text-amber-800 hover:bg-amber-50"
                            onClick={() => handleCairAwal(item)}
                            disabled={isCairNormal || isCairAwal}
                          >
                            Cair Awal
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {list.length > 0 && (
            <div className="p-4 flex items-center justify-between border-t bg-muted/30">
              <div className="text-sm text-muted-foreground">
                Halaman <strong>{currentPage}</strong> dari{" "}
                <strong>{lastPage}</strong>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= lastPage}
                  onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
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
