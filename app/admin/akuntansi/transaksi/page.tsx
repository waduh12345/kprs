"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText,
  PlusCircle,
  MinusCircle,
  Save,
  Trash2,
  ListChecks,
  AlertTriangle,
  Zap,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";
import { Separator } from "@/components/ui/separator";

// --- DUMMY DATA & TYPES ---

interface JurnalEntry {
  id: number;
  coa_id: string;
  nominal: number;
  tipe: "DEBET" | "KREDIT";
  keterangan: string;
}

interface COA {
  id: string;
  name: string;
}

const dummyCOAs: COA[] = [
  { id: "111001", name: "Kas di Tangan" },
  { id: "112001", name: "Bank Operasional" },
  { id: "121001", name: "Piutang Anggota" },
  { id: "410001", name: "Pendapatan Jasa" },
  { id: "510001", name: "Beban Gaji" },
];

const formatRupiah = (number: number) => {
  if (isNaN(number) || number === null || number === undefined) return '0';
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
  }).format(number);
};

const parseNominal = (value: string) => {
    const parsed = parseFloat(value.replace(/[^0-9]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
}

// --- KOMPONEN UTAMA ---

export default function TransaksiAkuntansiPage() {
  const today = new Date().toISOString().substring(0, 10);
  const [tanggal, setTanggal] = useState(today);
  const [deskripsi, setDeskripsi] = useState("");
  const [jurnalEntries, setJurnalEntries] = useState<JurnalEntry[]>([]);
  const [nextEntryId, setNextEntryId] = useState(1);
  const [isPosting, setIsPosting] = useState(false);

  // --- VALIDASI & TOTAL ---
  const { totalDebet, totalKredit, isBalanced } = useMemo(() => {
    const debet = jurnalEntries
      .filter((e) => e.tipe === "DEBET")
      .reduce((sum, e) => sum + e.nominal, 0);
    const kredit = jurnalEntries
      .filter((e) => e.tipe === "KREDIT")
      .reduce((sum, e) => sum + e.nominal, 0);
    return {
      totalDebet: debet,
      totalKredit: kredit,
      isBalanced: debet === kredit && debet > 0,
    };
  }, [jurnalEntries]);


  // --- HANDLER JURNAL ENTRY ---

  const addJurnalEntry = (tipe: "DEBET" | "KREDIT") => {
    setJurnalEntries([
      ...jurnalEntries,
      {
        id: nextEntryId,
        coa_id: dummyCOAs[0].id, // Default COA pertama
        nominal: 0,
        tipe: tipe,
        keterangan: "",
      },
    ]);
    setNextEntryId(nextEntryId + 1);
  };

  const updateJurnalEntry = (id: number, field: keyof JurnalEntry, value: any) => {
    setJurnalEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry))
    );
  };

  const removeJurnalEntry = (id: number) => {
    setJurnalEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  // --- HANDLER POSTING JURNAL ---
  const handlePostJurnal = async () => {
    if (!isBalanced) {
      return Swal.fire("Gagal Posting", "Total Debet dan Kredit harus seimbang!", "error");
    }
    if (jurnalEntries.length < 2) {
      return Swal.fire("Gagal Posting", "Minimal harus ada dua baris jurnal (Debet dan Kredit).", "error");
    }
    if (!tanggal || !deskripsi.trim()) {
      return Swal.fire("Gagal Posting", "Tanggal dan Deskripsi wajib diisi.", "error");
    }

    const { isConfirmed } = await Swal.fire({
      title: "Konfirmasi Posting Jurnal",
      html: `
        <p>Anda akan memposting jurnal manual sebesar <b>${formatRupiah(totalDebet)}</b>.</p>
        <p class="mt-2 text-red-600 font-semibold">Pastikan data COA dan nominal sudah benar.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Post Jurnal",
    });

    if (!isConfirmed) return;

    setIsPosting(true);
    
    // Simulasi pemrosesan API
    setTimeout(() => {
      setIsPosting(false);
      Swal.fire({
        icon: "success",
        title: "Posting Berhasil!",
        text: `Jurnal berhasil dicatat dengan nomor bukti JRN-${Math.floor(Math.random() * 9000) + 1000}.`,
      });
      // Reset formulir
      setJurnalEntries([]);
      setDeskripsi("");
      setTanggal(new Date().toISOString().substring(0, 10));
    }, 2000);
  };


  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" />
        Input Transaksi Jurnal Umum
      </h2>

      {/* --- HEADER JURNAL --- */}
      <Card className="shadow-lg border-t-4 border-indigo-500">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-indigo-600">
            <ListChecks className="h-5 w-5" /> Informasi Umum Jurnal
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="tanggal">Tanggal Transaksi</Label>
            <Input
              id="tanggal"
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="deskripsi">Deskripsi / Keterangan Jurnal</Label>
            <Input
              id="deskripsi"
              placeholder="Contoh: Pembayaran tagihan listrik kantor bulan November"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* --- DETAIL JURNAL (TABLE) --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            Detail Akun (COA)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-3 w-[250px]">COA (Akun)</th>
                <th className="px-4 py-3">Keterangan Baris</th>
                <th className="px-4 py-3 text-right w-[150px]">Debet</th>
                <th className="px-4 py-3 text-right w-[150px]">Kredit</th>
                <th className="px-4 py-3 w-[50px]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {jurnalEntries.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center p-4 text-gray-500">
                    Klik tombol di bawah untuk menambah baris jurnal.
                  </td>
                </tr>
              )}
              {jurnalEntries.map((entry) => (
                <tr key={entry.id} className="border-t">
                  <td className="px-4 py-2">
                    <select
                      value={entry.coa_id}
                      onChange={(e) => updateJurnalEntry(entry.id, "coa_id", e.target.value)}
                      className="w-full p-1 border rounded"
                    >
                      {dummyCOAs.map((coa) => (
                        <option key={coa.id} value={coa.id}>
                          {coa.id} - {coa.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={entry.keterangan}
                      onChange={(e) => updateJurnalEntry(entry.id, "keterangan", e.target.value)}
                      placeholder="Keterangan opsional per baris"
                      className="p-1 h-8"
                    />
                  </td>
                  <td className="px-4 py-2">
                    {entry.tipe === "DEBET" ? (
                      <Input
                        value={formatRupiah(entry.nominal)}
                        onChange={(e) => updateJurnalEntry(entry.id, "nominal", parseNominal(e.target.value))}
                        className="p-1 h-8 text-right font-mono border-red-300"
                      />
                    ) : (
                      <div className="text-center text-gray-400">-</div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {entry.tipe === "KREDIT" ? (
                      <Input
                        value={formatRupiah(entry.nominal)}
                        onChange={(e) => updateJurnalEntry(entry.id, "nominal", parseNominal(e.target.value))}
                        className="p-1 h-8 text-right font-mono border-green-300"
                      />
                    ) : (
                      <div className="text-center text-gray-400">-</div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeJurnalEntry(entry.id)}
                      className="p-1 h-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* --- TOTAL FOOTER --- */}
            <tfoot className="bg-gray-100 font-bold border-t-2">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-right">TOTAL JURNAL</td>
                <td className={`px-4 py-3 text-right text-lg ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                  {formatRupiah(totalDebet)}
                </td>
                <td className={`px-4 py-3 text-right text-lg ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                  {formatRupiah(totalKredit)}
                </td>
                <td className="px-4 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </CardContent>

        <CardFooter className="flex justify-between items-center pt-4">
            <div className="flex gap-2">
                <Button onClick={() => addJurnalEntry("DEBET")} variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                    <PlusCircle className="h-4 w-4 mr-1" /> Tambah Debet
                </Button>
                <Button onClick={() => addJurnalEntry("KREDIT")} variant="outline" className="text-green-600 border-green-300 hover:bg-green-50">
                    <PlusCircle className="h-4 w-4 mr-1" /> Tambah Kredit
                </Button>
            </div>
            
            <div className="flex items-center gap-4">
                {!isBalanced && totalDebet > 0 && (
                    <span className="text-red-600 font-semibold flex items-center gap-1">
                        <AlertTriangle className="h-5 w-5" /> Selisih: {formatRupiah(Math.abs(totalDebet - totalKredit))}
                    </span>
                )}
                <Button
                    onClick={handlePostJurnal}
                    disabled={isPosting || !isBalanced}
                    className="bg-primary hover:bg-indigo-700 text-lg"
                >
                    {isPosting ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Posting...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-5 w-5" />
                            Post Jurnal
                        </>
                    )}
                </Button>
            </div>
        </CardFooter>
      </Card>
      
      <p className="text-xs text-gray-500 mt-4">
        *Pastikan Total Debet dan Total Kredit seimbang sebelum memposting jurnal.
      </p>
    </div>
  );
}