"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProdukToolbar } from "@/components/ui/produk-toolbar";
import { useRouter } from "next/navigation";
import ActionsGroup from "@/components/admin-components/actions-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HistoryIcon,
  PlusCircle,
  Clock,
  Coins,
  FileDown,
} from "lucide-react";
import Swal from "sweetalert2";

// --- DUMMY DATA & TYPES ---

interface SimpananBerjangka {
  id: string;
  anggota_name: string;
  no_rekening: string;
  produk: string;
  jangka_waktu: number; // bulan
  nominal_awal: number;
  nominal_sekarang: number;
  status: "Aktif" | "Jatuh Tempo" | "Tutup";
  tanggal_mulai: string;
}

const initialDummyData: SimpananBerjangka[] = [
  {
    id: "SB001",
    anggota_name: "Budi Santoso",
    no_rekening: "12345-001",
    produk: "Simjaka Emas",
    jangka_waktu: 12,
    nominal_awal: 5000000,
    nominal_sekarang: 5250000,
    status: "Aktif",
    tanggal_mulai: "2024-01-15",
  },
  {
    id: "SB002",
    anggota_name: "Siti Rahayu",
    no_rekening: "12345-002",
    produk: "Simjaka Prioritas",
    jangka_waktu: 24,
    nominal_awal: 10000000,
    nominal_sekarang: 10000000,
    status: "Aktif",
    tanggal_mulai: "2023-11-20",
  },
  {
    id: "SB003",
    anggota_name: "Joko Widodo",
    no_rekening: "12345-003",
    produk: "Simjaka Reguler",
    jangka_waktu: 6,
    nominal_awal: 2000000,
    nominal_sekarang: 2000000,
    status: "Jatuh Tempo",
    tanggal_mulai: "2024-04-01",
  },
];

// --- HELPER FUNCTIONS ---

