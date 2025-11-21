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
  useGetJournalEliminasiListQuery,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJournalId, setSelectedJournalId] = useState<number | null>(
    null
  );
  const [jurnalFound, setJurnalFound] = useState<Journal | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isReversing, setIsReversing] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // 1) GET LIST by reference
  const { data: journalList, isFetching: isFetchingList } =
    useGetJournalEliminasiListQuery(
      {
        page: 1,
        paginate: 10,
        searchBySpecific: "reference",
        search: searchQuery,
      },
      { skip: searchQuery.trim() === ""  }
    );

  // 2) GET DETAIL by id
  const { data: journalDetail, isFetching: isFetchingDetail } =
    useGetJournalEliminasiByIdQuery(selectedJournalId ?? 0, {
      skip: selectedJournalId === null,
    });

  // 3) MUTATION update
  const [updateJournal, { isLoading: isUpdating }] =
    useUpdateJournalEliminasiMutation();

  // EFFECT: update journalFound ketika detail sudah didapat
  useEffect(() => {
    if (journalDetail) {
      if (journalDetail.is_posted === false) {
        setSearchError(
          `Jurnal ${journalDetail.reference} sudah dibatalkan sebelumnya.`
        );
        setJurnalFound(null);
      } else {
        setJurnalFound(journalDetail);
        setSearchError(null);
      }
    }
  }, [journalDetail]);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchError("Masukkan Nomor Dokumen Eliminasi.");
      setJurnalFound(null);
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    setJurnalFound(null);
    setSelectedJournalId(null);
  };

  // efek: setelah list muncul, ambil first id
  useEffect(() => {
    if (!isFetchingList && journalList && journalList.data.length > 0) {
      setSelectedJournalId(journalList.data[0].id);
    } else if (
      !isFetchingList &&
      journalList &&
      journalList.data.length === 0
    ) {
      setSearchError(`Nomor Dokumen ${searchQuery} tidak ditemukan.`);
      setIsSearching(false);
    }
    if (!isFetchingList) setIsSearching(false);
  }, [journalList, isFetchingList]);

  const handleBatalJurnal = async () => {
    if (!jurnalFound) return;
    const { isConfirmed } = await Swal.fire({
      title: "Konfirmasi Pembatalan Jurnal Eliminasi",
      html: `
        Anda akan membatalkan Dokumen <b>${jurnalFound.reference}</b> (${jurnalFound.description}).
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Proses Pembatalan",
    });
    if (!isConfirmed) return;

    setIsReversing(true);

    try {
      const detailsPayload: JournalDetailForm[] = (
        jurnalFound.details ?? []
      ).map((d) => ({
        coa_id: d.coa_id,
        type: d.type,
        debit: d.debit ?? 0,
        credit: d.credit ?? 0,
        memo: d.memo ?? "",
      }));

      await updateJournal({
        id: jurnalFound.id,
        data: {
          date: jurnalFound.date.substring(0, 10),
          description: jurnalFound.description,
          details: detailsPayload,
          is_posted: 0,
        },
      }).unwrap();

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: `Jurnal ${jurnalFound.reference} berhasil dibatalkan.`,
      });
      setJurnalFound(null);
      setSearchQuery("");
      setSelectedJournalId(null);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Pembatalan",
        text: JSON.stringify(err),
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
              placeholder="Masukkan Nomor Dokumen Eliminasi"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              disabled={isSearching || isReversing}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isSearching || isReversing}
            className="h-10 bg-purple-600 hover:bg-purple-700"
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

      {/* DETAIL JURNAL */}
      {jurnalFound && (
        <Card className="shadow-lg border-t-4 border-red-500">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Detail Jurnal Eliminasi Siap
              Dibatalkan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b">
              <div>
                <p className="text-sm text-gray-500">No. Dokumen</p>
                <p className="font-bold">{jurnalFound.reference}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tanggal Posting</p>
                <p className="font-bold flex items-center gap-1">
                  <Calendar className="h-4 w-4" />{" "}
                  {jurnalFound.date.substring(0, 10)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Deskripsi</p>
                <p className="font-medium italic">{jurnalFound.description}</p>
              </div>
            </div>

            {/* tabel detail */}
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
                  {(jurnalFound.details ?? []).map((d, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2 font-mono">
                        {d.coa?.code ?? d.coa_id}
                      </td>
                      <td className="px-4 py-2">{d.coa?.name ?? "-"}</td>
                      <td className="px-4 py-2 text-right text-red-600">
                        {formatRupiah(d.debit ?? 0)}
                      </td>
                      <td className="px-4 py-2 text-right text-green-600">
                        {formatRupiah(d.credit ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
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
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memproses
                  Jurnal Balik Eliminasi...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-5 w-5" /> Batalkan Jurnal Eliminasi
                  Ini
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
      {!jurnalFound && !searchError && !isSearching && (
        <div className="mt-8 p-4 bg-purple-50 border-l-4 border-purple-500 text-purple-700 rounded-lg">
          <p className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Perhatian Khusus
          </p>
          <p className="text-sm mt-1">
            Pembatalan Jurnal Eliminasi hanya memengaruhi data laporan
            konsolidasi. Jurnal Balik akan dibuat dengan menggunakan mekanisme
            Reversal pada tanggal hari ini.
          </p>
        </div>
      )}
    </div>
  );
}