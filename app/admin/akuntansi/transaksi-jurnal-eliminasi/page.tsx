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
  FileText,
  PlusCircle,
  Trash2,
  Save,
  ListChecks,
  AlertTriangle,
  Loader2,
  Zap,
} from "lucide-react";
import Swal from "sweetalert2";
import { Combobox } from "@/components/ui/combo-box";
import {
  useCreateJournalEliminasiMutation,
  CreateJournalRequest,
} from "@/services/admin/journal-elimininasis.service";
import {  useGetCOAListQuery} from "@/services/admin/journal.service";

// --- TYPES ---

interface JurnalEntry {
  id: number;
  coa_id: number;
  nominal: number;
  tipe: "DEBET" | "KREDIT";
  keterangan: string;
}

type COAFromApi = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
};

// --- HELPERS ---

const formatRupiah = (number: number) => {
  if (isNaN(number) || number === null || number === undefined) return "0";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
  }).format(number);
};

const parseNominal = (value: string) => {
  const parsed = parseFloat(value.replace(/[^0-9]/g, ""));
  return isNaN(parsed) ? 0 : parsed;
};

function extractErrorMessage(err: unknown): string {
  if (err === null || err === undefined) return "Unknown error";
  if (typeof err === "string") return err;
  if (typeof err === "object") {
    const e = err as Record<string, unknown>;
    // RTK Query often returns { data: { message, errors } } or error object with message
    if ("data" in e && typeof e.data === "object" && e.data !== null) {
      const d = e.data as Record<string, unknown>;
      if ("message" in d && typeof d.message === "string") return d.message;
      if ("errors" in d && typeof d.errors === "object" && d.errors !== null)
        return JSON.stringify(d.errors, null, 2);
    }
    if ("message" in e && typeof e.message === "string") return e.message;
    try {
      return JSON.stringify(e, null, 2);
    } catch {
      return String(e);
    }
  }
  return String(err);
}

// --- COMPONENT ---

