"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  FileText,
  Zap,
  Loader2,
  ListChecks,
  AlertTriangle,
  XCircle,
  Calendar,
} from "lucide-react";
import Swal from "sweetalert2";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// --- DUMMY DATA & TYPES ---

interface JurnalPosted {
  no_bukti: string;
  tanggal: string;
  deskripsi: string;
  total_nominal: number;
  tipe: "Otomatis" | "Manual";
  status: "Posted" | "Batal";
  details: { coa: string; coa_name: string; debet: number; kredit: number }[];
}

const dummyJurnalList: JurnalPosted[] = [
  {
    no_bukti: "JRN-1001",
    tanggal: "2025-11-15",
    deskripsi: "Pencatatan beban gaji bulan November",
    total_nominal: 50000000,
    tipe: "Otomatis",
    status: "Posted",
    details: [
      { coa: "510001", coa_name: "Beban Gaji", debet: 50000000, kredit: 0 },
      { coa: "211001", coa_name: "Utang Gaji", debet: 0, kredit: 50000000 },
    ],
  },
  {
    no_bukti: "JRN-1002",
    tanggal: "2025-11-16",
    deskripsi: "Koreksi kas kecil (Jurnal Manual)",
    total_nominal: 150000,
    tipe: "Manual",
    status: "Posted",
    details: [
      { coa: "111001", coa_name: "Kas di Tangan", debet: 150000, kredit: 0 },
      { coa: "610001", coa_name: "Beban Administrasi", debet: 0, kredit: 150000 },
    ],
  },
  {
    no_bukti: "JRN-1003",
    tanggal: "2025-11-14",
    deskripsi: "Jurnal penyesuaian bunga simpanan",
    total_nominal: 1000000,
    tipe: "Otomatis",
    status: "Batal",
    details: [
      { coa: "520001", coa_name: "Beban Bunga Simpanan", debet: 1000000, kredit: 0 },
      { coa: "211002", coa_name: "Utang Bunga Simpanan", debet: 0, kredit: 1000000 },
    ],
  },
];

// --- HELPER FUNCTIONS ---

