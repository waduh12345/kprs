"use client";

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetAnggotaListQuery } from "@/services/koperasi-service/anggota.service";
import type { AnggotaKoperasi } from "@/types/koperasi-types/anggota";
import { Badge } from "@/components/ui/badge";
import { ProdukToolbar } from "@/components/ui/produk-toolbar";
import { useRouter } from "next/navigation";
import ActionsGroup from "@/components/admin-components/actions-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HistoryIcon, LandmarkIcon, FileDown } from "lucide-react";

export default function LaporanAnggotaAktifPage() {
  const router = useRouter();

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");
  // Filter default untuk Laporan Anggota Aktif adalah APPROVED (status: '1')
  const [status, setStatus] = useState<"all" | "0" | "1" | "2">("1"); 
  
  // State untuk export (jika nanti akan diimplementasikan)
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading } = useGetAnggotaListQuery(
    {
      page: currentPage,
      paginate: itemsPerPage,
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const list = useMemo(() => data?.data ?? [], [data]);

  const filteredList = useMemo(() => {
    let arr = list;
    
    // Filter berdasarkan Status
    if (status !== "all")
      arr = arr.filter((it) => it.status === Number(status));
      
    // Filter berdasarkan Query Pencarian
    if (!query.trim()) return arr;
    const q = query.toLowerCase();
    return arr.filter((it) =>
      [it.name, it.email, it.phone, it.address, it.nik, it.npwp ?? ""].some(
        (f) => f?.toLowerCase?.().includes?.(q)
      )
    );
  }, [list, query, status]);

  const lastPage = useMemo(() => data?.last_page ?? 1, [data]);

  // Handler Export Sederhana (tempat placeholder untuk integrasi API di masa depan)
  const handleExportExcel = () => {
    setIsExporting(true);
    // TODO: Implementasi logika pemanggilan API Export Laporan
    console.log("Mengekspor Laporan Anggota Aktif...");
    
    // Simulasi jeda
    setTimeout(() => {
        setIsExporting(false);
        alert("Permintaan export laporan anggota aktif telah diproses.");
    }, 1500);
  };

  const statusBadge = (status: number) => {
    if (status === 1) return <Badge variant="success">APPROVED</Badge>;
    if (status === 2) return <Badge variant="destructive">REJECTED</Badge>;
    return <Badge variant="secondary">PENDING</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Laporan Data Anggota Aktif</h2>
      
      {/* ProdukToolbar disederhanakan: hanya search, status filter, dan export */}
      <ProdukToolbar
        onSearchChange={(q: string) => setQuery(q)}
        enableStatusFilter
        statusOptions={[
          { value: "all", label: "Semua Status" },
          { value: "0", label: "PENDING" },
          { value: "1", label: "APPROVED" },
          { value: "2", label: "REJECTED" },
        ]}
        initialStatus={status}
        // Izinkan user mengubah filter status, meskipun default-nya '1'
        onStatusChange={(s: string) => setStatus(s as "all" | "0" | "1" | "2")} 
        
        // Hapus tombol Add/Import/Template
        showTemplateCsvButton={false}

        // Tambahkan tombol Export
        onExportExcel={handleExportExcel}
        exportLabel={isExporting ? "Memproses..." : "Export Laporan"}
      />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-2">Aksi</th>
                <th className="px-4 py-2">Nomor Anggota</th>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Telepon</th>
                <th className="px-4 py-2">Gender</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center p-4">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-4">
                    Tidak ada data anggota yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-2">
                      <ActionsGroup
                        // Ubah handleDetail ke mode detail
                        handleDetail={() =>
                          router.push(
                            `/admin/anggota/add-data?mode=detail&id=${item.id}`
                          )
                        }
                        
                        additionalActions={
                          <div className="flex items-center gap-2">
                            {/* History Anggota */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    router.push(
                                      `/admin/anggota/history?anggota_id=${item.id}` // Arahkan ke rute yang lebih spesifik
                                    )
                                  }
                                >
                                  <HistoryIcon className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>History Anggota</p>
                              </TooltipContent>
                            </Tooltip>

                            {/* User Bank */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    router.push(
                                      `/admin/anggota/user-bank?user_id=${
                                        item.user_id ?? item.id
                                      }`
                                    )
                                  }
                                >
                                  <LandmarkIcon className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Data Rekening Bank</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        }
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {item.reference}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{item.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {item.email}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {item.phone}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {item.gender}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {statusBadge(item.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>

        {/* Pagination */}
        <div className="p-4 flex items-center justify-between bg-muted">
          <div className="text-sm">
            Halaman <strong>{currentPage}</strong> dari{" "}
            <strong>{lastPage}</strong>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              disabled={currentPage >= lastPage}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}