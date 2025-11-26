"use client";

import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { CoaKoperasi } from "@/types/koperasi-types/master/coa";

interface CoaChildFormProps {
  form: Partial<CoaKoperasi>;
  setForm: (data: Partial<CoaKoperasi>) => void;
  onCancel: () => void;
  onSubmit: () => void;
  parent: CoaKoperasi | null; // ⬅️ Tambahkan prop Parent
  readonly?: boolean;
  isLoading?: boolean;
}

export default function CoaChildForm({
  form,
  setForm,
  onCancel,
  onSubmit,
  parent, // ⬅️ Ambil prop Parent
  readonly = false,
  isLoading = false,
}: CoaChildFormProps) {
  
  // Effect untuk set coa_id otomatis saat form dibuka
  useEffect(() => {
    if (parent) {
      setForm({
        ...form,
        coa_id: String(parent.id), // ⬅️ Set coa_id (Foreign Key ke Parent)
        // Kita juga bisa memastikan level otomatis terisi jika belum ada
        level: form.level ?? (parent.level ? parent.level + 1 : 1),
        type: form.type ?? parent.type // Warisi type parent (opsional)
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parent]); // Jalankan ketika parent berubah/tersedia

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 w-full max-w-2xl space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          {readonly ? "Detail Sub-COA" : "Tambah Sub-COA"}
        </h2>
        <Button variant="ghost" onClick={onCancel}>
          ✕
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ⬇️ Field Parent (Readonly) */}
        <div className="flex flex-col gap-y-1 sm:col-span-2">
          <Label className="text-muted-foreground">Parent Account (Induk)</Label>
          <Input
            value={parent ? `${parent.code} - ${parent.name}` : "Tidak ada parent"}
            readOnly
            disabled
            className="bg-muted text-muted-foreground font-medium"
          />
        </div>

        <div className="flex flex-col gap-y-1">
          <Label>Kode Sub-Akun</Label>
          <Input
            value={form.code ?? ""}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            readOnly={readonly}
            placeholder="Contoh: 1101.01"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-y-1">
          <Label>Nama Sub-Akun</Label>
          <Input
            value={form.name ?? ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            readOnly={readonly}
            placeholder="Masukkan nama akun"
          />
        </div>

        <div className="flex flex-col gap-y-1 sm:col-span-2">
          <Label>Deskripsi</Label>
          <Textarea
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            readOnly={readonly}
            placeholder="Masukkan deskripsi"
            rows={3}
          />
        </div>

        <div className="flex flex-col gap-y-1">
          <Label>Level</Label>
          <Input
            type="number"
            min={1}
            value={form.level ?? ""}
            readOnly // Level sebaiknya otomatis (readonly) untuk child
            className="bg-muted"
            placeholder="Level otomatis"
          />
        </div>

        <div className="flex flex-col gap-y-1">
          <Label>Tipe</Label>
          <select
            className="border rounded-md px-3 py-2 text-sm bg-white dark:bg-zinc-800"
            value={form.type ?? "Global"}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            disabled={readonly}
          >
            <option value="Global">Global</option>
            <option value="Detail">Detail</option>
          </select>
        </div>
      </div>

      {!readonly && (
        <div className="pt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? "Menyimpan..." : "Simpan Sub-COA"}
          </Button>
        </div>
      )}
    </div>
  );
}