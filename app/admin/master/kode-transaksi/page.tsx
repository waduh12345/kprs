"use client";

import { useEffect, useMemo, useState, Fragment } from "react";
import Swal from "sweetalert2";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProdukToolbar } from "@/components/ui/produk-toolbar";
import ActionsGroup from "@/components/admin-components/actions-group";
import { ChevronDown, ChevronUp, Loader2, Inbox } from "lucide-react";

import {
  useGetKodeTransaksiListQuery,
  useGetKodeTransaksiByIdQuery,
  useCreateKodeTransaksiMutation,
  useUpdateKodeTransaksiMutation,
  useDeleteKodeTransaksiMutation,
  type KodeTransaksi,
} from "@/services/admin/kode-transaksi.service";

import FormKodeTransaksi, {
  FormKodeTransaksiState,
} from "@/components/form-modal/kode-transaksi-form";
import { displayDate } from "@/lib/format-utils";

// --- SUB-COMPONENT: DETAIL ROW (Lazy Load) ---
const DetailRow = ({ id, colSpan }: { id: number; colSpan: number }) => {
  const { data: response, isLoading } = useGetKodeTransaksiByIdQuery(id);
  const detail = response;

  if (isLoading) {
    return (
      <tr className="bg-muted/30">
        <td colSpan={colSpan} className="px-6 py-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            Memuat rincian...
          </div>
        </td>
      </tr>
    );
  }

  if (!detail) return null;

  return (
    <tr className="bg-muted/20">
      <td colSpan={colSpan} className="px-6 py-4 align-top">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
          <div className="rounded-lg border bg-background p-4 shadow-sm">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Posisi Debet
            </h4>
            {detail.debits && detail.debits.length > 0 ? (
              <ul className="space-y-2.5">
                {detail.debits.map((item) => (
                  <li key={item.id} className="flex flex-col gap-0.5">
                    <span className="font-mono text-sm font-medium text-blue-600">
                      {item.coa?.code}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {item.coa?.name}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Tidak ada data
              </p>
            )}
          </div>
          <div className="rounded-lg border bg-background p-4 shadow-sm">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Posisi Kredit
            </h4>
            {detail.credits && detail.credits.length > 0 ? (
              <ul className="space-y-2.5">
                {detail.credits.map((item) => (
                  <li key={item.id} className="flex flex-col gap-0.5">
                    <span className="font-mono text-sm font-medium text-emerald-600">
                      {item.coa?.code}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {item.coa?.name}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Tidak ada data
              </p>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};

// --- MAIN COMPONENT ---
export default function KodeTransaksiPage() {
  const [filters, setFilters] = useState({ search: "", status: "all" });
  const [currentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null); // State expand

  const { data, isLoading, refetch } = useGetKodeTransaksiListQuery({
    page: currentPage,
    paginate: 10,
  });

  const [createKodeTransaksi, { isLoading: isCreating }] =
    useCreateKodeTransaksiMutation();
  const [updateKodeTransaksi, { isLoading: isUpdating }] =
    useUpdateKodeTransaksiMutation();
  const [deleteKodeTransaksi] = useDeleteKodeTransaksiMutation();

  // modal state
  const [openForm, setOpenForm] = useState(false);
  const [selected, setSelected] = useState<KodeTransaksi | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // fetch detail hanya ketika edit form dibuka
  const { data: selectedData } = useGetKodeTransaksiByIdQuery(selectedId!, {
    skip: !selectedId || !openForm, // Skip jika form tidak terbuka atau ID null
  });

  // sinkronkan form saat data detail loaded (mode edit)
  const [form, setForm] = useState<FormKodeTransaksiState>({
    code: "",
    module: "",
    description: "",
    status: 1,
    debits: [{ coa_id: 0, order: 1 }],
    credits: [{ coa_id: 0, order: 1 }],
  });

  useEffect(() => {
    if (selectedData && openForm && selected) {
      const detail = selectedData;
      setForm({
        code: detail.code,
        module: detail.module,
        description: detail.description,
        status: detail.status,
        debits: detail.debits?.map((d, i) => ({
          coa_id: d.coa_id,
          order: d.order ?? i + 1,
        })) ?? [{ coa_id: 0, order: 1 }],
        credits: detail.credits?.map((c, i) => ({
          coa_id: c.coa_id,
          order: c.order ?? i + 1,
        })) ?? [{ coa_id: 0, order: 1 }],
      });
    }
  }, [selectedData, openForm, selected]);

  const filtered = useMemo(() => {
    const list = data?.data ?? [];
    const q = filters.search.trim().toLowerCase();
    return list.filter((item) => {
      const matchSearch =
        !q ||
        item.code.toLowerCase().includes(q) ||
        item.module.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      const matchStatus =
        filters.status === "all" || String(item.status) === filters.status;
      return matchSearch && matchStatus;
    });
  }, [data?.data, filters]);

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return (
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 border-0">
            Active
          </Badge>
        );
      case 0:
        return (
          <Badge variant="secondary" className="bg-red-500/10 text-red-700 border-0">
            Inactive
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-muted text-muted-foreground border-0">
            Unknown
          </Badge>
        );
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleCreate = () => {
    setSelected(null);
    setSelectedId(null);
    setForm({
      code: "",
      module: "",
      description: "",
      status: 1,
      debits: [{ coa_id: 0, order: 1 }],
      credits: [{ coa_id: 0, order: 1 }],
    });
    setOpenForm(true);
  };

  const handleEdit = (item: KodeTransaksi) => {
    setSelected(item);
    setSelectedId(item.id);
    setOpenForm(true);
  };

  const handleDelete = async (id: number) => {
    const res = await Swal.fire({
      title: "Apakah Anda yakin?",
      text: "Data yang dihapus tidak dapat dikembalikan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });
    if (!res.isConfirmed) return;
    try {
      await deleteKodeTransaksi(id).unwrap();
      await refetch();
      Swal.fire("Berhasil!", "Data berhasil dihapus.", "success");
    } catch {
      Swal.fire("Error!", "Gagal menghapus data.", "error");
    }
  };

  const submit = async () => {
    try {
      if (selected) {
        await updateKodeTransaksi({ id: selected.id, data: form }).unwrap();
        Swal.fire("Berhasil!", "Data berhasil diperbarui.", "success");
      } else {
        await createKodeTransaksi(form).unwrap();
        Swal.fire("Berhasil!", "Data berhasil ditambahkan.", "success");
      }
      setOpenForm(false);
      setSelected(null);
      setSelectedId(null);
      await refetch();
    } catch {
      Swal.fire("Error!", "Gagal menyimpan data.", "error");
    }
  };

  const lastPage = data?.last_page ?? 1;

  return (
    <div className="p-6 space-y-6">
      <ProdukToolbar
        addButtonLabel="Tambah Kode Transaksi"
        openModal={handleCreate}
        onSearchChange={(search: string) =>
          setFilters((s) => ({ ...s, search }))
        }
        enableStatusFilter
        statusOptions={[
          { value: "all", label: "Semua Status" },
          { value: "1", label: "Active" },
          { value: "0", label: "Inactive" },
        ]}
        initialStatus={filters.status}
        onStatusChange={(status: string) =>
          setFilters((s) => ({ ...s, status }))
        }
      />

      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="w-12 px-4 py-3.5 text-center" aria-label="Expand" />
                  <th className="px-5 py-3.5 text-left font-medium text-muted-foreground w-[100px]">
                    Aksi
                  </th>
                  <th className="px-5 py-3.5 text-left font-medium text-muted-foreground min-w-[100px]">
                    Kode
                  </th>
                  <th className="px-5 py-3.5 text-left font-medium text-muted-foreground min-w-[120px]">
                    Module
                  </th>
                  <th className="px-5 py-3.5 text-left font-medium text-muted-foreground min-w-[180px]">
                    Deskripsi
                  </th>
                  <th className="px-5 py-3.5 text-left font-medium text-muted-foreground w-[100px]">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-left font-medium text-muted-foreground w-[100px]">
                    Dibuat
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="text-sm">Memuat data...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Inbox className="h-12 w-12 opacity-40" />
                        <span className="text-sm font-medium">Tidak ada data</span>
                        <span className="text-xs">Ubah filter atau tambah kode transaksi baru.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <Fragment key={item.id}>
                      <tr
                        className={
                          expandedId === item.id
                            ? "border-b bg-muted/20 transition-colors"
                            : "border-b border-border/50 transition-colors hover:bg-muted/30"
                        }
                      >
                        <td className="px-4 py-3.5 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                            onClick={() => toggleExpand(item.id)}
                            aria-expanded={expandedId === item.id}
                            aria-label={expandedId === item.id ? "Tutup rincian" : "Lihat rincian"}
                          >
                            {expandedId === item.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                        <td className="px-5 py-3.5">
                          <ActionsGroup
                            handleEdit={() => handleEdit(item)}
                            handleDelete={() => handleDelete(item.id)}
                          />
                        </td>
                        <td className="px-5 py-3.5 font-mono font-medium text-foreground">
                          {item.code}
                        </td>
                        <td className="px-5 py-3.5 text-foreground">
                          {item.module}
                        </td>
                        <td className="px-5 py-3.5 max-w-[240px] truncate text-muted-foreground" title={item.description}>
                          {item.description || "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">
                          {displayDate(item.created_at)}
                        </td>
                      </tr>
                      {expandedId === item.id && (
                        <DetailRow id={item.id} colSpan={7} />
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
        <div className="flex items-center justify-between border-t bg-muted/20 px-5 py-3">
          <p className="text-sm text-muted-foreground">
            Halaman <span className="font-medium text-foreground">{currentPage}</span> dari{" "}
            <span className="font-medium text-foreground">{lastPage}</span>
            {filtered.length > 0 && (
              <span className="ml-2">
                · Menampilkan <span className="font-medium text-foreground">{filtered.length}</span> baris
              </span>
            )}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Sebelumnya
            </Button>
            <Button variant="outline" size="sm" disabled>
              Berikutnya
            </Button>
          </div>
        </div>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog
        open={openForm}
        onOpenChange={(o) => {
          if (!o) {
            setOpenForm(false);
            setSelected(null);
            setSelectedId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[1200px] w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selected ? "Edit Kode Transaksi" : "Tambah Kode Transaksi"}
            </DialogTitle>
          </DialogHeader>

          <FormKodeTransaksi
            form={form}
            setForm={setForm}
            onCancel={() => {
              setOpenForm(false);
              setSelected(null);
              setSelectedId(null);
            }}
            onSubmit={submit}
            isLoading={isCreating || isUpdating}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}