const formatRupiah = (number: number) => {
  if (isNaN(number) || number === null || number === undefined) return 'Rp 0';
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

// --- KOMPONEN UTAMA ---

export default function PembatalanJurnalPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [jurnalFound, setJurnalFound] = useState<JurnalPosted | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isReversing, setIsReversing] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // --- HANDLER PENCARIAN ---
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchError("Masukkan Nomor Bukti Jurnal.");
      setJurnalFound(null);
      return;
    }
    
    setIsSearching(true);
    setSearchError(null);
    setJurnalFound(null);

    // Simulasi pencarian
    setTimeout(() => {
      const found = dummyJurnalList.find(d => d.no_bukti === searchQuery.trim().toUpperCase());
      
      if (found) {
        if (found.status === 'Batal') {
            setSearchError(`Jurnal ${found.no_bukti} sudah dibatalkan sebelumnya.`);
            setJurnalFound(null);
        } else {
            setJurnalFound(found);
            setSearchError(null);
        }
      } else {
        setSearchError(`Nomor Bukti Jurnal ${searchQuery} tidak ditemukan.`);
      }
      setIsSearching(false);
    }, 1000);
  };
  
  // --- HANDLER PEMBATALAN (REVERSAL) ---
  const handleBatalJurnal = async () => {
    if (!jurnalFound) return;

    const { isConfirmed } = await Swal.fire({
      title: "Konfirmasi Pembatalan Jurnal",
      html: `
        Anda akan membatalkan Jurnal **${jurnalFound.no_bukti}** (${jurnalFound.deskripsi}).
        <p class="mt-2 text-red-600 font-semibold">Pembatalan akan dicatat sebagai Jurnal Balik (Reversal) pada tanggal hari ini.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Proses Pembatalan",
    });

    if (!isConfirmed) return;
    
    setIsReversing(true);
    
    // Simulasi pemrosesan Jurnal Balik
    setTimeout(() => {
      setIsReversing(false);
      
      // Simulasi update status di daftar dummy
      dummyJurnalList.find(d => d.no_bukti === jurnalFound.no_bukti)!.status = 'Batal';
      
      Swal.fire({
        icon: "success",
        title: "Pembatalan Berhasil!",
        html: `Jurnal **${jurnalFound.no_bukti}** berhasil dibatalkan. Jurnal Balik (Reversal) telah dicatat.`,
      });
      
      // Reset tampilan
      setJurnalFound(null);
      setSearchQuery("");
      
    }, 2500); 
  };


  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <XCircle className="h-6 w-6 text-red-600" />
        Pembatalan Jurnal (Reversal)
      </h2>

      {/* --- KARTU PENCARIAN --- */}
      <Card className="shadow-lg border-t-4 border-indigo-500">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-indigo-600">
            <Search className="h-5 w-5" /> Cari Jurnal yang akan Dibatalkan
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 items-end">
          <div className="flex-grow space-y-2">
            <Label htmlFor="bukti">Nomor Bukti Jurnal (Misal: JRN-1001)</Label>
            <Input
              id="bukti"
              placeholder="Masukkan Nomor Bukti"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              disabled={isSearching || isReversing}
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={isSearching || isReversing}
            className="h-10"
          >
            {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          </Button>
        </CardContent>
        {searchError && <p className="text-sm text-red-500 px-6 pb-4">{searchError}</p>}
      </Card>

      {/* --- KARTU DETAIL JURNAL DITEMUKAN --- */}
      {jurnalFound && (
        <Card className="shadow-lg border-t-4 border-red-500">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Detail Jurnal Siap Dibatalkan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Ringkasan Jurnal */}
            <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b">
              <div>
                <p className="text-sm text-gray-500">No. Bukti / Tipe</p>
                <p className="font-bold">{jurnalFound.no_bukti} <Badge variant="secondary">{jurnalFound.tipe}</Badge></p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tanggal Posting</p>
                <p className="font-bold flex items-center gap-1"><Calendar className="h-4 w-4" /> {jurnalFound.tanggal}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Deskripsi Jurnal</p>
                <p className="font-medium italic">{jurnalFound.deskripsi}</p>
              </div>
            </div>

            {/* Tabel Detail Debet/Kredit */}
            <h4 className="font-semibold text-lg mb-2">Rincian Debet / Kredit:</h4>
            <div className="p-0 overflow-x-auto border rounded-lg">
                <table className="min-w-full text-sm">
                    <thead className="bg-red-50 text-left">
                        <tr>
                            <th className="px-4 py-2">COA</th>
                            <th className="px-4 py-2">Nama Akun</th>
                            <th className="px-4 py-2 text-right">Debet</th>
                            <th className="px-4 py-2 text-right">Kredit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jurnalFound.details.map((detail, index) => (
                            <tr key={index} className="border-t">
                                <td className="px-4 py-2 font-mono">{detail.coa}</td>
                                <td className="px-4 py-2">{detail.coa_name}</td>
                                <td className="px-4 py-2 text-right text-red-600">{formatRupiah(detail.debet)}</td>
                                <td className="px-4 py-2 text-right text-green-600">{formatRupiah(detail.kredit)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-red-100 font-bold">
                         <tr>
                            <td colSpan={2} className="px-4 py-2 text-right">TOTAL</td>
                            <td className="px-4 py-2 text-right">{formatRupiah(jurnalFound.total_nominal)}</td>
                            <td className="px-4 py-2 text-right">{formatRupiah(jurnalFound.total_nominal)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

          </CardContent>
          <CardFooter>
            <Button
              onClick={handleBatalJurnal}
              disabled={isReversing}
              className="w-full text-lg bg-red-600 hover:bg-red-700"
            >
              {isReversing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Memproses Jurnal Balik...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-5 w-5" />
                  Batalkan Jurnal Ini
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* --- INFO --- */}
      {!jurnalFound && !searchError && !isSearching && (
        <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 rounded-lg">
          <p className="font-semibold flex items-center gap-2">
             <AlertTriangle className="h-5 w-5" /> Perhatian: Mekanisme Pembatalan
          </p>
          <p className="text-sm mt-1">
            Pembatalan jurnal akan secara otomatis membuat **Jurnal Balik (Reversal)** pada tanggal hari ini untuk membalik efek transaksi asli. Data transaksi asli tidak dihapus.
          </p>
        </div>
      )}
    </div>
  );
}