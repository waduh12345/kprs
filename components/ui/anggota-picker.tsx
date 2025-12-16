'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandEmpty,
} from "@/components/ui/command";
import { Anggota, DEBOUNCE_MS, MIN_CHARS } from "../form-modal/pinjaman-form";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGetAnggotaListQuery } from "@/services/koperasi-service/anggota.service";
import { Button } from "./button";
import { ChevronDown, Loader2, Users2 } from "lucide-react";

export function AnggotaPicker({
  selectedId,
  onChange,
  disabled,
}: {
  selectedId: number | null;
  onChange: (u: Anggota | null) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  // 🔧 FIX: kalau ada selectedId, tetap fetch utk prefill meski belum mengetik
  const shouldFetch = debouncedQuery.length >= MIN_CHARS || selectedId != null;

  const { data, isLoading, isError, refetch } = useGetAnggotaListQuery(
    { page: 1, paginate: 200, status: 1, search: debouncedQuery } as {
      page: number;
      paginate: number;
      status?: number;
      search?: string;
    },
    { skip: !shouldFetch, refetchOnMountOrArgChange: true }
  );

  const list: Anggota[] = useMemo(
    () => ((data?.data ?? []) as Anggota[]) || [],
    [data]
  );

  const filtered: Anggota[] = useMemo(() => {
    if (debouncedQuery.length < MIN_CHARS) return list; // saat sudah open & fetch, tampilkan semua dulu
    const q = debouncedQuery.toLowerCase();
    return list.filter(
      (u) =>
        (u.user_name ?? "").toLowerCase().includes(q) ||
        (u.user_email ?? "").toLowerCase().includes(q) ||
        String(u.user_id).includes(q)
    );
  }, [list, debouncedQuery]);

  const selected = useMemo(
    () => list.find((u) => u.user_id === selectedId) || null,
    [list, selectedId]
  );

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [open]);

  const placeholder =
    debouncedQuery.length < MIN_CHARS
      ? `Ketik minimal ${MIN_CHARS} karakter…`
      : isLoading
      ? "Memuat…"
      : "Ketik untuk cari anggota…";

  const pick = (u: Anggota | null) => {
    onChange(u);
    setOpen(false);
    setQuery(u ? u.user_name ?? u.user_email ?? String(u.id) : "");
  };

  // 🔧 FIX: fallback label supaya kelihatan saat edit sebelum data resolved
  const selectedLabel = selected
    ? (selected.user_name ?? "Tanpa Nama") +
      (selected.user_email ? ` (${selected.user_email})` : "")
    : selectedId != null
    ? `ID: ${selectedId}`
    : null;

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full h-12 justify-between rounded-2xl border-neutral-200 bg-white px-3 shadow-sm hover:bg-neutral-50"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="flex items-center gap-2 truncate text-left">
              {isLoading && !selected ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                  <span className="text-neutral-500">{placeholder}</span>
                </>
              ) : selectedLabel ? (
                <span className="truncate">{selectedLabel}</span>
              ) : (
                <>
                  <Users2 className="h-4 w-4 text-neutral-400" />
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
              <div className="mb-2 text-red-600">Gagal memuat anggota.</div>
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
                  placeholder={`Cari nama/email (min ${MIN_CHARS} karakter)…`}
                />
              </div>

              <CommandList className="max-h-72">
                <div className="px-3 py-2 text-xs text-neutral-500">
                  {debouncedQuery.length < MIN_CHARS && query === ""
                    ? `${list.length} hasil`
                    : isLoading
                    ? "Memuat…"
                    : `${filtered.length} hasil`}
                </div>

                {list.length === 0 && !isLoading ? (
                  <CommandEmpty>Tidak ada hasil.</CommandEmpty>
                ) : (
                  <>
                    <CommandGroup heading="Anggota Aktif">
                      {(debouncedQuery.length < MIN_CHARS && query === ""
                        ? list
                        : filtered
                      ).map((u) => (
                        <CommandItem
                          key={u.user_id}
                          value={u.user_name ?? String(u.user_id)}
                          onSelect={() => pick(u)}
                          className="cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {u.user_name ?? "Tanpa Nama"}
                            </span>
                            <span className="text-xs text-neutral-500">
                              {u.user_email ?? "-"} • ID: {u.user_id}
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
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
