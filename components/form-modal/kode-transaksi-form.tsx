"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
  ChevronDown,
  Loader2,
  Layers,
  Plus,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COA,
  CreateKodeTransaksiRequest,
  useGetCOAListQuery,
} from "@/services/admin/kode-transaksi.service";
import { cn } from "@/lib/utils";

/** ===== COA Picker ===== */
type CoaLite = Pick<COA, "id" | "code" | "name" | "level" | "type">;

const MIN_CHARS = 3;
const DEBOUNCE_MS = 350;

function COAPicker({
  selectedId,
  onChange,
  disabled,
  placeholderText = "Pilih Akun COA",
}: {
  selectedId: number | null;
  onChange: (coa: CoaLite | null) => void;
  disabled?: boolean;
  placeholderText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const shouldFetch = debounced.length >= MIN_CHARS || selectedId !== null;

  const { data, isLoading, isError, refetch } = useGetCOAListQuery(
    { page: 1, paginate: 500 },
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

  const filtered: CoaLite[] = useMemo(() => {
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

  const statusText = !shouldFetch
    ? `Ketik min ${MIN_CHARS} huruf...`
    : isLoading
    ? "Memuat..."
    : `${filtered.length} ditemukan`;

  const pick = (c: CoaLite | null) => {
    onChange(c);
    setOpen(false);
    if (c) setQuery(`${c.code} ${c.name}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-between px-3 text-left font-normal bg-white h-10",
            !selected && "text-muted-foreground"
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {isLoading && shouldFetch && !selected ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : selected ? (
              <span className="truncate font-medium flex items-center">
                <span className="font-mono text-xs mr-2 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                  {selected.code}
                </span>
                {selected.name}
              </span>
            ) : (
              <>
                <Layers className="h-4 w-4 text-muted-foreground/70" />
                <span>{placeholderText}</span>
              </>
            )}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[350px] p-0 shadow-xl rounded-lg"
        align="start"
      >
        {isError ? (
          <div className="p-4 text-center text-sm space-y-2">
            <p className="text-red-600">Gagal memuat data.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Coba lagi
            </Button>
          </div>
        ) : (
          <Command shouldFilter={false} className="max-h-[300px]">
            <CommandInput
              ref={inputRef}
              value={query}
              onValueChange={setQuery}
              placeholder="Cari kode atau nama akun..."
              className="border-none focus:ring-0"
            />
            <CommandList>
              <div className="px-3 py-2 text-xs text-muted-foreground border-b bg-slate-50">
                {statusText}
              </div>

              {!shouldFetch ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Mulai ketik untuk mencari...
                </div>
              ) : (
                <>
                  <CommandEmpty>Tidak ada hasil ditemukan.</CommandEmpty>
                  {!isLoading && (
                    <CommandGroup>
                      {filtered.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.code}
                          onSelect={() => pick(c)}
                          className="cursor-pointer py-2"
                        >
                          <div className="flex flex-col w-full">
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="font-semibold text-sm font-mono text-slate-800">
                                {c.code}
                              </span>
                              <span className="text-[10px] uppercase text-muted-foreground border px-1 rounded bg-slate-50">
                                {c.type}
                              </span>
                            </div>
                            <span className="text-sm text-slate-600 truncate">
                              {c.name}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** ===== Form Kode Transaksi ===== */
export type FormKodeTransaksiState = CreateKodeTransaksiRequest;

interface Props {
  form: FormKodeTransaksiState;
  setForm: (next: FormKodeTransaksiState) => void;
  onCancel: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
  readonly?: boolean;
}

export default function FormKodeTransaksi({
  form,
  setForm,
  onCancel,
  onSubmit,
  isLoading = false,
  readonly = false,
}: Props) {
  const onChangeField =
    <K extends keyof FormKodeTransaksiState>(key: K) =>
    (val: FormKodeTransaksiState[K]) =>
      setForm({ ...form, [key]: val });

  // --- Logic Debit ---
  const updateDebit = (
    idx: number,
    patch: Partial<typeof form.debits[number]>
  ) => {
    const next = [...form.debits];
    next[idx] = { ...next[idx], ...patch };
    setForm({ ...form, debits: next });
  };
  const addDebit = () =>
    setForm({
      ...form,
      debits: [...form.debits, { coa_id: 0, order: form.debits.length + 1 }],
    });
  const removeDebit = (idx: number) => {
    if (form.debits.length <= 1) return;
    setForm({ ...form, debits: form.debits.filter((_, i) => i !== idx) });
  };

  // --- Logic Credit ---
  const updateCredit = (
    idx: number,
    patch: Partial<typeof form.credits[number]>
  ) => {
    const next = [...form.credits];
    next[idx] = { ...next[idx], ...patch };
    setForm({ ...form, credits: next });
  };
  const addCredit = () =>
    setForm({
      ...form,
      credits: [...form.credits, { coa_id: 0, order: form.credits.length + 1 }],
    });
  const removeCredit = (idx: number) => {
    if (form.credits.length <= 1) return;
    setForm({ ...form, credits: form.credits.filter((_, i) => i !== idx) });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* --- SECTION 1: HEADER INFO --- */}
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Layers className="h-5 w-5 text-slate-500" />
            <h3 className="text-base font-semibold text-slate-800">
              Informasi Umum
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-3">
              <Label className="mb-2 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Kode Transaksi
              </Label>
              <Input
                value={form.code}
                onChange={(e) => onChangeField("code")(e.target.value)}
                readOnly={readonly}
                placeholder="Contoh: SP_POKOK_IN"
                className="font-mono text-sm uppercase bg-slate-50 border-slate-200 focus:bg-white transition-colors"
              />
            </div>

            <div className="md:col-span-3">
              <Label className="mb-2 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Module
              </Label>
              <Input
                value={form.module}
                onChange={(e) => onChangeField("module")(e.target.value)}
                readOnly={readonly}
                placeholder="Contoh: Simpanan"
                className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
              />
            </div>

             <div className="md:col-span-2">
              <Label className="mb-2 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status
              </Label>
              <Select
                value={String(form.status)}
                onValueChange={(v) => onChangeField("status")(Number(v))}
                disabled={readonly}
              >
                <SelectTrigger className="w-full bg-slate-50 border-slate-200 focus:bg-white transition-colors">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="0">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-4">
              <Label className="mb-2 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Deskripsi
              </Label>
              <Input
                value={form.description}
                onChange={(e) => onChangeField("description")(e.target.value)}
                readOnly={readonly}
                placeholder="Deskripsi transaksi..."
                className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        {/* --- SECTION 2: JURNAL CONFIG (SPLIT VIEW) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LEFT: DEBITS */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between bg-blue-50/80 p-3 rounded-lg border border-blue-100 shadow-sm">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                 <div className="bg-white p-1.5 rounded-md shadow-sm border border-blue-100">
                    <ArrowDownLeft className="h-4 w-4 text-blue-600" />
                 </div>
                 <span>POSISI DEBET</span>
              </div>
              {!readonly && (
                <Button 
                  type="button" 
                  size="sm" 
                  variant="ghost" 
                  onClick={addDebit}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 h-8 text-xs font-medium"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Tambah Akun
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {form.debits.map((d, i) => (
                <div
                  key={i}
                  className="group relative bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
                >
                  <div className="grid grid-cols-[1fr,80px] gap-4 items-start">
                    <div>
                      <Label className="text-[10px] uppercase text-slate-400 font-bold mb-1.5 block">
                        Akun COA
                      </Label>
                      <COAPicker
                        selectedId={d.coa_id ? Number(d.coa_id) : null}
                        onChange={(c) => updateDebit(i, { coa_id: c?.id ?? 0 })}
                        disabled={readonly}
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase text-slate-400 font-bold mb-1.5 block">
                        Urutan
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={d.order}
                        onChange={(e) =>
                          updateDebit(i, { order: Number(e.target.value) })
                        }
                        readOnly={readonly}
                        className="text-center font-mono"
                      />
                    </div>
                  </div>
                  
                  {/* Delete Button (Absolute for neatness) */}
                  {!readonly && form.debits.length > 1 && (
                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100 duration-200">
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-7 w-7 rounded-full shadow-md border-2 border-white"
                            onClick={() => removeDebit(i)}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: CREDITS */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between bg-green-50/80 p-3 rounded-lg border border-green-100 shadow-sm">
              <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
                 <div className="bg-white p-1.5 rounded-md shadow-sm border border-green-100">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                 </div>
                 <span>POSISI KREDIT</span>
              </div>
              {!readonly && (
                <Button 
                  type="button" 
                  size="sm" 
                  variant="ghost" 
                  onClick={addCredit}
                  className="text-green-600 hover:text-green-700 hover:bg-green-100 h-8 text-xs font-medium"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Tambah Akun
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {form.credits.map((c, i) => (
                <div
                  key={i}
                  className="group relative bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-green-300 hover:shadow-md"
                >
                  <div className="grid grid-cols-[1fr,80px] gap-4 items-start">
                    <div>
                      <Label className="text-[10px] uppercase text-slate-400 font-bold mb-1.5 block">
                        Akun COA
                      </Label>
                      <COAPicker
                        selectedId={c.coa_id ? Number(c.coa_id) : null}
                        onChange={(sel) => updateCredit(i, { coa_id: sel?.id ?? 0 })}
                        disabled={readonly}
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase text-slate-400 font-bold mb-1.5 block">
                        Urutan
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={c.order}
                        onChange={(e) =>
                          updateCredit(i, { order: Number(e.target.value) })
                        }
                        readOnly={readonly}
                        className="text-center font-mono"
                      />
                    </div>
                  </div>

                   {/* Delete Button */}
                   {!readonly && form.credits.length > 1 && (
                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100 duration-200">
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-7 w-7 rounded-full shadow-md border-2 border-white"
                            onClick={() => removeCredit(i)}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
        </div>

      </div>

      {/* --- FOOTER ACTION --- */}
      {!readonly && (
        <div className="p-5 border-t bg-white flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} className="w-24 border-slate-300">
            Batal
          </Button>
          <Button onClick={onSubmit} disabled={isLoading} className="w-36 bg-indigo-600 hover:bg-indigo-700">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Data
          </Button>
        </div>
      )}
    </div>
  );
}