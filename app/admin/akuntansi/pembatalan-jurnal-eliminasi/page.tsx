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

// --- DUMMY DATA & TYPES ---

interface JurnalEliminasiPosted {
  no_dokumen: string;
  periode_eliminasi: string; // YYYY-MM
  tanggal_posting: string;
  deskripsi: string;
  total_nominal: number;
  status: "Posted" | "Batal";
  details: { coa: string; coa_name: string; debet: number; kredit: number }[];
}

const dummyEliminasiList: JurnalEliminasiPosted[] = [
  {
    no_dokumen: "ELM-001",
    periode_eliminasi: "2025-10",
    tanggal_posting: "2025-11-05",
    deskripsi: "Eliminasi investasi pada entitas anak (Standar)",
    total_nominal: 125000000,
    status: "Posted",
    details: [
      { coa: "310001", coa_name: "Modal Induk", debet: 100000000, kredit: 0 },
      { coa: "320001", coa_name: "Laba Ditahan Anak", debet: 25000000, kredit: 0 },
      { coa: "131001", coa_name: "Investasi pada Anak", debet: 0, kredit: 125000000 },
    ],
  },
  {
    no_dokumen: "ELM-002",
    periode_eliminasi: "2025-11",
    tanggal_posting: "2025-12-03",
    deskripsi: "Eliminasi saldo pendapatan dan beban antar perusahaan",
    total_nominal: 5000000,
    status: "Posted",
    details: [
      { coa: "490001", coa_name: "Pendapatan Antar Perusahaan", debet: 5000000, kredit: 0 },
      { coa: "590001", coa_name: "Beban Antar Perusahaan", debet: 0, kredit: 5000000 },
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

export default function PembatalanJurnalEliminasiPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [jurnalFound, setJurnalFound] = useState<JurnalEliminasiPosted | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isReversing, setIsReversing] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // --- HANDLER PENCARIAN ---
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchError("Masukkan Nomor Dokumen Eliminasi (Cth: ELM-001).");
      setJurnalFound(null);
      return;
    }
    
    setIsSearching(true);
    setSearchError(null);
    setJurnalFound(null);

    // Simulasi pencarian
    setTimeout(() => {
      const found = dummyEliminasiList.find(d => d.no_dokumen === searchQuery.trim().toUpperCase());
      
      if (found) {
        if (found.status === 'Batal') {
            setSearchError(`Jurnal Eliminasi ${found.no_dokumen} sudah dibatalkan sebelumnya.`);
            setJurnalFound(null);
        } else {
            setJurnalFound(found);
            setSearchError(null);
        }
      } else {
        setSearchError(`Nomor Dokumen Eliminasi ${searchQuery} tidak ditemukan.`);
      }
      setIsSearching(false);
    }, 1000);
  };
  
  // --- HANDLER PEMBATALAN (REVERSAL) ---
  const handleBatalJurnal = async () => {
    if (!jurnalFound) return;

    const { isConfirmed } = await Swal.fire({
      title: "Konfirmasi Pembatalan Jurnal Eliminasi",
      html: `
        Anda akan membatalkan Dokumen **${jurnalFound.no_dokumen}** (${jurnalFound.deskripsi}) untuk periode **${jurnalFound.periode_eliminasi}**.
        <p class="mt-2 text-red-600 font-semibold">Pembatalan akan dicatat sebagai Jurnal Balik Eliminasi dan hanya memengaruhi Laporan Konsolidasi.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Proses Pembatalan Eliminasi",
    });

    if (!isConfirmed) return;
    
    setIsReversing(true);
    
    // Simulasi pemrosesan Jurnal Balik
    setTimeout(() => {
      setIsReversing(false);
      
      // Simulasi update status di daftar dummy
      dummyEliminasiList.find(d => d.no_dokumen === jurnalFound.no_dokumen)!.status = 'Batal';
      
      Swal.fire({
        icon: "success",
        title: "Pembatalan Eliminasi Berhasil!",
        html: `Jurnal **${jurnalFound.no_dokumen}** berhasil dibatalkan. Jurnal Balik Eliminasi telah dicatat.`,
      });
      
      // Reset tampilan
      setJurnalFound(null);
      setSearchQuery("");
      
    }, 2500); 
  };


  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <XCircle className="h-6 w-6 text-purple-600" />
        Pembatalan Jurnal Eliminasi (Reversal)
      </h2>

      {/* --- KARTU PENCARIAN --- */}
      <Card className="shadow-lg border-t-4 border-purple-600">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-purple-600">
            <Search className="h-5 w-5" /> Cari Dokumen Eliminasi
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 items-end">
          <div className="flex-grow space-y-2">
            <Label htmlFor="bukti">Nomor Dokumen Eliminasi (Cth: ELM-001)</Label>
            <Input
              id="bukti"
              placeholder="Masukkan Nomor Dokumen Eliminasi"
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
            className="h-10 bg-purple-600 hover:bg-purple-700"
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
              <AlertTriangle className="h-5 w-5" /> Detail Jurnal Eliminasi Siap Dibatalkan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Ringkasan Jurnal */}
            <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b">
              <div>
                <p className="text-sm text-gray-500">No. Dokumen</p>
                <p className="font-bold">{jurnalFound.no_dokumen}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Periode Eliminasi</p>
                <p className="font-bold flex items-center gap-1"><Calendar className="h-4 w-4" /> {jurnalFound.periode_eliminasi}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Nominal</p>
                <p className="font-bold text-lg text-primary">{formatRupiah(jurnalFound.total_nominal)}</p>
              </div>
              <div className="col-span-3">
                <p className="text-sm text-gray-500">Deskripsi Eliminasi</p>
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
                  Memproses Jurnal Balik Eliminasi...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-5 w-5" />
                  Batalkan Jurnal Eliminasi Ini
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* --- INFO --- */}
      {!jurnalFound && !searchError && !isSearching && (
        <div className="mt-8 p-4 bg-purple-50 border-l-4 border-purple-500 text-purple-700 rounded-lg">
          <p className="font-semibold flex items-center gap-2">
             <AlertTriangle className="h-5 w-5" /> Perhatian Khusus
          </p>
          <p className="text-sm mt-1">
            Pembatalan Jurnal Eliminasi hanya memengaruhi data laporan konsolidasi. Jurnal Balik akan dibuat dengan menggunakan mekanisme Reversal pada tanggal hari ini.
          </p>
        </div>
      )}
    </div>
  );
}