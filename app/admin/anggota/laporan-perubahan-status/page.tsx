"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetAnggotaListQuery } from "@/services/koperasi-service/anggota.service";
import type { AnggotaKoperasi } from "@/types/koperasi-types/anggota"; // Catatan: Kita mengasumsikan API ini masih digunakan
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

// Karena data riwayat status biasanya berbeda, kita membuat tipe data simulasi.
// Dalam implementasi nyata, Anda akan mengambil data dari endpoint /anggota/laporan-perubahan-status
interface StatusChangeReportItem extends AnggotaKoperasi {
    previous_status: number;
    changed_at: string;
}

// Data Dummy untuk mensimulasikan riwayat perubahan status
const dummyStatusHistory: StatusChangeReportItem[] = [
    {
        id: "1", reference: "A001", name: "Budi Santoso", email: "budi@mail.com", phone: "0812...", gender: "Laki-laki", status: 1, // Status Sekarang
        previous_status: 0, changed_at: "2024-10-01", user_id: "u1", address: "Jl. Mawar", nik: "123", npwp: "123",
    },
    {
        id: "2", reference: "A002", name: "Siti Rahayu", email: "siti@mail.com", phone: "0813...", gender: "Perempuan", status: 2,
        previous_status: 1, changed_at: "2024-10-15", user_id: "u2", address: "Jl. Anggrek", nik: "456", npwp: "456",
    },
    {
        id: "3", reference: "A003", name: "Joko Widodo", email: "joko@mail.com", phone: "0811...", gender: "Laki-laki", status: 1,
        previous_status: 0, changed_at: "2024-09-20", user_id: "u3", address: "Jl. Melati", nik: "789", npwp: "789",
    },
    // Tambahkan lebih banyak data dummy yang relevan
];


export default function LaporanPerubahanStatusPage() {
  const router = useRouter();

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");
  // Tidak ada filter status di sini, tetapi kita bisa menambahkan filter tanggal
  const [dateRange, setDateRange] = useState({ start: "", end: "" }); 
  
  const [isExporting, setIsExporting] = useState(false);

  // Catatan: Di implementasi nyata, Anda akan menggunakan endpoint API yang benar
  // Contoh: const { data, isLoading } = useGetStatusChangeHistoryQuery({ ... });
  const { isLoading: isLoadingData } = useGetAnggotaListQuery(
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

  // Menggunakan data dummy karena tidak ada endpoint khusus riwayat status
  const list: StatusChangeReportItem[] = dummyStatusHistory; 
  const lastPage = 1; // Sesuaikan dengan pagination dummy

  const filteredList = useMemo(() => {
    let arr = list;
    
    // Logika filter tanggal (placeholder, karena data asli tidak ada)
    // if (dateRange.start && dateRange.end) {
    //   arr = arr.filter(it => it.changed_at >= dateRange.start && it.changed_at <= dateRange.end);
    // }
      
    // Filter berdasarkan Query Pencarian
    if (!query.trim()) return arr;
    const q = query.toLowerCase();
    return arr.filter((it) =>
      [it.name, it.email, it.phone, it.reference].some(
        (f) => f?.toLowerCase?.().includes?.(q)
      )
    );
  }, [list, query, dateRange]);


  const handleExportExcel = () => {
    setIsExporting(true);
    // TODO: Implementasi logika pemanggilan API Export Laporan Perubahan Status
    console.log("Mengekspor Laporan Perubahan Status...");
    
    setTimeout(() => {
        setIsExporting(false);
        alert("Permintaan export laporan perubahan status telah diproses.");
    }, 1500);
  };

  const statusBadge = (status: number) => {
    if (status === 1) return <Badge variant="success">APPROVED</Badge>;
    if (status === 2) return <Badge variant="destructive">REJECTED</Badge>;
    return <Badge variant="secondary">PENDING</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Laporan Perubahan Status Anggota</h2>
      
      <ProdukToolbar
        onSearchChange={(q: string) => setQuery(q)}
        
        // Nonaktifkan filter status yang lama
        enableStatusFilter={false}
        
        // Hapus tombol Add/Import/Template
        showAddButton={false}
        showTemplateCsvButton={false}
        enableImport={false}

        // Tambahkan tombol Export
        onExportExcel={handleExportExcel}
        exportLabel={isExporting ? "Memproses..." : "Export Laporan"}
        exportIcon={<FileDown className="h-4 w-4 mr-2" />}
      />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-2">Aksi</th>
                <th className="px-4 py-2">Nomor Anggota</th>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">Tgl. Perubahan</th>
                <th className="px-4 py-2">Status Sebelumnya</th>
                <th className="px-4 py-2">Status Baru</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingData ? (
                <tr>
                  <td colSpan={6} className="text-center p-4">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-4">
                    Tidak ada data perubahan status yang sesuai dengan filter.
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
                        showEdit={false}
                        showDelete={false}
                        
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
                                      `/admin/anggota/history?anggota_id=${item.id}` 
                                    )
                                  }
                                >
                                  <HistoryIcon className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Riwayat Anggota</p>
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
                    <td className="px-4 py-2 whitespace-nowrap font-medium">
                      {item.changed_at}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {statusBadge(item.previous_status)}
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