"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Search,
  Loader2,
  AlertTriangle,
  Save,
  Edit,
  Calendar,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import Swal from "sweetalert2";
import { cn } from "@/lib/utils"; // Pastikan path utils cn benar

// Import Service
import {
  useLazyGetJournalListQuery,
  useGetJournalByIdQuery,
  useUpdateJournalMutation,
  useGetCOAListQuery,
  JournalDetailForm,
  UpdateJournalRequest,
} from "@/services/admin/journal.service";

// --- HELPERS FORMATTING ---

// 1. Format ke Tampilan (String "Rp 10.000")
const formatRupiah = (number: number | string) => {
  if (!number) return "";
  const num = typeof number === "string" ? parseInt(number) : number;
  if (isNaN(num)) return "";
  
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num); // Output: "Rp 10.000"
};

// 2. Parse dari Tampilan ke Angka (Number 10000)
const parseNominal = (value: string): number => {
  // Hapus semua karakter kecuali angka
  const cleanValue = value.replace(/[^0-9]/g, "");
  return cleanValue ? parseInt(cleanValue) : 0;
};

// --- TYPES LOCAL STATE ---
interface EditableJournalDetail {
  id?: number;
  coa_id: number;
  type: "debit" | "credit";
  debit: number;
  credit: number;
  memo: string;
}

interface EditableJournalState {
  description: string;
  details: EditableJournalDetail[];
}

