"use client";

import React, { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";

import {
  useLazyGetJournalListQuery,
  useGetJournalByIdQuery,
  useUpdateJournalMutation,
  Journal,
  UpdateJournalRequest,
} from "@/services/admin/journal.service"; 

// --- TYPES ---
interface JurnalPosted {
  no_bukti: string;
  tanggal: string;
  deskripsi: string;
  total_nominal: number;
  tipe: "Otomatis" | "Manual";
  status: "Posted" | "Batal";
  details: { coa: string; coa_name: string; debet: number; kredit: number }[];
}

// --- HELPERS ---
const formatRupiah = (number: number) => {
  if (isNaN(number) || number === null || number === undefined) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

export default function PembatalanJurnalPage() {
  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [foundJournalView, setFoundJournalView] = useState<JurnalPosted | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isReversing, setIsReversing] = useState<boolean>(false);

  // --- API HOOKS ---
  // 1. Lazy Query untuk Search List
  const [triggerSearch, { isFetching: isSearching }] = useLazyGetJournalListQuery();

  // 2. Query Detail (Otomatis jalan jika selectedId ada isinya)
  const {
    data: journalById,
    isFetching: isFetchingById,
    isError: isErrorById,
  } = useGetJournalByIdQuery(selectedId ?? 0, { 
    skip: selectedId === null, // Skip jika ID null
    refetchOnMountOrArgChange: true // Pastikan data baru selalu diambil
  });

  // 3. Mutation Update
  const [updateJournal, { isLoading: isUpdating }] = useUpdateJournalMutation();

  // --- MAPPER FUNCTION ---
  const mapJournalToView = (j: Journal): JurnalPosted => {
    const details = j.details ?? [];
    const total = details.reduce(
      (sum, d) => sum + Math.max(d.debit ?? 0, d.credit ?? 0),
      0
    );

    const detailsView = details.map((d) => ({
      coa: d.coa?.code ?? String(d.coa_id),
      coa_name: d.coa?.name ?? "-",
      debet: d.debit ?? 0,
      kredit: d.credit ?? 0,
    }));

    return {
      no_bukti: j.reference,
      tanggal: j.date ? j.date.substring(0, 10) : "",
      deskripsi: j.description ?? "",
      total_nominal: total,
      tipe: j.source_type ? "Otomatis" : "Manual",
      status: j.is_posted ? "Posted" : "Batal",
      details: detailsView,
    };
  };

  // --- HANDLER SEARCH ---
  const handleSearch = async () => {
    // 1. Validasi Input
    if (!searchQuery.trim()) {
      Swal.fire({ icon: "warning", title: "Input Kosong", text: "Masukkan Nomor Bukti Jurnal." });
      return;
    }

    // 2. RESET SEMUA STATE TAMPILAN (PENTING!)
    // Ini memastikan data lama hilang dulu sebelum mencari yang baru
    setFoundJournalView(null);
    setSelectedId(null); 
    setSearchError(null);

    try {
      // 3. Panggil API Search
      const result = await triggerSearch({
        page: 1,
        paginate: 10,
        orderBy: "updated_at",
        order: "desc",
        searchBySpecific: "reference",
        search: searchQuery.trim(),
      }).unwrap();

      const journalList = result.data || [];

      // 4. Logika Hasil Pencarian
      if (Array.isArray(journalList) && journalList.length > 0) {
        // KETEMU: Set ID agar query detail berjalan
        const firstJournal = journalList[0];
        setSelectedId(firstJournal.id); 
      } else {
        // TIDAK KETEMU: Tampilkan Error, data view tetap null (karena sudah di-reset di langkah 2)
        const msg = `Nomor Bukti "${searchQuery}" tidak ditemukan.`;
        setSearchError(msg);
        Swal.fire({ icon: "error", title: "Tidak Ditemukan", text: msg });
      }

    } catch (error) {
      console.error(error);
      const msg = "Terjadi kesalahan koneksi atau server.";
      setSearchError(msg);
    }
  };

  // --- EFFECT: DATA DETAIL MASUK ---
  // Effect ini hanya jalan jika `journalById` berhasil didapat dari API
  useEffect(() => {
    if (selectedId !== null && journalById && !isFetchingById) {
      const view = mapJournalToView(journalById);

      // Cek Status Pembatalan
      if (view.status === "Batal") {
        setSearchError(`Jurnal ${view.no_bukti} sudah dibatalkan (Status: Batal).`);
        setFoundJournalView(null); // Jangan tampilkan detail jika sudah batal
      } else {
        setFoundJournalView(view); // Tampilkan detail jika status Posted
        setSearchError(null);
      }
    }
  }, [journalById, isFetchingById, selectedId]);


  // --- HANDLER PEMBATALAN ---
  const handleBatalJurnal = async () => {
    if (!foundJournalView || selectedId === null || !journalById) return;

    const { isConfirmed } = await Swal.fire({
      title: "Konfirmasi Pembatalan",
      html: `Anda yakin ingin membatalkan jurnal <b>${foundJournalView.no_bukti}</b>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Batalkan",
      confirmButtonColor: "#d33",
    });

    if (!isConfirmed) return;

    setIsReversing(true);

    try {
      // Payload sesuai kebutuhan backend
      const payload: UpdateJournalRequest = {
        date: journalById.date ? journalById.date.substring(0, 10) : new Date().toISOString().substring(0, 10),
        description: journalById.description ?? "",
        details: (journalById.details ?? []).map(d => ({
          coa_id: d.coa_id,
          type: d.type,
          debit: d.debit ?? 0,
          credit: d.credit ?? 0,
          memo: d.memo ?? ""
        })),
        is_posted: 0, // Set status ke unposted/batal
      };

      await updateJournal({ id: selectedId, data: payload }).unwrap();

      Swal.fire("Sukses", "Jurnal berhasil dibatalkan.", "success");
      
      // Reset Total setelah sukses
      setFoundJournalView(null);
      setSelectedId(null);
      setSearchQuery("");
      
    } catch (err) {
      console.error(err);
      Swal.fire("Gagal", "Gagal membatalkan jurnal.", "error");
    } finally {
      setIsReversing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <XCircle className="h-6 w-6 text-red-600" />
        Pembatalan Jurnal (Reversal)
      </h2>

      {/* --- PENCARIAN --- */}
      <Card className="shadow-lg border-t-4 border-indigo-500">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-indigo-600">
            <Search className="h-5 w-5" /> Cari Jurnal
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 items-end">
          <div className="flex-grow space-y-2">
            <Label htmlFor="bukti">Nomor Bukti Jurnal</Label>
            <Input
              id="bukti"
              placeholder="Contoh: JOUR/2025..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              disabled={isSearching || isFetchingById || isReversing}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isSearching || isFetchingById || isReversing}
            className="h-10 w-32"
          >
            {isSearching || isFetchingById ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Cari"
            )}
          </Button>
        </CardContent>

        {/* PESAN ERROR / TIDAK DITEMUKAN */}
        {searchError && (
          <div className="px-6 pb-6 pt-0 animate-in fade-in slide-in-from-top-2">
             <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {searchError}
             </div>
          </div>
        )}
      </Card>

      {/* --- TAMPILAN DETAIL (Hanya Muncul Jika Data Ada & Tidak Error) --- */}
      {foundJournalView && !searchError && (
        <Card className="shadow-lg border-t-4 border-red-500 animate-in fade-in zoom-in-95 duration-300">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Konfirmasi Pembatalan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
                <div>
                    <Label className="text-xs text-gray-500 font-semibold">NO. BUKTI</Label>
                    <div className="font-mono text-lg font-bold text-gray-800">{foundJournalView.no_bukti}</div>
                </div>
                <div>
                    <Label className="text-xs text-gray-500 font-semibold">TANGGAL</Label>
                    <div className="flex items-center gap-2 font-medium">
                        <Calendar className="h-4 w-4 text-gray-400"/>
                        {foundJournalView.tanggal}
                    </div>
                </div>
                <div className="col-span-2">
                    <Label className="text-xs text-gray-500 font-semibold">DESKRIPSI</Label>
                    <div className="italic text-gray-700">{foundJournalView.deskripsi}</div>
                </div>
            </div>

            {/* Tabel Detail */}
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-gray-700 font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-left">Akun (COA)</th>
                    <th className="px-4 py-3 text-right">Debet</th>
                    <th className="px-4 py-3 text-right">Kredit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {foundJournalView.details.map((item, idx) => (
                    <tr key={idx} className="bg-white hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <div className="font-medium text-gray-900">{item.coa}</div>
                        <div className="text-xs text-gray-500">{item.coa_name}</div>
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-gray-700">
                        {item.debet > 0 ? formatRupiah(item.debet) : "-"}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-gray-700">
                        {item.kredit > 0 ? formatRupiah(item.kredit) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-bold text-gray-800">
                    <tr>
                        <td className="px-4 py-3 text-right">TOTAL</td>
                        <td className="px-4 py-3 text-right text-indigo-700">
                            {formatRupiah(foundJournalView.total_nominal)}
                        </td>
                        <td className="px-4 py-3 text-right text-indigo-700">
                            {formatRupiah(foundJournalView.total_nominal)}
                        </td>
                    </tr>
                </tfoot>
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
                        <Loader2 className="h-4 w-4 animate-spin mr-2"/> Memproses...
                    </>
                ) : (
                    <>
                        <XCircle className="h-4 w-4 mr-2"/> Batalkan Jurnal Ini
                    </>
                )}
             </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}