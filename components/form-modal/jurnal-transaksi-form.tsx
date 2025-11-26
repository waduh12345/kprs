// components/form-modal/journal-form.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  CommandSeparator,
} from "@/components/ui/command";
import { ChevronDown, Loader2, Layers, Plus, Minus } from "lucide-react";
import { useGetCOAListQuery } from "@/services/admin/kode-transaksi.service";
import type { CreateJournalRequest } from "@/services/admin/journal.service";
import {
  formatRupiah,
  parseRupiah,
  formatRupiahWithRp,
} from "@/lib/format-utils";

/* ========= COA Picker (min 3 huruf, debounce, full width, tampil saat edit) ========= */
type CoaLite = {
  id: number;
  code: string;
  name: string;
  level: number;
  type: string;
};

const MIN_CHARS = 3;
const DEBOUNCE_MS = 350;

function COAPicker({
  selectedId,
  onChange,
  disabled,
  label,
}: {
  selectedId: number | null;
  onChange: (coa: CoaLite | null) => void;
  disabled?: boolean;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  // fetch kalau sudah 3 huruf ATAU sedang edit (ada selectedId)
  const shouldFetch = debounced.length >= MIN_CHARS || selectedId !== null;
  const { data, isLoading, isError, refetch } = useGetCOAListQuery(
    { page: 1, paginate: 500, orderBy: "coas.code", order: "asc" },
    { skip: !shouldFetch, refetchOnMountOrArgChange: true }
  );

  const list: CoaLite[] = useMemo(() => {
    if (!shouldFetch) return [];
    return (data?.data ?? []).map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      level: c.level,
      type: c.type,
    }));
  }, [data?.data, shouldFetch]);

  const filtered = useMemo(() => {
    if (!shouldFetch) return [];
    const q = debounced.toLowerCase();
    return list.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        String(c.id).includes(q)
    );
  }, [list, debounced, shouldFetch]);

  const selected = useMemo(
    () => list.find((c) => c.id === selectedId) ?? null,
    [list, selectedId]
  );

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [open]);

  const placeholder = !shouldFetch
    ? `Ketik minimal ${MIN_CHARS} karakter…`
    : isLoading
    ? "Memuat…"
    : `${filtered.length} hasil`;

  const pick = (c: CoaLite | null) => {
    onChange(c);
    setOpen(false);
    setQuery(c ? `${c.code} — ${c.name}` : "");
  };

  return (
    <div className="w-full">
      <Label className="mb-1 block">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full h-10 justify-between rounded-xl border-neutral-200 bg-white px-3 shadow-sm hover:bg-neutral-50"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="flex items-center gap-2 truncate text-left">
              {isLoading && shouldFetch ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                  <span className="text-neutral-500">Memuat COA…</span>
                </>
              ) : selected ? (
                <span className="truncate">
                  {selected.code} — {selected.name}
                </span>
              ) : selectedId !== null && !isLoading ? (
                <span className="text-neutral-500">ID: {selectedId}</span>
              ) : (
                <>
                  <Layers className="h-4 w-4 text-neutral-400" />
                  <span className="text-neutral-500">{placeholder}</span>
                </>
              )}
            </span>
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl shadow-xl"
          align="start"
          side="bottom"
        >
          {isError ? (
            <div className="p-3 text-sm">
              <div className="mb-2 text-red-600">Gagal memuat COA.</div>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Coba lagi
              </Button>
            </div>
          ) : (
            <Command shouldFilter={false}>
              <div className="p-2">
                <CommandInput
                  ref={inputRef}
                  value={query}
                  onValueChange={setQuery}
                  placeholder={`Cari kode/nama COA (min ${MIN_CHARS} karakter)…`}
                />
              </div>

              <CommandList className="max-h-72">
                <div className="px-3 py-2 text-xs text-neutral-500">
                  {placeholder}
                </div>

                {!shouldFetch ? (
                  <div className="px-3 pb-3 text-sm text-neutral-600">
                    Ketik minimal <b>{MIN_CHARS}</b> huruf untuk mulai mencari.
                  </div>
                ) : (
                  <>
                    <CommandEmpty>Tidak ada hasil.</CommandEmpty>

                    {!isLoading && (
                      <>
                        <CommandGroup heading="Daftar COA">
                          {filtered.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={c.code}
                              onSelect={() => pick(c)}
                              className="cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {c.code} — {c.name}
                                </span>
                                <span className="text-xs text-neutral-500">
                                  ID: {c.id} • Level: {c.level} • {c.type}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>

                        <CommandSeparator />
                        <CommandGroup>
                          <CommandItem value="none" onSelect={() => pick(null)}>
                            Kosongkan pilihan
                          </CommandItem>
                        </CommandGroup>
                      </>
                    )}
                  </>
                )}
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

/* ================= JOURNAL FORM ================= */
export type FormState = CreateJournalRequest;

interface Props {
  form: FormState;
  setForm: (next: FormState) => void;
  onCancel: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
  readonly?: boolean;
}

export default function JournalForm({
  form,
  setForm,
  onCancel,
  onSubmit,
  isLoading = false,
  readonly = false,
}: Props) {
  const setField = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm({ ...form, [key]: val });

  const addDetail = () =>
    setForm({
      ...form,
      details: [
        ...form.details,
        { coa_id: 0, type: "debit", debit: 0, credit: 0, memo: "" },
      ],
    });

  const removeDetail = (idx: number) => {
    if (form.details.length <= 1) return;
    setForm({ ...form, details: form.details.filter((_, i) => i !== idx) });
  };

  const patchDetail = (
    idx: number,
    patch: Partial<FormState["details"][number]>
  ) => {
    const next = [...form.details];
    next[idx] = { ...next[idx], ...patch };
    setForm({ ...form, details: next });
  };

  // totals
  const totalDebit = useMemo(
    () => form.details.reduce((s, d) => s + (Number(d.debit) || 0), 0),
    [form.details]
  );
  const totalCredit = useMemo(
    () => form.details.reduce((s, d) => s + (Number(d.credit) || 0), 0),
    [form.details]
  );
  const balanced = totalDebit === totalCredit;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-6 p-1"
    >
      {/* === Baris Tanggal • Status • Deskripsi === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Tanggal</Label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setField("date", e.target.value)}
            readOnly={readonly}
            required
          />
        </div>

        <div>
          <Label>Status</Label>
          <Select
            value={String(form.is_posted)}
            onValueChange={(v) => setField("is_posted", Number(v))}
            disabled={readonly}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Draft</SelectItem>
              <SelectItem value="1">Posted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Deskripsi</Label>
          <Input
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            readOnly={readonly}
            placeholder="Masukkan deskripsi jurnal"
            required
          />
        </div>
      </div>

      {/* === Ringkasan Nominal (Total Debit/Kredit) === */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className={`rounded-lg border p-4 ${
            balanced
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <div className="text-sm text-gray-600">Total Debit</div>
          <div
            className={`text-2xl font-bold ${
              balanced ? "text-green-700" : "text-red-700"
            }`}
          >
            {formatRupiahWithRp(totalDebit)}
          </div>
        </div>
        <div
          className={`rounded-lg border p-4 ${
            balanced
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <div className="text-sm text-gray-600">Total Kredit</div>
          <div
            className={`text-2xl font-bold ${
              balanced ? "text-green-700" : "text-red-700"
            }`}
          >
            {formatRupiahWithRp(totalCredit)}
          </div>
        </div>
      </div>

      {/* === Detail Jurnal === */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Detail Jurnal</h3>
            {!readonly && (
              <Button
                type="button"
                onClick={addDetail}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Tambah Detail
              </Button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {form.details.map((detail, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Detail #{index + 1}
                </span>
                {!readonly && form.details.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDetail(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {/* COA full width */}
                <div className="md:col-span-2">
                  <COAPicker
                    label="COA"
                    selectedId={detail.coa_id ? Number(detail.coa_id) : null}
                    onChange={(c) => patchDetail(index, { coa_id: c?.id ?? 0 })}
                    disabled={readonly}
                  />
                </div>

                <div>
                  <Label>Tipe</Label>
                  <Select
                    value={detail.type}
                    onValueChange={(v: "debit" | "credit") => {
                      if (v === "debit")
                        patchDetail(index, { type: v, credit: 0 });
                      else patchDetail(index, { type: v, debit: 0 });
                    }}
                    disabled={readonly}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debit">Debit</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {detail.type === "debit" ? (
                  <div>
                    <Label>Debit</Label>
                    <Input
                      inputMode="numeric"
                      value={formatRupiah(detail.debit || 0)}
                      onChange={(e) => {
                        const num = parseRupiah(e.target.value);
                        patchDetail(index, { debit: num, credit: 0 });
                      }}
                      placeholder="0"
                      readOnly={readonly}
                    />
                  </div>
                ) : (
                  <div>
                    <Label>Credit</Label>
                    <Input
                      inputMode="numeric"
                      value={formatRupiah(detail.credit || 0)}
                      onChange={(e) => {
                        const num = parseRupiah(e.target.value);
                        patchDetail(index, { credit: num, debit: 0 });
                      }}
                      placeholder="0"
                      readOnly={readonly}
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <Label>Memo</Label>
                  <Input
                    value={detail.memo}
                    onChange={(e) =>
                      patchDetail(index, { memo: e.target.value })
                    }
                    placeholder="Catatan tambahan"
                    readOnly={readonly}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!readonly && (
        <div className="pt-2 flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      )}
    </form>
  );
}