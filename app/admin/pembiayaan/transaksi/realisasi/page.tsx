"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProdukToolbar } from "@/components/ui/produk-toolbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ListChecks,
  CheckCircle,
  Clock,
  User,
  Zap,
  Play,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";

// --- DUMMY DATA & TYPES ---

interface PengajuanPembiayaan {
  id: string;
  anggota_name: string;
  no_pengajuan: string;
  produk: string;
  nominal_disetujui: number;
  tenor: number; // bulan
  status: "Disetujui" | "Realisasi" | "Pending";
  tanggal_persetujuan: string;
}

const initialDummyData: PengajuanPembiayaan[] = [
  {
    id: "PNJ005",
    anggota_name: "Ahmad Riyadi",
    no_pengajuan: "APP/24/005",
    produk: "Pembiayaan Mikro",
    nominal_disetujui: 15000000,
    tenor: 12,
    status: "Disetujui",
    tanggal_persetujuan: "2025-11-15",
  },
  {
    id: "PNJ006",
    anggota_name: "Dewi Kartika",
    no_pengajuan: "APP/24/006",
    produk: "Kredit Multi Guna",
    nominal_disetujui: 45000000,
    tenor: 6,
    status: "Disetujui",
    tanggal_persetujuan: "2025-11-16",
  },
  {
    id: "PNJ007",
    anggota_name: "Fajar Pratama",
    no_pengajuan: "APP/24/007",
    produk: "Pembiayaan Investasi",
    nominal_disetujui: 80000000,
    tenor: 36,
    status: "Pending",
    tanggal_persetujuan: "2025-11-17",
  },
  {
    id: "PNJ008",
    anggota_name: "Gilang Ramadhan",
    no_pengajuan: "APP/24/008",
    produk: "Pembiayaan Mikro",
    nominal_disetujui: 10000000,
    tenor: 18,
    status: "Realisasi",
    tanggal_persetujuan: "2025-11-10",
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

const statusVariant = (status: PengajuanPembiayaan["status"]): "success" | "destructive" | "default" | "secondary" => {
  if (status === "Disetujui") return "default"; // Kuning/Biru untuk Siap Diproses
  if (status === "Realisasi") return "success"; // Hijau untuk Sudah Aktif
  return "secondary";
};

// --- KOMPONEN UTAMA ---

export default function RealisasiPembiayaanPage() {
  const [dataRealisasi, setDataRealisasi] = useState<PengajuanPembiayaan[]>(initialDummyData);
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter hanya yang statusnya "Disetujui" (Siap Realisasi)
  const listSiapRealisasi = useMemo(() => {
    const arr = dataRealisasi.filter(d => d.status === "Disetujui");
    
    // Filter Query Pencarian
    if (!query.trim()) return arr;
    const q = query.toLowerCase();
    return arr.filter((it) =>
      [it.anggota_name, it.no_pengajuan, it.produk].some(
        (f) => f?.toLowerCase?.().includes?.(q)
      )
    );
  }, [dataRealisasi, query]);


  // --- HANDLER REALISASI ---
  const handleRealisasi = async (item: PengajuanPembiayaan) => {
    const today = new Date().toISOString().substring(0, 10);
    
    const { value: tanggalReal } = await Swal.fire({
      title: "Konfirmasi Realisasi Pembiayaan",
      html: `
        <p class="text-left mb-2">Anggota: <b>${item.anggota_name}</b></p>
        <p class="text-left mb-4">Nominal: <b>${formatRupiah(item.nominal_disetujui)}</b></p>
        
        <div class="space-y-2 text-left">
          <label for="tanggal_realisasi" class="block text-sm font-medium text-gray-700">Tanggal Realisasi (Pencairan)</label>
          <input 
            id="tanggal_realisasi" 
            type="date" 
            value="${today}"
            min="${item.tanggal_persetujuan}" 
            max="${today}" 
            class="swal2-input w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <p class="text-xs text-red-500 mt-2 text-left">Tanggal ini akan menjadi dasar perhitungan angsuran.</p>
      `,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Proses Realisasi",
      cancelButtonText: "Batal",
      input: "text", // Menggunakan input teks karena input date di swal sulit diakses langsung
      inputPlaceholder: today,
      preConfirm: (inputVal) => {
        const dateInput = document.getElementById("tanggal_realisasi") as HTMLInputElement;
        const tanggal = dateInput?.value;
        if (!tanggal) {
          Swal.showValidationMessage("Tanggal realisasi wajib diisi.");
          return false;
        }
        return tanggal;
      },
      didOpen: () => {
        // Hapus input teks yang dibuat oleh `input: "text"`
        const swalInput = Swal.getInput();
        if (swalInput) swalInput.style.display = 'none';
      }
    });

    if (!tanggalReal) return;
    
    setIsProcessing(true);
    
    // Simulasi pemrosesan API
    setTimeout(() => {
      setDataRealisasi((prev) =>
        prev.map(
          (d): PengajuanPembiayaan =>
            d.id === item.id
              ? { ...d, status: "Realisasi" }
              : d
        )
      );

      
      setIsProcessing(false);
      Swal.fire({
        icon: "success",
        title: "Realisasi Berhasil!",
        html: `Pembiayaan No. ${item.no_pengajuan} untuk <b>${item.anggota_name}</b> telah dicairkan pada tanggal <b>${tanggalReal}</b>.`,
      });
      
    }, 2000); 
  };
  
  // --- HANDLER DETAIL ---
  const handleDetail = (item: PengajuanPembiayaan) => {
    Swal.fire({
      icon: "info",
      title: "Detail Pengajuan",
      html: `
        <p class="text-left mb-2">No. Pengajuan: <b>${item.no_pengajuan}</b></p>
        <p class="text-left mb-2">Produk: <b>${item.produk}</b></p>
        <p class="text-left mb-2">Nominal Disetujui: <b>${formatRupiah(item.nominal_disetujui)}</b></p>
        <p class="text-left mb-2">Tenor: <b>${item.tenor} bulan</b></p>
        <p class="text-left mb-2">Tgl. Persetujuan: <b>${item.tanggal_persetujuan}</b></p>
      `,
      confirmButtonText: "Tutup",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Zap className="h-6 w-6 text-primary" />
        Realisasi Pembiayaan (Pencairan Dana)
      </h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-indigo-600">
            <ListChecks className="h-5 w-5" />
            Daftar Pembiayaan Siap Realisasi
          </CardTitle>
          <p className="text-sm text-gray-500">
            Hanya menampilkan pengajuan yang berstatus **Disetujui** dan belum dicairkan.
          </p>
        </CardHeader>
        <CardContent>
          <ProdukToolbar
            onSearchChange={setQuery}
            
            // Nonaktifkan semua fitur yang tidak relevan
            showAddButton={false}
            enableStatusFilter={false}
            showTemplateCsvButton={false}
            enableImport={false}
            enableExport={false}
          />

          <div className="mt-4 p-0 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="px-4 py-3 w-[150px]">Aksi</th>
                  <th className="px-4 py-3">No. Pengajuan</th>
                  <th className="px-4 py-3">Anggota</th>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3 text-right">Nominal Disetujui</th>
                  <th className="px-4 py-3 text-center">Tenor (Bulan)</th>
                  <th className="px-4 py-3">Tgl. Persetujuan</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {isProcessing ? (
                  <tr>
                    <td colSpan={8} className="text-center p-4">
                        <Loader2 className="h-5 w-5 inline mr-2 animate-spin text-primary" />
                        Sedang memproses realisasi...
                    </td>
                  </tr>
                ) : listSiapRealisasi.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-4">
                      Tidak ada pengajuan yang siap direalisasi (status: Disetujui).
                    </td>
                  </tr>
                ) : (
                  listSiapRealisasi.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-yellow-50/50">
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="default"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleRealisasi(item)}
                            disabled={isProcessing}
                          >
                            <Play className="h-4 w-4 mr-1" /> Realisasi
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDetail(item)}
                          >
                            <ListChecks className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{item.no_pengajuan}</td>
                      <td className="px-4 py-3 whitespace-nowrap flex items-center gap-1">
                        <User className="h-4 w-4 text-gray-500"/> {item.anggota_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{item.produk}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-lg text-primary">
                        {formatRupiah(item.nominal_disetujui)}
                      </td>
                      <td className="px-4 py-3 text-center">{item.tenor}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{item.tanggal_persetujuan}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={statusVariant(item.status)} className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> {item.status}
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
      
      {/* --- REKAP DATA SUDAH REALISASI (Opsional) --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Pembiayaan Sudah Direalisasi
          </CardTitle>
          <p className="text-sm text-gray-500">
            Berikut adalah daftar pembiayaan yang baru saja dicairkan dan telah berstatus **Realisasi**.
          </p>
        </CardHeader>
        <CardContent>
            {/* Tabel pembiayaan sudah realisasi (dummy filtering) */}
            <div className="p-0 overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-green-50 text-left">
                        <tr>
                            <th className="px-4 py-3">No. Pengajuan</th>
                            <th className="px-4 py-3">Anggota</th>
                            <th className="px-4 py-3 text-right">Nominal</th>
                            <th className="px-4 py-3">Tgl. Realisasi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataRealisasi.filter(d => d.status === 'Realisasi').map(item => (
                            <tr key={item.id} className="border-t">
                                <td className="px-4 py-2">{item.no_pengajuan}</td>
                                <td className="px-4 py-2">{item.anggota_name}</td>
                                <td className="px-4 py-2 text-right font-semibold">{formatRupiah(item.nominal_disetujui)}</td>
                                <td className="px-4 py-2">{item.tanggal_persetujuan} (Simulasi)</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}