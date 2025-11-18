"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  FileText,
  Zap,
  Loader2,
  ListChecks,
  AlertTriangle,
  Save,
  Edit,
  Calendar,
} from "lucide-react";
import Swal from "sweetalert2";

// --- DUMMY DATA & TYPES ---

interface JurnalDetail {
  coa: string;
  coa_name: string;
  debet: number;
  kredit: number;
  keterangan_baris: string; // Tambahkan keterangan per baris
}

interface JurnalPosted {
  no_bukti: string;
  tanggal: string;
  deskripsi: string;
  total_nominal: number;
  tipe: "Otomatis" | "Manual";
  status: "Posted" | "Revisi";
  details: JurnalDetail[];
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

const initialDummyJurnalList: JurnalPosted[] = [
  {
    no_bukti: "JRN-1001",
    tanggal: "2025-11-15",
    deskripsi: "Pencatatan beban gaji bulan November",
    total_nominal: 50000000,
    tipe: "Otomatis",
    status: "Posted",
    details: [
      {
        coa: "510001",
        coa_name: "Beban Gaji",
        debet: 50000000,
        kredit: 0,
        keterangan_baris: "Beban gaji bruto",
      },
      {
        coa: "211001",
        coa_name: "Utang Gaji",
        debet: 0,
        kredit: 50000000,
        keterangan_baris: "Kredit ke utang gaji",
      },
    ],
  },
  {
    no_bukti: "JRN-1002",
    tanggal: "2025-11-16",
    deskripsi: "Koreksi kas kecil",
    total_nominal: 150000,
    tipe: "Manual",
    status: "Posted",
    details: [
      {
        coa: "111001",
        coa_name: "Kas di Tangan",
        debet: 150000,
        kredit: 0,
        keterangan_baris: "Pengisian kas",
      },
      {
        coa: "610001",
        coa_name: "Beban Administrasi",
        debet: 0,
        kredit: 150000,
        keterangan_baris: "Pengeluaran",
      },
    ],
  },
];

// --- HELPER FUNCTIONS ---

const formatRupiah = (number: number) => {
  if (isNaN(number) || number === null || number === undefined) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

// --- KOMPONEN UTAMA ---

export default function RevisiJurnalPage() {
  const [searchQuery, setSearchQuery] = useState("");
  // State untuk menyimpan data asli yang ditemukan (Read-only)
  const [jurnalOriginal, setJurnalOriginal] = useState<JurnalPosted | null>(
    null
  );
  // State untuk menyimpan data yang sedang direvisi (Dapat diubah)
  const [jurnalRevisi, setJurnalRevisi] = useState<JurnalPosted | null>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [isRevising, setIsRevising] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // --- HANDLER PENCARIAN ---
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchError("Masukkan Nomor Bukti Jurnal.");
      setJurnalOriginal(null);
      setJurnalRevisi(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setJurnalOriginal(null);
    setJurnalRevisi(null);

    // Simulasi pencarian
    setTimeout(() => {
      const found = initialDummyJurnalList.find(
        (d) => d.no_bukti === searchQuery.trim().toUpperCase()
      );

      if (found) {
        if (found.status === "Revisi") {
          setSearchError(
            `Jurnal ${found.no_bukti} sudah direvisi. Cari jurnal yang belum direvisi.`
          );
          setJurnalOriginal(null);
        } else {
          // Simpan salinan data untuk revisi
          setJurnalOriginal(found);
          setJurnalRevisi({
            ...found,
            details: [...found.details.map((d) => ({ ...d }))],
          });
          setSearchError(null);
        }
      } else {
        setSearchError(
          `Nomor Bukti Jurnal ${searchQuery} tidak ditemukan atau statusnya tidak valid.`
        );
      }
      setIsSearching(false);
    }, 1000);
  };

  // --- HANDLER UPDATE REVISI ---
  const handleUpdateRevisi = <K extends keyof JurnalDetail>(
    index: number,
    field: K,
    value: JurnalDetail[K]
  ) => {
    if (!jurnalRevisi) return;

    const newDetails = jurnalRevisi.details.map((detail, i) => {
      if (i === index) {
        // Jika field COA berubah, update COA dan COA name
        if (field === "coa") {
          const newCoa = dummyCOAs.find((c) => c.id === value);
          return {
            ...detail,
            coa: value as string,
            coa_name: newCoa?.name || "COA Tidak Ditemukan",
          };
        }
        return { ...detail, [field]: value };
      }
      return detail;
    });

    setJurnalRevisi({ ...jurnalRevisi, details: newDetails });
  };

  // --- HANDLER POST REVISI ---
  const handlePostRevisi = async () => {
    if (!jurnalRevisi || !jurnalOriginal) return;

    // Cek apakah ada perubahan
    const originalString = JSON.stringify({
      deskripsi: jurnalOriginal.deskripsi,
      details: jurnalOriginal.details,
    });
    const revisedString = JSON.stringify({
      deskripsi: jurnalRevisi.deskripsi,
      details: jurnalRevisi.details,
    });

    if (originalString === revisedString) {
      return Swal.fire(
        "Perhatian",
        "Tidak ada perubahan yang dilakukan.",
        "info"
      );
    }

    const { isConfirmed } = await Swal.fire({
      title: "Konfirmasi Revisi Jurnal",
      html: `
        Anda akan merevisi Jurnal **${
          jurnalRevisi.no_bukti
        }** (Total: ${formatRupiah(jurnalRevisi.total_nominal)}).
        <p class="mt-2 text-red-600 font-semibold">Revisi akan menggantikan COA/Keterangan lama tanpa memengaruhi Nominal.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Proses Revisi",
    });

    if (!isConfirmed) return;

    setIsRevising(true);

    // Simulasi pemrosesan Revisi
    setTimeout(() => {
      setIsRevising(false);

      // Update status di daftar dummy (hanya untuk simulasi)
      const index = initialDummyJurnalList.findIndex(
        (d) => d.no_bukti === jurnalRevisi.no_bukti
      );
      if (index !== -1) {
        initialDummyJurnalList[index].deskripsi = jurnalRevisi.deskripsi;
        initialDummyJurnalList[index].details = jurnalRevisi.details;
        initialDummyJurnalList[index].status = "Revisi";
      }

      Swal.fire({
        icon: "success",
        title: "Revisi Berhasil!",
        text: `Jurnal ${jurnalRevisi.no_bukti} berhasil direvisi.`,
      });

      // Reset tampilan
      setJurnalOriginal(null);
      setJurnalRevisi(null);
      setSearchQuery("");
    }, 2500);
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Edit className="h-6 w-6 text-primary" />
        Revisi Jurnal Posting
      </h2>

      {/* --- KARTU PENCARIAN --- */}
      <Card className="shadow-lg border-t-4 border-indigo-500">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-indigo-600">
            <Search className="h-5 w-5" /> Cari Jurnal yang Akan Direvisi
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 items-end">
          <div className="flex-grow space-y-2">
            <Label htmlFor="bukti">Nomor Bukti Jurnal</Label>
            <Input
              id="bukti"
              placeholder="Masukkan Nomor Bukti Jurnal (Cth: JRN-1001)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              disabled={isSearching || isRevising}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isSearching || isRevising}
            className="h-10"
          >
            {isSearching ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>
        </CardContent>
        {searchError && (
          <p className="text-sm text-red-500 px-6 pb-4">{searchError}</p>
        )}
      </Card>

      {/* --- KARTU DETAIL JURNAL DITEMUKAN --- */}
      {jurnalRevisi && jurnalOriginal && (
        <Card className="shadow-lg border-t-4 border-yellow-500">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-yellow-700">
              <Edit className="h-5 w-5" /> Koreksi Jurnal **
              {jurnalRevisi.no_bukti}**
            </CardTitle>
            <p className="text-sm text-gray-500">
              **Perhatian:** Anda hanya dapat merevisi **Deskripsi/Keterangan**
              dan **Akun (COA)**. Nominal tidak dapat diubah di sini.
            </p>
          </CardHeader>
          <CardContent>
            {/* Header Jurnal yang Dapat Diedit */}
            <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b">
              <div>
                <p className="text-sm text-gray-500">Tanggal Posting</p>
                <p className="font-bold flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> {jurnalOriginal.tanggal}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Nominal</p>
                <p className="font-bold text-lg text-primary">
                  {formatRupiah(jurnalOriginal.total_nominal)}
                </p>
              </div>
              <div className="col-span-1">
                <Label
                  htmlFor="rev_deskripsi"
                  className="text-sm text-gray-500"
                >
                  Revisi Deskripsi Jurnal
                </Label>
                <Input
                  id="rev_deskripsi"
                  value={jurnalRevisi.deskripsi}
                  onChange={(e) =>
                    setJurnalRevisi({
                      ...jurnalRevisi,
                      deskripsi: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            {/* Tabel Detail Jurnal yang Dapat Diedit */}
            <h4 className="font-semibold text-lg mb-2">
              Revisi Rincian Debet / Kredit:
            </h4>
            <div className="p-0 overflow-x-auto border rounded-lg">
              <table className="min-w-full text-sm">
                <thead className="bg-yellow-50 text-left">
                  <tr>
                    <th className="px-4 py-2 w-[250px]">COA (Akun)</th>
                    <th className="px-4 py-2">Keterangan Baris</th>
                    <th className="px-4 py-2 text-right w-[150px]">Debet</th>
                    <th className="px-4 py-2 text-right w-[150px]">Kredit</th>
                  </tr>
                </thead>
                <tbody>
                  {jurnalRevisi.details.map((detail, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2">
                        <select
                          value={detail.coa}
                          onChange={(e) =>
                            handleUpdateRevisi(index, "coa", e.target.value)
                          }
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
                          value={detail.keterangan_baris}
                          onChange={(e) =>
                            handleUpdateRevisi(
                              index,
                              "keterangan_baris",
                              e.target.value
                            )
                          }
                          placeholder="Keterangan per baris"
                          className="p-1 h-8"
                        />
                      </td>
                      <td className="px-4 py-2 text-right text-red-600">
                        {formatRupiah(detail.debet)}
                      </td>
                      <td className="px-4 py-2 text-right text-green-600">
                        {formatRupiah(detail.kredit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-yellow-100 font-bold">
                  <tr>
                    <td colSpan={2} className="px-4 py-2 text-right">
                      TOTAL NOMINAL JURNAL
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatRupiah(jurnalOriginal.total_nominal)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatRupiah(jurnalOriginal.total_nominal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handlePostRevisi}
              disabled={isRevising}
              className="w-full text-lg bg-primary hover:bg-indigo-700"
            >
              {isRevising ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Memproses Revisi...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Simpan Revisi
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* --- INFO --- */}
      {!jurnalRevisi && !searchError && !isSearching && (
        <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700 rounded-lg">
          <p className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Informasi Revisi
          </p>
          <p className="text-sm mt-1">
            Gunakan fungsi ini hanya untuk mengoreksi **COA** atau
            **Keterangan**. Jika nominal salah, batalkan jurnal menggunakan menu
            **Pembatalan Jurnal** dan posting ulang dengan nilai yang benar.
          </p>
        </div>
      )}
    </div>
  );
}