export default function TransaksiJurnalEliminasiPage() {
  const today = new Date().toISOString().substring(0, 10);
  const currentMonth = new Date().toISOString().substring(0, 7);

  const [tanggal, setTanggal] = useState<string>(today);
  const [periodeEliminasi, setPeriodeEliminasi] =
    useState<string>(currentMonth);
  const [noDokumen, setNoDokumen] = useState<string>("");
  const [deskripsi, setDeskripsi] = useState<string>("");
  const [jurnalEntries, setJurnalEntries] = useState<JurnalEntry[]>([]);
  const [nextEntryId, setNextEntryId] = useState<number>(1);
  const [isPosting, setIsPosting] = useState<boolean>(false);

  // ambil COA dari API
  const {
    data: coaListResponse,
    isLoading: isLoadingCoa,
    isFetching: isFetchingCoa,
  } = useGetCOAListQuery({ page: 1, paginate: 300, orderBy: "coas.code", order: "asc" });

  const coas: COAFromApi[] = coaListResponse?.data ?? [];

  // mutation create eliminasi
  const [createJournalEliminasi] = useCreateJournalEliminasiMutation();

  // --- TOTAL & VALIDASI ---
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
    setJurnalEntries((prev) => [
      ...prev,
      {
        id: nextEntryId,
        coa_id: coas.length > 0 ? coas[0].id : 0,
        nominal: 0,
        tipe,
        keterangan: "",
      },
    ]);
    setNextEntryId((n) => n + 1);
  };

  const updateJurnalEntry = <K extends keyof JurnalEntry>(
    id: number,
    field: K,
    value: JurnalEntry[K]
  ) => {
    setJurnalEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const removeJurnalEntry = (id: number) => {
    setJurnalEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  // --- HANDLER POSTING JURNAL ---
  const handlePostJurnal = async () => {
    if (!isBalanced) {
      return Swal.fire(
        "Gagal Posting",
        "Total Debet dan Kredit harus seimbang!",
        "error"
      );
    }
    if (jurnalEntries.length < 2) {
      return Swal.fire(
        "Gagal Posting",
        "Minimal harus ada dua baris jurnal (Debet dan Kredit).",
        "error"
      );
    }
    if (!tanggal || !deskripsi.trim() || !periodeEliminasi) {
      return Swal.fire(
        "Gagal Posting",
        "Tanggal, Periode, dan Deskripsi wajib diisi.",
        "error"
      );
    }

    const { isConfirmed } = await Swal.fire({
      title: "Konfirmasi Posting Jurnal Eliminasi",
      html: `
        <p>Anda akan memposting jurnal eliminasi untuk periode <b>${periodeEliminasi}</b> sebesar <b>${formatRupiah(
        totalDebet
      )}</b>.</p>
        <p class="mt-2 text-red-600 font-semibold">Jurnal ini hanya akan muncul di Laporan Konsolidasi.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Post Eliminasi",
    });

    if (!isConfirmed) return;

    setIsPosting(true);

    const payload: CreateJournalRequest = {
      date: tanggal,
      description: deskripsi,
      is_posted: 1,
      details: jurnalEntries.map((e) => ({
        coa_id: e.coa_id,
        type: e.tipe === "DEBET" ? "debit" : "credit",
        debit: e.tipe === "DEBET" ? e.nominal : 0,
        credit: e.tipe === "KREDIT" ? e.nominal : 0,
        memo: e.keterangan ?? "",
      })),
    };

    try {
      await createJournalEliminasi(payload).unwrap();

      setIsPosting(false);
      await Swal.fire({
        icon: "success",
        title: "Posting Berhasil!",
        text: `Jurnal Eliminasi berhasil dicatat.`,
      });

      // Reset formulir
      setJurnalEntries([]);
      setDeskripsi("");
      setNoDokumen("");
      setTanggal(new Date().toISOString().substring(0, 10));
      setPeriodeEliminasi(new Date().toISOString().substring(0, 7));
    } catch (err) {
      setIsPosting(false);
      const msg = extractErrorMessage(err);
      await Swal.fire({
        icon: "error",
        title: "Gagal Posting",
        html: `<pre style="text-align:left; white-space:pre-wrap;">${msg}</pre>`,
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Zap className="h-6 w-6 text-primary" />
        Input Transaksi Jurnal Eliminasi
      </h2>

      {/* --- HEADER JURNAL ELIMINASI --- */}
      <Card className="shadow-lg border-t-4 border-purple-600">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-purple-600">
            <ListChecks className="h-5 w-5" /> Informasi Eliminasi
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label htmlFor="periode">Periode Eliminasi (YYYY-MM)</Label>
            <Input
              id="periode"
              type="month"
              value={periodeEliminasi}
              onChange={(e) => setPeriodeEliminasi(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tanggal">Tanggal Posting</Label>
            <Input
              id="tanggal"
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="noDokumen">No. Dokumen</Label>
            <Input
              id="noDokumen"
              placeholder="Opsional: nomor dokumen/ref"
              value={noDokumen}
              onChange={(e) => setNoDokumen(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deskripsi">Deskripsi Eliminasi</Label>
            <Input
              id="deskripsi"
              placeholder="Contoh: Eliminasi pendapatan dan beban antar unit"
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
                    Tambahkan baris jurnal eliminasi (wajib minimal satu Debet
                    dan satu Kredit).
                  </td>
                </tr>
              )}
              {jurnalEntries.map((entry) => (
                <tr key={entry.id} className="border-t">
                  <td className="px-4 py-2">
                    <Combobox<COAFromApi>
                      value={entry.coa_id}
                      onChange={(val) =>
                        updateJurnalEntry(entry.id, "coa_id", val)
                      }
                      data={coas}
                      isLoading={isLoadingCoa || isFetchingCoa}
                      placeholder="Pilih COA"
                      getOptionLabel={(item) => `${item.code} - ${item.name}`}
                      disabled={coas.length === 0}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      value={entry.keterangan}
                      onChange={(e) =>
                        updateJurnalEntry(
                          entry.id,
                          "keterangan",
                          e.target.value
                        )
                      }
                      placeholder="Keterangan eliminasi per baris"
                      className="p-1 h-8"
                    />
                  </td>
                  <td className="px-4 py-2">
                    {entry.tipe === "DEBET" ? (
                      <Input
                        value={formatRupiah(entry.nominal)}
                        onChange={(e) =>
                          updateJurnalEntry(
                            entry.id,
                            "nominal",
                            parseNominal(e.target.value)
                          )
                        }
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
                        onChange={(e) =>
                          updateJurnalEntry(
                            entry.id,
                            "nominal",
                            parseNominal(e.target.value)
                          )
                        }
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
                <td colSpan={2} className="px-4 py-3 text-right">
                  TOTAL ELIMINASI
                </td>
                <td
                  className={`px-4 py-3 text-right text-lg ${
                    isBalanced ? "text-purple-600" : "text-red-600"
                  }`}
                >
                  {formatRupiah(totalDebet)}
                </td>
                <td
                  className={`px-4 py-3 text-right text-lg ${
                    isBalanced ? "text-purple-600" : "text-red-600"
                  }`}
                >
                  {formatRupiah(totalKredit)}
                </td>
                <td className="px-4 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </CardContent>

        <CardFooter className="flex justify-between items-center pt-4">
          <div className="flex gap-2">
            <Button
              onClick={() => addJurnalEntry("DEBET")}
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <PlusCircle className="h-4 w-4 mr-1" /> Tambah Debet
            </Button>
            <Button
              onClick={() => addJurnalEntry("KREDIT")}
              variant="outline"
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              <PlusCircle className="h-4 w-4 mr-1" /> Tambah Kredit
            </Button>
          </div>

          <div className="flex items-center gap-4">
            {!isBalanced && totalDebet > 0 && (
              <span className="text-red-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="h-5 w-5" /> Selisih:{" "}
                {formatRupiah(Math.abs(totalDebet - totalKredit))}
              </span>
            )}
            <Button
              onClick={handlePostJurnal}
              disabled={isPosting || !isBalanced}
              className="bg-purple-600 hover:bg-purple-700 text-lg"
            >
              {isPosting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Post Jurnal Eliminasi
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <p className="text-xs text-gray-500 mt-4">
        *Jurnal Eliminasi harus seimbang (Debet = Kredit) dan digunakan khusus
        untuk tujuan konsolidasi laporan.
      </p>
    </div>
  );
}