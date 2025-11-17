"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProdukToolbar } from "@/components/ui/produk-toolbar";
import { useRouter } from "next/navigation";
import { Clock, TrendingUp, TrendingDown, FileDown } from "lucide-react";
import Swal from "sweetalert2";

// --- DUMMY DATA & TYPES ---

interface TransaksiSimjaka {
  id: string;
  tanggal_transaksi: string;
  no_rekening: string;
  anggota_name: string;
  jenis_transaksi: "Setoran Awal" | "Top Up" | "Bunga" | "Penarikan" | "Penutupan";
  nominal: number;
  saldo_akhir: number;
  keterangan: string;
}

const initialDummyData: TransaksiSimjaka[] = [
  {
    id: "TRX005",
    tanggal_transaksi: "2024-10-25",
    no_rekening: "12345-001",
    anggota_name: "Budi Santoso",
    jenis_transaksi: "Bunga",
    nominal: 250000,
    saldo_akhir: 5250000,
    keterangan: "Pencatatan bunga Simjaka bulan Oktober",
  },
  {
    id: "TRX004",
    tanggal_transaksi: "2024-10-20",
    no_rekening: "12345-002",
    anggota_name: "Siti Rahayu",
    jenis_transaksi: "Top Up",
    nominal: 1500000,
    saldo_akhir: 11500000,
    keterangan: "Tambahan modal",
  },
  {
    id: "TRX003",
    tanggal_transaksi: "2024-09-01",
    no_rekening: "12345-003",
    anggota_name: "Joko Widodo",
    jenis_transaksi: "Setoran Awal",
    nominal: 2000000,
    saldo_akhir: 2000000,
    keterangan: "Pembukaan Simjaka Reguler",
  },
  {
    id: "TRX002",
    tanggal_transaksi: "2023-11-20",
    no_rekening: "12345-002",
    anggota_name: "Siti Rahayu",
    jenis_transaksi: "Setoran Awal",
    nominal: 10000000,
    saldo_akhir: 10000000,
    keterangan: "Pembukaan Simjaka Prioritas",
  },
  {
    id: "TRX001",
    tanggal_transaksi: "2024-01-15",
    no_rekening: "12345-001",
    anggota_name: "Budi Santoso",
    jenis_transaksi: "Setoran Awal",
    nominal: 5000000,
    saldo_akhir: 5000000,
    keterangan: "Pembukaan Simjaka Emas",
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

const getTransactionStyles = (jenis: TransaksiSimjaka["jenis_transaksi"]) => {
  if (jenis.includes("Setoran") || jenis.includes("Top Up") || jenis === "Bunga") {
    return {
      badgeVariant: "success" as const,
      color: "text-green-600 font-semibold",
      icon: <TrendingUp className="h-4 w-4" />,
    };
  }
  if (jenis.includes("Penarikan") || jenis.includes("Penutupan")) {
    return {
      badgeVariant: "destructive" as const,
      color: "text-red-600 font-semibold",
      icon: <TrendingDown className="h-4 w-4" />,
    };
  }
  return {
    badgeVariant: "secondary" as const,
    color: "text-gray-600",
    icon: null,
  };
};

// --- KOMPONEN UTAMA ---

export default function TransaksiSimpananBerjangkaPage() {
  const router = useRouter();
  
  // State untuk filter
  const [dataTransaksi] = useState<TransaksiSimjaka[]>(initialDummyData);
  const [query, setQuery] = useState("");
  const [jenisFilter, setJenisFilter] = useState<string>("all");

  const filteredList = useMemo(() => {
    let arr = dataTransaksi;
    
    // Filter Jenis Transaksi
    if (jenisFilter !== "all") {
      arr = arr.filter((it) => it.jenis_transaksi === jenisFilter);
    }
      
    // Filter Query Pencarian
    if (!query.trim()) return arr;
    const q = query.toLowerCase();
    return arr.filter((it) =>
      [it.anggota_name, it.no_rekening, it.keterangan].some(
        (f) => f?.toLowerCase?.().includes?.(q)
      )
    );
  }, [dataTransaksi, query, jenisFilter]);


  const handleExportExcel = () => {
    Swal.fire({
        icon: 'info',
        title: 'Export Data',
        text: 'Permintaan export data Transaksi Simpanan Berjangka sedang diproses. (Simulasi)',
    });
  };
  
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            History Transaksi Simpanan Berjangka
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProdukToolbar
            onSearchChange={setQuery}
            
            // Konfigurasi Filter Jenis Transaksi
            enableStatusFilter
            statusOptions={[
              { value: "all", label: "Semua Jenis" },
              { value: "Setoran Awal", label: "Setoran Awal" },
              { value: "Top Up", label: "Top Up" },
              { value: "Bunga", label: "Bunga" },
              { value: "Penarikan", label: "Penarikan" },
              { value: "Penutupan", label: "Penutupan" },
            ]}
            initialStatus={jenisFilter}
            onStatusChange={setJenisFilter} 
            statusFilterLabel="Filter Jenis Transaksi"
            
            // Konfigurasi Export
            enableExport
            onExportExcel={handleExportExcel}
            exportLabel="Export Transaksi"
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
                  <th className="px-4 py-3">Tgl. Transaksi</th>
                  <th className="px-4 py-3">No. Rekening</th>
                  <th className="px-4 py-3">Anggota</th>
                  <th className="px-4 py-3">Jenis Transaksi</th>
                  <th className="px-4 py-3 text-right">Nominal</th>
                  <th className="px-4 py-3 text-right">Saldo Akhir</th>
                  <th className="px-4 py-3">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-4">
                      Tidak ada data transaksi yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => {
                    const styles = getTransactionStyles(item.jenis_transaksi);
                    return (
                      <tr key={item.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">{item.tanggal_transaksi}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-semibold">{item.no_rekening}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{item.anggota_name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={styles.badgeVariant} className="flex items-center gap-1">
                            {styles.icon} {item.jenis_transaksi}
                          </Badge>
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-right font-mono ${styles.color}`}>
                          {formatRupiah(item.nominal)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-gray-800">
                          {formatRupiah(item.saldo_akhir)}
                        </td>
                        <td className="px-4 py-3">{item.keterangan}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-xs text-gray-500 mt-4">
        *Data di atas bersifat dummy dan hanya menampilkan riwayat transaksi.
      </p>
    </div>
  );
}