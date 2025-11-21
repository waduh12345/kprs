"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  useGetJournalListQuery,
  useGetJournalByIdQuery,
  useUpdateJournalMutation,
  Journal,
  UpdateJournalRequest,
} from "@/services/admin/journal.service"; // sesuaikan path jika perlu

// --- TYPES untuk tampilan (tetap sama bentuk UI sebelumnya) ---
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

// --- KOMPONEN UTAMA ---
export default function PembatalanJurnalPage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchArgs, setSearchArgs] = useState<{
    page: number;
    paginate: number;
    orderBy: string;
    order: string;
    searchBySpecific: string;
    search: string;
  }>({
    page: 1,
    paginate: 10,
    orderBy: "updated_at",
    order: "desc",
    searchBySpecific: "",
    search: "",
  });

  const [foundJournalView, setFoundJournalView] = useState<JurnalPosted | null>(
    null
  );
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isReversing, setIsReversing] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // 1) Query list - triggered when user sets searchArgs
  const {
    data: journalListResponse,
    isFetching: isFetchingList,
    isError: isErrorList,
    error: errorList,
  } = useGetJournalListQuery(searchArgs);

  // 2) selectedId untuk get by id
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // guard usage with skip option (no 'any' used)
  const idForQuery = selectedId ?? 0;
  const {
    data: journalById,
    isFetching: isFetchingById,
    isError: isErrorById,
    error: errorById,
  } = useGetJournalByIdQuery(idForQuery, { skip: selectedId === null });

  // 3) mutation update
  const [updateJournal, { isLoading: isUpdating }] = useUpdateJournalMutation();

  // map Journal (service) -> JurnalPosted for display
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

  // EFFECT: when journalListResponse changes as a result of a search request, handle it
  useEffect(() => {
    if (!isFetchingList && searchArgs.searchBySpecific === "reference") {
      if (
        journalListResponse &&
        Array.isArray(journalListResponse.data) &&
        journalListResponse.data.length > 0
      ) {
        const first = journalListResponse.data[0];
        setSelectedId(first.id);
        setSearchError(null);
      } else {
        setSelectedId(null);
        setFoundJournalView(null);
        const msg = `Nomor Bukti Jurnal ${searchArgs.search} tidak ditemukan.`;
        setSearchError(msg);
        Swal.fire({ icon: "error", title: "Tidak Ditemukan", text: msg });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    journalListResponse,
    isFetchingList,
    searchArgs.searchBySpecific,
    searchArgs.search,
  ]);

  // EFFECT: when getById returns data, map & set view
  useEffect(() => {
    if (!isFetchingById && journalById && selectedId !== null) {
      const view = mapJournalToView(journalById);
      if (view.status === "Batal") {
        const msg = `Jurnal ${view.no_bukti} sudah dibatalkan sebelumnya.`;
        setSearchError(msg);
        setFoundJournalView(null);
        Swal.fire({ icon: "info", title: "Sudah Batal", text: msg });
      } else {
        setFoundJournalView(view);
        setSearchError(null);
      }
    } else if (!isFetchingById && isErrorById) {
      const e = errorById as unknown;
      const text = JSON.stringify(e, null, 2);
      Swal.fire({
        icon: "error",
        title: "Error",
        html: `<pre style="text-align:left">${text}</pre>`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journalById, isFetchingById, isErrorById, errorById, selectedId]);

  // HANDLE search button
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      const msg = "Masukkan Nomor Bukti Jurnal.";
      setSearchError(msg);
      setFoundJournalView(null);
      Swal.fire({ icon: "warning", title: "Input kosong", text: msg });
      return;
    }

    setIsSearching(true);
    setFoundJournalView(null);
    setSelectedId(null);
    setSearchError(null);

    setSearchArgs({
      page: 1,
      paginate: 10,
      orderBy: "updated_at",
      order: "desc",
      searchBySpecific: "reference",
      search: searchQuery.trim(),
    });
  };

  useEffect(() => {
    if (!isFetchingList) {
      setIsSearching(false);
    }
  }, [isFetchingList]);

  // HANDLE cancel (update is_posted -> 0) but include date, description, details to satisfy backend validation
  const handleBatalJurnal = async () => {
    if (!foundJournalView) return;
    if (selectedId === null || journalById === undefined) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "ID atau data jurnal tidak ditemukan.",
      });
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: "Konfirmasi Pembatalan Jurnal",
      html: `
        Anda akan membatalkan Jurnal <b>${foundJournalView.no_bukti}</b> (${foundJournalView.deskripsi}).
        <p class="mt-2 text-red-600 font-semibold">Pembatalan akan mengubah status is_posted menjadi 0.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Proses Pembatalan",
    });

    if (!isConfirmed) return;

    setIsReversing(true);

    try {
      // susun payload UpdateJournalRequest berdasarkan journalById (backend minta date, description, details)
      const detailsFromApi = journalById.details ?? [];

      const detailsPayload = detailsFromApi.map((d) => ({
        coa_id: d.coa_id,
        type: d.type,
        debit: d.debit ?? 0,
        credit: d.credit ?? 0,
        memo: d.memo ?? "",
      }));

      // gunakan full ISO date atau potong ke YYYY-MM-DD sesuai backend; contoh backend contoh create memakai "2025-06-16"
      const datePayload = journalById.date
        ? journalById.date.substring(0, 10)
        : new Date().toISOString().substring(0, 10);

      const payload: UpdateJournalRequest = {
        date: datePayload,
        description: journalById.description ?? "",
        details: detailsPayload,
        is_posted: 0, // set to 0 untuk batal
      };

      // panggil update
      await updateJournal({ id: selectedId, data: payload }).unwrap();

      setIsReversing(false);
      Swal.fire({
        icon: "success",
        title: "Pembatalan Berhasil",
        text: `Jurnal ${foundJournalView.no_bukti} berhasil dibatalkan.`,
      });

      // reset UI
      setFoundJournalView(null);
      setSearchQuery("");
      setSelectedId(null);
      setSearchArgs((s) => ({ ...s, searchBySpecific: "", search: "" }));
    } catch (err) {
      setIsReversing(false);

      const msg = (() => {
        if (err === null || err === undefined) return "Unknown error";
        if (typeof err === "string") return err;
        try {
          return JSON.stringify(err, null, 2);
        } catch {
          return String(err);
        }
      })();

      Swal.fire({
        icon: "error",
        title: "Gagal Pembatalan",
        html: `<pre style="text-align:left; white-space:pre-wrap;">${msg}</pre>`,
      });
    }
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
            <Label htmlFor="bukti">
              Nomor Bukti Jurnal (Misal: JOUR/20251121/00002)
            </Label>
            <Input
              id="bukti"
              placeholder="Masukkan Nomor Bukti"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              disabled={
                isSearching || isReversing || isFetchingList || isFetchingById
              }
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={
              isSearching || isReversing || isFetchingList || isFetchingById
            }
            className="h-10"
          >
            {isSearching || isFetchingList ? (
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
      {foundJournalView && (
        <Card className="shadow-lg border-t-4 border-red-500">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Detail Jurnal Siap
              Dibatalkan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Ringkasan Jurnal */}
            <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b">
              <div>
                <p className="text-sm text-gray-500">No. Bukti / Tipe</p>
                <p className="font-bold">
                  {foundJournalView.no_bukti}{" "}
                  <Badge variant="secondary">{foundJournalView.tipe}</Badge>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tanggal Posting</p>
                <p className="font-bold flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> {foundJournalView.tanggal}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Deskripsi Jurnal</p>
                <p className="font-medium italic">
                  {foundJournalView.deskripsi}
                </p>
              </div>
            </div>

            {/* Tabel Detail Debet/Kredit */}
            <h4 className="font-semibold text-lg mb-2">
              Rincian Debet / Kredit:
            </h4>
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
                  {foundJournalView.details.map((detail, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2 font-mono">{detail.coa}</td>
                      <td className="px-4 py-2">{detail.coa_name}</td>
                      <td className="px-4 py-2 text-right text-red-600">
                        {formatRupiah(detail.debet)}
                      </td>
                      <td className="px-4 py-2 text-right text-green-600">
                        {formatRupiah(detail.kredit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-red-100 font-bold">
                  <tr>
                    <td colSpan={2} className="px-4 py-2 text-right">
                      TOTAL
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatRupiah(foundJournalView.total_nominal)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatRupiah(foundJournalView.total_nominal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleBatalJurnal}
              disabled={isReversing || isUpdating}
              className="w-full text-lg bg-red-600 hover:bg-red-700"
            >
              {isReversing || isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Memproses Pembatalan...
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
      {!foundJournalView && !searchError && !isSearching && (
        <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 rounded-lg">
          <p className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Perhatian: Mekanisme
            Pembatalan
          </p>
          <p className="text-sm mt-1">
            Pembatalan jurnal akan mengubah field <code>is_posted</code> menjadi
            0 dan (opsional) sistem dapat mencatat jurnal balik di backend. Data
            transaksi asli tidak dihapus.
          </p>
        </div>
      )}
    </div>
  );
}