"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProdukToolbar } from "@/components/ui/produk-toolbar";
import {
  Clock,
  FileDown,
  Activity, // Icon untuk Laporan Aktivitas
  DollarSign, // Icon untuk Nominal
  BarChart2, // Icon untuk Laporan
} from "lucide-react";
import Swal from "sweetalert2";

// --- DUMMY DATA & TYPES ---

interface SimpananBerjangkaReport {
  id: string;
  anggota_name: string;
  no_rekening: string;
  produk: string;
  jangka_waktu: number; // bulan
  nominal_awal: number;
  nominal_saat_ini: number;
  status: "Aktif" | "Jatuh Tempo" | "Tutup";
  tanggal_mulai: string;
  tanggal_jatuh_tempo: string;
}

const initialDummyData: SimpananBerjangkaReport[] = [
  {
    id: "SB001",
    anggota_name: "Budi Santoso",
    no_rekening: "12345-001",
    produk: "Simjaka Emas",
    jangka_waktu: 12,
    nominal_awal: 5000000,
    nominal_saat_ini: 5250000,
    status: "Aktif",
    tanggal_mulai: "2024-01-15",
    tanggal_jatuh_tempo: "2025-01-15",
  },
  {
    id: "SB002",
    anggota_name: "Siti Rahayu",
    no_rekening: "12345-002",
    produk: "Simjaka Prioritas",
    jangka_waktu: 24,
    nominal_awal: 10000000,
    nominal_saat_ini: 10000000,
    status: "Aktif",
    tanggal_mulai: "2023-11-20",
    tanggal_jatuh_tempo: "2025-11-20",
  },
  {
    id: "SB003",
    anggota_name: "Joko Widodo",
    no_rekening: "12345-003",
    produk: "Simjaka Reguler",
    jangka_waktu: 6,
    nominal_awal: 2000000,
    nominal_saat_ini: 2000000,
    status: "Jatuh Tempo",
    tanggal_mulai: "2024-04-01",
    tanggal_jatuh_tempo: "2024-10-01",
  },
  {
    id: "SB004",
    anggota_name: "Rini Melati",
    no_rekening: "12345-004",
    produk: "Simjaka Emas",
    jangka_waktu: 12,
    nominal_awal: 8000000,
    nominal_saat_ini: 0,
    status: "Tutup",
    tanggal_mulai: "2023-05-10",
    tanggal_jatuh_tempo: "2024-05-10",
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

const statusVariant = (status: SimpananBerjangkaReport["status"]): "success" | "destructive" | "default" | "secondary" => {
  if (status === "Aktif") return "success";
  if (status === "Tutup") return "destructive";
  if (status === "Jatuh Tempo") return "default";
  return "secondary";
};

// --- KOMPONEN UTAMA ---

export default function LaporanSimpananBerjangkaPage() {
  const [dataSimjaka] = useState<SimpananBerjangkaReport[]>(initialDummyData);
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

  // --- RINGKASAN DATA (Summary Cards) ---
  const summary = useMemo(() => {
    const totalAktif = dataSimjaka
      .filter(d => d.status === 'Aktif')
      .reduce((sum, d) => sum + d.nominal_saat_ini, 0);

    const totalJatuhTempo = dataSimjaka
      .filter(d => d.status === 'Jatuh Tempo')
      .reduce((sum, d) => sum + d.nominal_saat_ini, 0);

    const countAktif = dataSimjaka.filter(d => d.status === 'Aktif').length;
    const countJatuhTempo = dataSimjaka.filter(d => d.status === 'Jatuh Tempo').length;
    const countTutup = dataSimjaka.filter(d => d.status === 'Tutup').length;

    return {
      totalAktif,
      totalJatuhTempo,
      countAktif,
      countJatuhTempo,
      countTutup,
      totalRekening: dataSimjaka.length,
    };
  }, [dataSimjaka]);


  const handleExportExcel = () => {
    Swal.fire({
        icon: 'info',
        title: 'Export Data Nominatif',
        html: `
            <p>Pilih format export:</p>
            <div class="mt-4 flex flex-col gap-2">
                <button id="export-nominatif" class="sae-btn-confirm">Nominatif Lengkap (.xlsx)</button>
                <button id="export-jatuh-tempo" class="sae-btn-cancel-light">Rekap Jatuh Tempo (.pdf)</button>
            </div>
        `,
        showConfirmButton: false,
        showCancelButton: false,
        width: 400,
        customClass: {
            popup: "sae-popup",
            title: "sae-title",
            confirmButton: "sae-btn-confirm",
            cancelButton: "sae-btn-cancel-light",
        },
        didOpen: () => {
             // Inject custom styles for Swal buttons if not present
             if (!document.getElementById("sae-styles")) {
                const style = document.createElement("style");
                style.id = "sae-styles";
                style.innerHTML = `
                    .sae-popup{border-radius:18px;box-shadow:0 20px 60px rgba(2,6,23,.15),0 2px 8px rgba(2,6,23,.06);backdrop-filter: blur(8px); border:1px solid rgba(2,6,23,.06)}
                    .sae-title{font-weight:700; letter-spacing:.2px}
                    .sae-btn-confirm{background:linear-gradient(90deg,#6366f1,#22d3ee);color:white;border:none;border-radius:10px;padding:10px 18px;font-weight:600;width:100%}
                    .sae-btn-cancel-light{background:white;color:#0f172a;border:1px solid #e2e8f0;border-radius:10px;padding:10px 18px;font-weight:600;width:100%}
                `;
                document.head.appendChild(style);
            }

            document.getElementById('export-nominatif')?.addEventListener('click', () => {
                Swal.close();
                alert("Mengekspor Laporan Nominatif Lengkap...");
            });
            document.getElementById('export-jatuh-tempo')?.addEventListener('click', () => {
                Swal.close();
                alert("Mengekspor Laporan Rekap Jatuh Tempo...");
            });
        }
    });
  };
  
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <BarChart2 className="h-6 w-6 text-primary" />
        Laporan Nominatif Simpanan Berjangka
      </h2>

      {/* --- SUMMARY CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-l-4 border-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Simjaka Aktif</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(summary.totalAktif)}</div>
            <p className="text-xs text-muted-foreground">{summary.countAktif} Rekening</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nominal Jatuh Tempo</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(summary.totalJatuhTempo)}</div>
            <p className="text-xs text-muted-foreground">{summary.countJatuhTempo} Rekening Mendekati</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rekening Simjaka</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalRekening}</div>
            <p className="text-xs text-muted-foreground">{summary.countTutup} Rekening Telah Ditutup</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detail Nominatif</CardTitle>
        </CardHeader>
        <CardContent>
          <ProdukToolbar
            onSearchChange={setQuery}
            
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
            statusFilterLabel="Filter Status Simjaka"
            
            // Konfigurasi Export
            enableExport
            onExportExcel={handleExportExcel}
            exportLabel="Export Laporan"
            exportIcon={<FileDown className="h-4 w-4 mr-2" />}
            
            // Nonaktifkan tombol Add/Import/Template
            showAddButton={false}
            showTemplateCsvButton={false}
            enableImport={false}
          />

          <div className="mt-4 p-0 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-4 py-3">No. Rekening</th>
                  <th className="px-4 py-3">Anggota</th>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3">Tgl. Mulai</th>
                  <th className="px-4 py-3">Jatuh Tempo</th>
                  <th className="px-4 py-3 text-right">Nominal Awal</th>
                  <th className="px-4 py-3 text-right">Nominal Saat Ini</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-4">
                      Tidak ada data simpanan berjangka yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap font-semibold">{item.no_rekening}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{item.anggota_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{item.produk}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{item.tanggal_mulai}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-red-600">
                        {item.status === 'Aktif' ? item.tanggal_jatuh_tempo : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-mono">
                        {formatRupiah(item.nominal_awal)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-primary">
                        {formatRupiah(item.nominal_saat_ini)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-xs text-gray-500 mt-4">
        *Laporan ini bersifat nominatif (data per rekening) dan menggunakan data dummy.
      </p>
    </div>
  );
}