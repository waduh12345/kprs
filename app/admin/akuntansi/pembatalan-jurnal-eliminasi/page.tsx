"use client";

import React, { useState, useEffect } from "react";
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
  Loader2,
  AlertTriangle,
  XCircle,
  Calendar,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  useLazyGetJournalEliminasiListQuery, // ⬅️ GANTI KE LAZY
  useGetJournalEliminasiByIdQuery,
  useUpdateJournalEliminasiMutation,
  Journal,
  JournalDetailForm,
} from "@/services/admin/journal-elimininasis.service";

const formatRupiah = (number: number) => {
  if (isNaN(number) || number === null || number === undefined) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

export default function PembatalanJurnalEliminasiPage() {
  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJournalId, setSelectedJournalId] = useState<number | null>(null);
  const [jurnalFound, setJurnalFound] = useState<Journal | null>(null);
  
  // UI State
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isReversing, setIsReversing] = useState(false);

  // --- API HOOKS ---
  
  // 1. Lazy Query untuk Search (Trigger manual)
  const [triggerSearch, { isFetching: isSearching }] = useLazyGetJournalEliminasiListQuery();

  // 2. Query Detail (Otomatis jalan jika selectedJournalId ada)
  const { data: journalDetail, isFetching: isFetchingDetail } =
    useGetJournalEliminasiByIdQuery(selectedJournalId ?? 0, {
      skip: selectedJournalId === null,
      refetchOnMountOrArgChange: true, // Pastikan data fresh
    });

  // 3. Mutation Update
  const [updateJournal, { isLoading: isUpdating }] = useUpdateJournalEliminasiMutation();

  // --- HANDLER SEARCH ---
  const handleSearch = async () => {
    // 1. Validasi Input
    if (!searchQuery.trim()) {
      Swal.fire({ icon: "warning", title: "Input Kosong", text: "Masukkan Nomor Dokumen Eliminasi." });
      return;
    }

    // 2. RESET STATE (Penting: Hapus data lama sebelum cari baru)
    setSearchError(null);
    setJurnalFound(null);
    setSelectedJournalId(null);

    try {
      // 3. Trigger API Search
      const result = await triggerSearch({
        page: 1,
        paginate: 10,
        searchBySpecific: "reference",
        search: searchQuery.trim(),
      }).unwrap();

      const listData = result.data || [];

      // 4. Logika Hasil
      if (Array.isArray(listData) && listData.length > 0) {
        // KETEMU: Set ID agar query detail berjalan
        setSelectedJournalId(listData[0].id);
      } else {
        // TIDAK KETEMU: Tampilkan Error
        const msg = `Nomor Dokumen "${searchQuery}" tidak ditemukan.`;
        setSearchError(msg);
        Swal.fire({ icon: "error", title: "Tidak Ditemukan", text: msg });
      }

    } catch (error) {
      console.error(error);
      const msg = "Terjadi kesalahan saat mencari data.";
      setSearchError(msg);
    }
  };

  // --- EFFECT: DATA DETAIL MASUK ---
  useEffect(() => {
    if (selectedJournalId !== null && journalDetail && !isFetchingDetail) {
      // Cek apakah sudah batal / unposted
      if (journalDetail.is_posted === false) {
        setSearchError(`Dokumen ${journalDetail.reference} statusnya sudah BATAL.`);
        setJurnalFound(null); // Jangan tampilkan detail
      } else {
        setJurnalFound(journalDetail);
        setSearchError(null);
      }
    }
  }, [journalDetail, isFetchingDetail, selectedJournalId]);

  // --- HANDLER BATAL ---
  const handleBatalJurnal = async () => {
    if (!jurnalFound) return;
    
    const { isConfirmed } = await Swal.fire({
      title: "Konfirmasi Pembatalan",
      html: `
        Anda akan membatalkan Dokumen Eliminasi <b>${jurnalFound.reference}</b>?<br/>
        <small class="text-gray-500">Deskripsi: ${jurnalFound.description}</small>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Batalkan",
      confirmButtonColor: "#d33",
    });

    if (!isConfirmed) return;

    setIsReversing(true);

    try {
      // Siapkan payload
      const detailsPayload: JournalDetailForm[] = (jurnalFound.details ?? []).map((d) => ({
        coa_id: d.coa_id,
        type: d.type,
        debit: d.debit ?? 0,
        credit: d.credit ?? 0,
        memo: d.memo ?? "",
      }));

      // Eksekusi API Update
      await updateJournal({
        id: jurnalFound.id,
        data: {
          date: jurnalFound.date ? jurnalFound.date.substring(0, 10) : new Date().toISOString().substring(0,10),
          description: jurnalFound.description,
          details: detailsPayload,
          is_posted: 0, // Set Unposted
        },
      }).unwrap();

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: `Jurnal Eliminasi ${jurnalFound.reference} berhasil dibatalkan.`,
      });

      // Reset UI Total
      setJurnalFound(null);
      setSearchQuery("");
      setSelectedJournalId(null);
      setSearchError(null);

    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Gagal Pembatalan",
        text: "Terjadi kesalahan saat memproses pembatalan.",
      });
    } finally {
      setIsReversing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <XCircle className="h-6 w-6 text-purple-600" />
        Pembatalan Jurnal Eliminasi (Reversal)
      </h2>

      {/* PENCARIAN */}
      <Card className="shadow-lg border-t-4 border-purple-600">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-purple-600">
            <Search className="h-5 w-5" /> Cari Dokumen Eliminasi
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 items-end">
          <div className="flex-grow space-y-2">
            <Label htmlFor="bukti">Nomor Dokumen Eliminasi</Label>
            <Input
              id="bukti"
              placeholder="Contoh: ELIM/2025..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              disabled={isSearching || isReversing}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isSearching || isReversing}
            className="h-10 w-32 bg-purple-600 hover:bg-purple-700"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Cari"
            )}
          </Button>
        </CardContent>
        
        {/* Error / Not Found Message */}
        {searchError && (
          <div className="px-6 pb-6 pt-0 animate-in fade-in slide-in-from-top-2">
             <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {searchError}
             </div>
          </div>
        )}
      </Card>

      {/* DETAIL JURNAL */}
      {jurnalFound && !searchError && (
        <Card className="shadow-lg border-t-4 border-red-500 animate-in fade-in zoom-in-95 duration-300">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Konfirmasi Pembatalan Eliminasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Header Info */}
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
              <div>
                <Label className="text-xs text-gray-500 font-semibold">NO. DOKUMEN</Label>
                <div className="font-bold text-gray-800">{jurnalFound.reference}</div>
              </div>
              <div>
                <Label className="text-xs text-gray-500 font-semibold">TANGGAL POSTING</Label>
                <div className="font-bold flex items-center gap-1 text-gray-800">
                  <Calendar className="h-4 w-4 text-gray-400" />{" "}
                  {jurnalFound.date.substring(0, 10)}
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500 font-semibold">DESKRIPSI</Label>
                <div className="font-medium italic text-gray-700">{jurnalFound.description}</div>
              </div>
            </div>

            {/* Tabel Detail */}
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-700 font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-left">COA</th>
                    <th className="px-4 py-3 text-left">Nama Akun</th>
                    <th className="px-4 py-3 text-right">Debet</th>
                    <th className="px-4 py-3 text-right">Kredit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(jurnalFound.details ?? []).map((d, idx) => (
                    <tr key={idx} className="bg-white hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono font-medium text-gray-900">
                        {d.coa?.code ?? d.coa_id}
                      </td>
                      <td className="px-4 py-2 text-gray-600">{d.coa?.name ?? "-"}</td>
                      <td className="px-4 py-2 text-right font-mono text-red-600">
                        {d.debit && d.debit > 0 ? formatRupiah(d.debit) : "-"}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-green-600">
                        {d.credit && d.credit > 0 ? formatRupiah(d.credit) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="bg-red-50 p-4 border-t flex justify-end">
            <Button
              onClick={handleBatalJurnal}
              disabled={isReversing || isUpdating}
              className="bg-red-600 hover:bg-red-700 text-white shadow-md"
            >
              {isReversing || isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" /> Batalkan Jurnal Eliminasi Ini
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Info Box Default (Hanya muncul jika tidak sedang mencari & tidak ada hasil) */}
      {!jurnalFound && !searchError && !isSearching && (
        <div className="mt-8 p-4 bg-purple-50 border-l-4 border-purple-500 text-purple-700 rounded-lg animate-in fade-in slide-in-from-bottom-2">
          <p className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Perhatian Khusus
          </p>
          <p className="text-sm mt-1">
            Pembatalan Jurnal Eliminasi hanya memengaruhi data laporan
            konsolidasi. Pastikan Anda membatalkan dokumen yang benar.
          </p>
        </div>
      )}
    </div>
  );
}