export default function RevisiJurnalPage() {
  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [formState, setFormState] = useState<EditableJournalState | null>(null);
  const [isRevising, setIsRevising] = useState(false);

  // --- API HOOKS ---
  const [triggerSearch, { isFetching: isSearching }] = useLazyGetJournalListQuery();

  const { data: journalOriginal, isFetching: isFetchingDetail } = useGetJournalByIdQuery(
    selectedId ?? 0, 
    { skip: selectedId === null, refetchOnMountOrArgChange: true }
  );

  // Ambil Data COA untuk Combobox
  const { data: coaListResp, isLoading: isLoadingCoa } = useGetCOAListQuery({ page: 1, paginate: 2000, orderBy: "coas.code", order: "asc" });
  const coas = useMemo(() => coaListResp?.data || [], [coaListResp]);

  const [updateJournal, { isLoading: isUpdating }] = useUpdateJournalMutation();

  // --- HANDLER PENCARIAN ---
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Swal.fire({ icon: "warning", title: "Input Kosong", text: "Masukkan Nomor Bukti Jurnal." });
      return;
    }
    setSearchError(null);
    setSelectedId(null);
    setFormState(null);

    try {
      const result = await triggerSearch({
        page: 1,
        paginate: 10,
        searchBySpecific: "reference",
        search: searchQuery.trim(),
      }).unwrap();

      const listData = result.data || [];
      if (Array.isArray(listData) && listData.length > 0) {
        setSelectedId(listData[0].id);
      } else {
        const msg = `Jurnal "${searchQuery}" tidak ditemukan.`;
        setSearchError(msg);
        Swal.fire({ icon: "error", title: "Tidak Ditemukan", text: msg });
      }
    } catch (error) {
      console.error(error);
      setSearchError("Terjadi kesalahan koneksi.");
    }
  };

  // --- EFFECT: MAP DATA API KE FORM STATE ---
  useEffect(() => {
    if (journalOriginal && !isFetchingDetail && selectedId !== null) {
      const mappedDetails: EditableJournalDetail[] = (journalOriginal.details || []).map((d) => ({
        id: d.id,
        coa_id: d.coa_id,
        type: d.type,
        debit: Number(d.debit),
        credit: Number(d.credit),
        memo: d.memo || "",
      }));

      setFormState({
        description: journalOriginal.description || "",
        details: mappedDetails,
      });
    }
  }, [journalOriginal, isFetchingDetail, selectedId]);

  // --- HANDLER EDIT FORM ---
  const handleDetailChange = (
    index: number,
    field: keyof EditableJournalDetail,
    value: number | string
  ) => {
    if (!formState) return;

    const newDetails = [...formState.details];

    // Logika Eksklusif Debit/Kredit
    if (field === "debit") {
       const numVal = value as number;
       newDetails[index] = { ...newDetails[index], debit: numVal, credit: 0 }; // Reset kredit jika debit diisi
    } else if (field === "credit") {
       const numVal = value as number;
       newDetails[index] = { ...newDetails[index], credit: numVal, debit: 0 }; // Reset debit jika kredit diisi
    } else {
       newDetails[index] = { ...newDetails[index], [field]: value };
    }

    setFormState({ ...formState, details: newDetails });
  };

  // --- HITUNG TOTAL ---
  const totalDebit = formState?.details.reduce((acc, curr) => acc + curr.debit, 0) || 0;
  const totalCredit = formState?.details.reduce((acc, curr) => acc + curr.credit, 0) || 0;
  const isBalanced = Math.abs(totalDebit - totalCredit) < 1;

  // --- HANDLER SIMPAN ---
  const handlePostRevisi = async () => {
    if (!formState || !selectedId || !journalOriginal) return;

    if (!isBalanced) {
      return Swal.fire("Tidak Balance", "Total Debet dan Kredit harus sama.", "warning");
    }

    const { isConfirmed } = await Swal.fire({
      title: "Simpan Revisi?",
      html: `Anda akan memperbarui Jurnal <b>${journalOriginal.reference}</b>.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Simpan",
    });

    if (!isConfirmed) return;

    setIsRevising(true);

    try {
      const detailsPayload: JournalDetailForm[] = formState.details.map((d) => {
        let type: "debit" | "credit" = "debit";
        if (d.credit > 0) type = "credit";
        
        return {
          coa_id: Number(d.coa_id),
          type: type,
          debit: d.debit,
          credit: d.credit,
          memo: d.memo,
        };
      });

      const payload: UpdateJournalRequest = {
        date: journalOriginal.date ? journalOriginal.date.substring(0, 10) : new Date().toISOString().substring(0, 10),
        description: formState.description,
        is_posted: 1,
        details: detailsPayload,
      };

      await updateJournal({ id: selectedId, data: payload }).unwrap();
      Swal.fire("Berhasil", "Jurnal berhasil direvisi.", "success");
      setSearchQuery("");
      setSelectedId(null);
      setFormState(null);
    } catch (error) {
      console.error(error);
      Swal.fire("Gagal", "Gagal menyimpan revisi.", "error");
    } finally {
      setIsRevising(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Edit className="h-6 w-6 text-primary" />
        Revisi Jurnal Transaksi
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
              disabled={isSearching || isUpdating || isRevising}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isSearching || isUpdating || isRevising}
            className="h-10 w-32"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cari"}
          </Button>
        </CardContent>
        {searchError && (
          <div className="px-6 pb-6 pt-0">
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {searchError}
            </div>
          </div>
        )}
      </Card>

      {/* --- FORM REVISI --- */}
      {journalOriginal && formState && !searchError && (
        <Card className="shadow-lg border-t-4 border-yellow-500 animate-in fade-in zoom-in-95 duration-300">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl flex items-center gap-2 text-yellow-700">
                  <Edit className="h-5 w-5" /> Form Koreksi Jurnal
                </CardTitle>
                <div className="text-sm text-gray-500 mt-1">
                  Revisi Dokumen: <b>{journalOriginal.reference}</b>
                </div>
              </div>
              <div className="text-right text-sm">
                <div className="flex items-center gap-1 text-gray-600 justify-end">
                  <Calendar className="h-4 w-4" /> {journalOriginal.date?.substring(0, 10)}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Deskripsi Jurnal</Label>
              <Input
                value={formState.description}
                onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                placeholder="Deskripsi Jurnal"
              />
            </div>

            {/* TABEL DETAIL */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-yellow-50 px-4 py-2 border-b flex justify-between items-center">
                <h4 className="font-semibold text-yellow-800">Rincian Akun</h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="px-4 py-2 w-[35%]">Akun (COA)</th>
                      <th className="px-4 py-2 w-[25%]">Keterangan Baris</th>
                      <th className="px-4 py-2 w-[20%] text-right">Debet</th>
                      <th className="px-4 py-2 w-[20%] text-right">Kredit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {formState.details.map((detail, index) => (
                      <tr key={index} className="bg-white hover:bg-gray-50 transition-colors">
                        
                        {/* 1. COMBOBOX COA (Searchable) */}
                        <td className="px-4 py-2 align-top">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between font-normal text-left",
                                  !detail.coa_id && "text-muted-foreground"
                                )}
                              >
                                {detail.coa_id
                                  ? coas.find((c) => c.id === detail.coa_id)
                                    ? `${coas.find((c) => c.id === detail.coa_id)?.code} - ${coas.find((c) => c.id === detail.coa_id)?.name}`
                                    : "COA tidak ditemukan"
                                  : "Pilih Akun"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Cari kode atau nama akun..." />
                                <CommandList>
                                  <CommandEmpty>Akun tidak ditemukan.</CommandEmpty>
                                  <CommandGroup>
                                    {coas.map((coa) => (
                                      <CommandItem
                                        key={coa.id}
                                        value={`${coa.code} ${coa.name}`} // Value gabungan untuk pencarian command
                                        onSelect={() => {
                                          handleDetailChange(index, "coa_id", coa.id);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            detail.coa_id === coa.id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <span className="font-mono mr-2">{coa.code}</span>
                                        {coa.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </td>

                        {/* 2. KETERANGAN BARIS */}
                        <td className="px-4 py-2 align-top">
                          <Input
                            value={detail.memo}
                            onChange={(e) => handleDetailChange(index, "memo", e.target.value)}
                            placeholder="Keterangan opsional per baris"
                            className="p-1 h-9"
                          />
                        </td>

                        {/* 3. INPUT DEBET (Formatted) */}
                        <td className="px-4 py-2 align-top">
                          <Input
                            value={detail.debit > 0 ? formatRupiah(detail.debit) : ""}
                            onChange={(e) =>
                              handleDetailChange(index, "debit", parseNominal(e.target.value))
                            }
                            placeholder="0"
                            className="p-1 h-9 text-right font-mono border-red-200 focus:border-red-500"
                          />
                        </td>

                        {/* 4. INPUT KREDIT (Formatted) */}
                        <td className="px-4 py-2 align-top">
                          <Input
                            value={detail.credit > 0 ? formatRupiah(detail.credit) : ""}
                            onChange={(e) =>
                              handleDetailChange(index, "credit", parseNominal(e.target.value))
                            }
                            placeholder="0"
                            className="p-1 h-9 text-right font-mono border-green-200 focus:border-green-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t font-bold">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-right text-gray-600">
                        TOTAL
                      </td>
                      <td className={cn("px-4 py-3 text-right", isBalanced ? "text-green-600" : "text-red-600")}>
                        {formatRupiah(totalDebit)}
                      </td>
                      <td className={cn("px-4 py-3 text-right", isBalanced ? "text-green-600" : "text-red-600")}>
                        {formatRupiah(totalCredit)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {!isBalanced && (
              <div className="p-3 bg-red-100 text-red-700 rounded text-sm flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4" /> Jurnal Tidak Seimbang!
                </span>
                <span>Selisih: {formatRupiah(Math.abs(totalDebit - totalCredit))}</span>
              </div>
            )}
          </CardContent>

          <CardFooter className="bg-gray-50 p-4 border-t flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setFormState(null);
                setSelectedId(null);
                setSearchQuery("");
              }}
            >
              Batal
            </Button>
            <Button
              onClick={handlePostRevisi}
              disabled={isUpdating || isRevising || !isBalanced}
              className="w-full sm:w-auto bg-primary hover:bg-blue-700"
            >
              {isUpdating || isRevising ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}