const formatRupiah = (number: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

const statusVariant = (status: SimpananBerjangka["status"]): "success" | "destructive" | "default" | "secondary" => {
  if (status === "Aktif") return "success";
  if (status === "Tutup") return "destructive";
  if (status === "Jatuh Tempo") return "default";
  return "secondary";
};

// --- KOMPONEN UTAMA ---

export default function SimpananBerjangkaPage() {
  const router = useRouter();

  const [dataSimjaka, setDataSimjaka] = useState<SimpananBerjangka[]>(initialDummyData);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredList = useMemo(() => {
    let arr = dataSimjaka;
    
    // Filter Status
    if (statusFilter !== "all") {
      arr = arr.filter((it) => it.status === statusFilter);
    }
      
    // Filter Query Pencarian
    if (!query.trim()) return arr;
    const q = query.toLowerCase();
    return arr.filter((it) =>
      [it.anggota_name, it.no_rekening, it.produk].some(
        (f) => f?.toLowerCase?.().includes?.(q)
      )
    );
  }, [dataSimjaka, query, statusFilter]);

  // --- HANDLERS DUMMY ---

  const handleEdit = (item: SimpananBerjangka) => {
    Swal.fire({
      icon: "info",
      title: "Ubah Data",
      text: `Anda akan mengubah data Simpanan Berjangka untuk ${item.anggota_name} (${item.no_rekening}). (Simulasi)`,
    });
    // Di implementasi nyata, arahkan ke halaman edit: router.push(`/admin/simpanan-berjangka/edit/${item.id}`)
  };

  const handleDelete = async (item: SimpananBerjangka) => {
    const confirm = await Swal.fire({
      title: "Yakin hapus data?",
      text: `Simpanan Berjangka ${item.no_rekening} (${item.anggota_name}) akan dihapus.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
    });
    if (confirm.isConfirmed) {
      // Hapus dari state (simulasi)
      setDataSimjaka((prev) => prev.filter((d) => d.id !== item.id));
      Swal.fire("Berhasil", "Data Simpanan Berjangka dihapus", "success");
    }
  };

  const handleTambahModal = async (item: SimpananBerjangka) => {
    const { value: nominal } = await Swal.fire({
        title: `Tambah Modal Simjaka`,
        text: `Anggota: ${item.anggota_name} (${item.no_rekening})`,
        input: 'number',
        inputLabel: 'Masukkan Nominal Tambah Modal (IDR)',
        inputValue: '',
        showCancelButton: true,
        confirmButtonText: 'Proses Tambah Modal',
        inputValidator: (value) => {
            if (!value || Number(value) <= 0) {
                return 'Nominal harus lebih dari 0';
            }
            return null;
        }
    });

    if (nominal) {
        const addedNominal = Number(nominal);
        setDataSimjaka((prev) => 
            prev.map((d) => 
                d.id === item.id 
                    ? { ...d, nominal_sekarang: d.nominal_sekarang + addedNominal } 
                    : d
            )
        );
        Swal.fire({
            icon: 'success',
            title: 'Modal Ditambahkan',
            text: `Berhasil menambah modal ${formatRupiah(addedNominal)} ke rekening ${item.no_rekening}.`,
        });
    }
  };


  const handleExportExcel = () => {
    Swal.fire({
        icon: 'info',
        title: 'Export Data',
        text: 'Permintaan export data Simpanan Berjangka sedang diproses. (Simulasi)',
    });
  };
  
  const handleAdd = () => {
    Swal.fire({
      icon: "info",
      title: "Tambah Data",
      text: `Anda akan menambahkan data Simpanan Berjangka baru. (Simulasi)`,
    });
    // Di implementasi nyata, arahkan ke halaman tambah: router.push("/admin/simpanan-berjangka/add")
  };


  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            Data Simpanan Berjangka
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProdukToolbar
            onSearchChange={setQuery}
            showAddButton
            openModal={handleAdd}
            // Konfigurasi Filter Status
            enableStatusFilter
            statusOptions={[
              { value: "all", label: "Semua Status" },
              { value: "Aktif", label: "Aktif" },
              { value: "Jatuh Tempo", label: "Jatuh Tempo" },
              { value: "Tutup", label: "Tutup" },
            ]}
            initialStatus={statusFilter}
            onStatusChange={setStatusFilter}
            // Konfigurasi Export
            enableExport
            onExportExcel={handleExportExcel}
            exportLabel="Export Data"
            exportIcon={<FileDown className="h-4 w-4 mr-2" />}
            // Nonaktifkan Import/Template
            showTemplateCsvButton={false}
            enableImport={false}
          />

          <div className="mt-4 p-0 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-4 py-3">Aksi</th>
                  <th className="px-4 py-3">Anggota</th>
                  <th className="px-4 py-3">No. Rekening</th>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3">Nominal Awal</th>
                  <th className="px-4 py-3">Nominal Saat Ini</th>
                  <th className="px-4 py-3">Jangka (Bulan)</th>
                  <th className="px-4 py-3">Tgl. Mulai</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center p-4">
                      Tidak ada data simpanan berjangka yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <ActionsGroup
                          handleDetail={() => handleEdit(item)}
                          handleEdit={() => handleEdit(item)}
                          handleDelete={() => handleDelete(item)}
                          showDetail={false}
                          additionalActions={
                            <div className="flex items-center gap-2">
                              {/* Tombol Tambah Modal */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-green-100 hover:bg-green-200 text-green-700"
                                    onClick={() => handleTambahModal(item)}
                                  >
                                    <PlusCircle className="size-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Tambah Modal/Top Up</p>
                                </TooltipContent>
                              </Tooltip>

                              {/* History Transaksi */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      router.push(
                                        `/admin/simpanan-berjangka/transaksi-simjaka?rekening=${item.no_rekening}`
                                      )
                                    }
                                  >
                                    <HistoryIcon className="size-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>History Transaksi</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          }
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.anggota_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-semibold">
                        {item.no_rekening}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.produk}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-mono">
                        {formatRupiah(item.nominal_awal)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-primary">
                        {formatRupiah(item.nominal_sekarang)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.jangka_waktu}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.tanggal_mulai}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={statusVariant(item.status)}>
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Catatan: Karena menggunakan data dummy, pagination dihilangkan */}
      <p className="text-xs text-gray-500 mt-4">
        {`
        *Data di atas bersifat dummy dan tidak terhubung ke API. Nominal Saat Ini dapat berubah setelah menggunakan fitur "Tambah Modal".
        `}
      </p>
    </div>
  );
}