"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { HistoryIcon, PlusCircle, Clock, FileDown } from "lucide-react";
import Swal from "sweetalert2";

// helper format
const formatRupiah = (number: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

// Pastikan tipe status di SimpananBerjangka sudah diperbarui di file types
type SimpananBerjangkaStatus = "Aktif" | "Jatuh Tempo" | "Tidak Aktif";

// Gunakan tipe SimpananBerjangka dari file types
// Asumsi: SimpananBerjangka dari types/admin/simpanan/simpanan-berjangka.ts
import { SimpananBerjangka } from "@/types/admin/simpanan/simpanan-berjangka";

const statusVariant = (
  status: SimpananBerjangkaStatus
): "success" | "destructive" | "default" | "secondary" => {
  if (status === "Aktif") return "success";
  if (status === "Jatuh Tempo") return "default"; // Atau warna lain
  if (status === "Tidak Aktif") return "destructive"; // Atau warna lain
  return "secondary";
};

// --- NEW: import service hook untuk fetching (pastikan path sesuai projectmu) ---
import { useGetSimpananBerjangkaListQuery } from "@/services/admin/simpanan/simpanan-berjangka.service";
import { displayDate } from "@/lib/format-utils";
// import form component (modal)
import SimpananBerjangkaForm from "@/components/form-modal/simpanan-berjangka-form";

// New Interface untuk data yang sudah di-map agar sesuai tabel
interface SimpananBerjangkaUIData {
  id: number; // ID asli
  reference: string;
  user_name: string;
  category_name: string;
  nominal: number;
  term_months: number;
  date: string; // Tanggal Mulai
  nominal_current: number; // Nominal Saat Ini
  status: SimpananBerjangkaStatus; // Label status yang sudah diolah
}

export default function SimpananBerjangkaPage() {
  const router = useRouter();

  // state untuk data yang ditampilkan di UI (menggantikan dummy)
  const [dataSimjaka, setDataSimjaka] = useState<SimpananBerjangkaUIData[]>([]);

  // modal / editing state
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    SimpananBerjangkaStatus | "all"
  >("all");
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // jika modal terbuka -> lock body scroll dan fokus input pertama
    if (showForm) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // fokus ke elemen input/select/textarea/button pertama di modal
      requestAnimationFrame(() => {
        const el = modalRef.current?.querySelector<HTMLElement>(
          "input,select,textarea,button"
        );
        el?.focus();
      });

      // handle Esc key
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setShowForm(false);
          setEditingId(undefined);
        }
      };
      window.addEventListener("keydown", onKey);

      return () => {
        window.removeEventListener("keydown", onKey);
        document.body.style.overflow = prev;
      };
    }
    // cleanup jika modal tidak terbuka tidak perlu
    return;
  }, [showForm]);

  // fetch dari API (pakai hook yang sudah ada)
  const {
    data: apiResp,
    isLoading,
    refetch,
  } = useGetSimpananBerjangkaListQuery({
    paginate: 10,
    page: 1,
    search: "",
  });

  // Helper: extract array dari berbagai bentuk respons API
  function extractItems(source: unknown): SimpananBerjangka[] {
    if (!source) return [];
    // Jika respons berbentuk { data: { data: [...] } }
    if (typeof source === "object" && source !== null && "data" in source) {
      const lvl1 = (source as Record<string, unknown>).data;
      if (typeof lvl1 === "object" && lvl1 !== null && "data" in lvl1) {
        const lvl2 = (lvl1 as Record<string, unknown>).data;
        if (Array.isArray(lvl2)) return lvl2 as SimpananBerjangka[];
      }
    }
    // Jika respons berbentuk { data: [...] } (kurang umum untuk paginasi)
    if (
      typeof source === "object" &&
      source !== null &&
      Array.isArray(source)
    ) {
      return source as SimpananBerjangka[];
    }
    return [];
  }

  // Helper: map satu item respons -> bentuk UI SimpananBerjangkaUIData
  function mapToUi(item: SimpananBerjangka): SimpananBerjangkaUIData | null {
    if (typeof item.id !== "number") return null;

    // map status: gunakan field `status` yang dikirim backend (0, 1, 2)
    // 0: Tidak Aktif (bisa juga Pending/Selesai), 1: Aktif, 2: Jatuh Tempo (asumsi)
    let statusLabel: SimpananBerjangkaStatus;
    if (item.status === 1) {
      statusLabel = "Aktif";
    } else if (item.status === 2) {
      statusLabel = "Jatuh Tempo";
    } else {
      statusLabel = "Tidak Aktif"; // Asumsi status 0 atau lainnya adalah Tidak Aktif
    }

    // Fallback: Jika ada data dari payment dan paid_at null, bisa dianggap Pending/Tidak Aktif.

    return {
      id: item.id,
      reference: item.reference || "-",
      user_name: item.user_name || "-",
      category_name: item.category_name || "-",
      nominal: item.nominal || 0,
      term_months: item.term_months || 0,
      date: item.date || "-",
      nominal_current: item.nominal || 0, // Dalam contoh respons, hanya ada `nominal`. Diasumsikan `nominal` adalah `nominal_awal` dan juga `nominal_saat_ini` jika tidak ada field lain.
      status: statusLabel,
    };
  }

  // ketika apiResp berubah -> ambil dan map ke state UI
  useEffect(() => {
    const items = extractItems(apiResp);
    const mapped: SimpananBerjangkaUIData[] = items
      .map((it) => mapToUi(it))
      .filter((x): x is SimpananBerjangkaUIData => x !== null);
    setDataSimjaka(mapped);
  }, [apiResp]);

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
      [it.user_name, it.reference, it.category_name].some((f) =>
        f?.toLowerCase?.().includes?.(q)
      )
    );
  }, [dataSimjaka, query, statusFilter]);

  // --- HANDLERS ---
  const handleEdit = (item: SimpananBerjangkaUIData) => {
    // buka modal dan set id untuk mode edit
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (item: SimpananBerjangkaUIData) => {
    const confirm = await Swal.fire({
      title: "Yakin hapus data?",
      text: `Simpanan Berjangka ${item.reference} (${item.user_name}) akan dihapus.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      // ... (style tambahan jika ada)
    });
    if (confirm.isConfirmed) {
      // Di sini harusnya panggil API delete, untuk demo kita hapus local state
      setDataSimjaka((prev) => prev.filter((d) => d.id !== item.id));
      Swal.fire("Berhasil", "Data Simpanan Berjangka dihapus", "success");
    }
  };

  const handleTambahModal = async (item: SimpananBerjangkaUIData) => {
    const { value: nominal } = await Swal.fire({
      title: `Tambah Modal Simjaka`,
      text: `Anggota: ${item.user_name} (${item.reference})`,
      input: "number",
      inputLabel: "Masukkan Nominal Tambah Modal (IDR)",
      inputValue: "",
      showCancelButton: true,
      confirmButtonText: "Proses Tambah Modal",
      inputValidator: (value) => {
        if (!value || Number(value) <= 0) {
          return "Nominal harus lebih dari 0";
        }
        return null;
      },
    });

    if (nominal) {
      const addedNominal = Number(nominal);
      setDataSimjaka((prev) =>
        prev.map((d) =>
          d.id === item.id
            ? { ...d, nominal_current: d.nominal_current + addedNominal }
            : d
        )
      );
      Swal.fire({
        icon: "success",
        title: "Modal Ditambahkan",
        text: `Berhasil menambah modal ${formatRupiah(
          addedNominal
        )} ke rekening ${item.reference}.`,
      });
    }
  };

  const handleExportExcel = () => {
    Swal.fire({
      icon: "info",
      title: "Export Data",
      text: "Permintaan export data Simpanan Berjangka sedang diproses. (Simulasi)",
    });
  };

  // open modal for create
  const handleAdd = () => {
    setEditingId(undefined); // Penting: pastikan ID kosong untuk mode tambah
    setShowForm(true);
  };

  // callback ketika form sukses
  function onFormSuccess() {
    refetch(); // Ambil ulang data
    setShowForm(false);
    setEditingId(undefined);
  }

  // cancel callback
  function onFormCancel() {
    setShowForm(false);
    setEditingId(undefined);
  }

  // Menggunakan filteredList untuk tampilan
  const listToDisplay = filteredList.length > 0 ? filteredList : dataSimjaka;

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
              { value: "Tidak Aktif", label: "Tidak Aktif" },
            ]}
            initialStatus={statusFilter}
            onStatusChange={setStatusFilter as (value: string) => void}
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
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3">Nominal Awal</th>
                  <th className="px-4 py-3">Nominal Saat Ini</th>
                  <th className="px-4 py-3">Jangka (Bulan)</th>
                  <th className="px-4 py-3">Tgl. Mulai</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="text-center p-4">
                      Memuat data...
                    </td>
                  </tr>
                ) : listToDisplay.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center p-4">
                      Tidak ada data simpanan berjangka yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  listToDisplay.map((item) => (
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
                              {/* <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      router.push(
                                        `/admin/simpanan-berjangka/transaksi-simjaka?rekening=${item.reference}`
                                      )
                                    }
                                  >
                                    <HistoryIcon className="size-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>History Transaksi</p>
                                </TooltipContent>
                              </Tooltip> */}
                            </div>
                          }
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.user_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-semibold">
                        {item.reference}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.category_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-mono">
                        {formatRupiah(item.nominal)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-primary">
                        {formatRupiah(item.nominal_current)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.term_months} bulan
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {displayDate(item.date)}
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

      {/* Modal / Form */}
      {showForm && (
        // overlay
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40"
          onClick={() => {
            // klik overlay akan menutup modal
            setShowForm(false);
            setEditingId(undefined);
          }}
        >
          {/* modal container: hentikan event bubbling agar klik di dalam modal tidak menutup */}
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-lg shadow-lg p-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            ref={modalRef}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 id="modal-title" className="text-lg font-medium">
                {editingId
                  ? "Ubah Simpanan Berjangka"
                  : "Tambah Simpanan Berjangka"}
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(undefined);
                  }}
                >
                  Tutup
                </Button>
              </div>
            </div>

            <SimpananBerjangkaForm
              id={editingId}
              onSuccess={() => onFormSuccess()}
              onCancel={() => onFormCancel()}
            />
          </div>
        </div>
      )}
    </div>
  );
}