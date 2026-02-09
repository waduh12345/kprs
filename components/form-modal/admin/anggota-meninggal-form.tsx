"use client";

import * as React from "react";
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
import type { MeninggalCreatePayload } from "@/types/admin/anggota-meninggal";
import { Combobox } from "@/components/ui/combo-box";

type Mode = "create" | "edit";

type AnggotaLite = {
  id: number;
  name: string;
  email: string;
};

type Props = {
  mode: Mode;
  initial: MeninggalCreatePayload;
  anggotaOptions: AnggotaLite[];
  isAnggotaLoading?: boolean;
  /** Jika false, field status disabled (default Pending saat create, nilai saat edit) */
  statusEditable?: boolean;
  onAnggotaSearch?: (q: string) => void;
  onSubmit: (payload: MeninggalCreatePayload) => Promise<void> | void;
  onCancel: () => void;
};

export default function AnggotaMeninggalForm({
  mode,
  initial,
  anggotaOptions,
  isAnggotaLoading,
  statusEditable = false,
  onAnggotaSearch,
  onSubmit,
  onCancel,
}: Props) {
  const [form, setForm] =
    React.useState<MeninggalCreatePayload>(initial);

  React.useEffect(() => {
    setForm(initial);
  }, [initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="anggota_id" className="text-sm font-medium">Anggota</Label>
        <Combobox<AnggotaLite>
          value={form.anggota_id || null}
          onChange={(val) => setForm((s) => ({ ...s, anggota_id: val }))}
          onSearchChange={onAnggotaSearch}
          data={anggotaOptions}
          isLoading={isAnggotaLoading}
          placeholder="Ketik nama atau email, pilih anggota"
          getOptionLabel={(item) => `${item.name}${item.email ? ` (${item.email})` : ""}`}
          buttonClassName="w-full bg-background"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="deceased_at" className="text-sm font-medium">Tanggal Meninggal</Label>
        <Input
          id="deceased_at"
          type="date"
          value={form.deceased_at}
          onChange={(e) =>
            setForm((s) => ({ ...s, deceased_at: e.target.value }))
          }
          required
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">Deskripsi</Label>
        <Input
          id="description"
          value={form.description ?? ""}
          onChange={(e) =>
            setForm((s) => ({ ...s, description: e.target.value }))
          }
          placeholder="Deskripsi (opsional)"
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status" className="text-sm font-medium">Status</Label>
        <Select
          value={String(form.status ?? 0)}
          onValueChange={(v) => setForm((s) => ({ ...s, status: Number(v) as 0 | 1 | 2 }))}
        >
          <SelectTrigger className="w-full" disabled={!statusEditable}>
            <SelectValue placeholder="Pilih status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Pending</SelectItem>
            <SelectItem value="1">Approved</SelectItem>
            <SelectItem value="2">Rejected</SelectItem>
          </SelectContent>
        </Select>
        {!statusEditable && (
          <p className="text-xs text-muted-foreground">
            Status diubah melalui aksi &quot;Ubah status&quot; di tabel.
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">{mode === "create" ? "Tambah" : "Simpan"}</Button>
      </div>
    </form>
  );
}