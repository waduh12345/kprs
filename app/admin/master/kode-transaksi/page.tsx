"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { ProdukToolbar } from "@/components/ui/produk-toolbar";
import ActionsGroup from "@/components/admin-components/actions-group";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react"; // Import Icons

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
      <tr className="bg-gray-50/50">
        <td colSpan={colSpan} className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat rincian...
          </div>
        </td>
      </tr>
    );
  }

  if (!detail) return null;

  return (
    <tr className="bg-gray-50 border-b shadow-inner">
      <td colSpan={colSpan} className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-10 pr-4">
          {/* Kolom Debet */}
          <div className="border rounded-md bg-white p-3">
            <h4 className="font-semibold text-sm mb-2 text-gray-700 border-b pb-1">
              Posisi Debet
            </h4>
            {detail.debits && detail.debits.length > 0 ? (
              <ul className="space-y-2">
                {detail.debits.map((item) => (
                  <li key={item.id} className="text-sm flex flex-col">
                    <span className="font-mono font-medium text-blue-600">
                      {item.coa?.code}
                    </span>
                    <span className="text-gray-600">{item.coa?.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400 italic">Tidak ada data</p>
            )}
          </div>

          {/* Kolom Kredit */}
          <div className="border rounded-md bg-white p-3">
            <h4 className="font-semibold text-sm mb-2 text-gray-700 border-b pb-1">
              Posisi Kredit
            </h4>
            {detail.credits && detail.credits.length > 0 ? (
              <ul className="space-y-2">
                {detail.credits.map((item) => (
                  <li key={item.id} className="text-sm flex flex-col">
                    <span className="font-mono font-medium text-green-600">
                      {item.coa?.code}
                    </span>
                    <span className="text-gray-600">{item.coa?.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400 italic">Tidak ada data</p>
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
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 0:
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
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

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 w-[50px]"></th> {/* Kolom Panah */}
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Kode
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Module
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Deskripsi
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                    Dibuat
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">
                      <div className="animate-pulse flex justify-center gap-2">
                        <Loader2 className="animate-spin h-5 w-5 text-gray-400" />
                        Loading...
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    // Fragment digunakan karena kita me-render dua <tr> per item
                    <tbody
                      key={item.id}
                      className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <tr>
                        <td className="px-4 py-4 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500"
                            onClick={() => toggleExpand(item.id)}
                          >
                            {expandedId === item.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <ActionsGroup
                            handleEdit={() => handleEdit(item)}
                            handleDelete={() => handleDelete(item.id)}
                            // handleDetail tidak diperlukan lagi di tombol karena sudah ada expand row
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {item.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {item.module}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {item.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {new Date(item.created_at).toLocaleDateString(
                            "id-ID"
                          )}
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {expandedId === item.id && (
                        <DetailRow id={item.id} colSpan={7} />
                      )}
                    </tbody>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Halaman <b>{currentPage}</b> dari <b>{lastPage}</b>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Sebelumnya
          </Button>
          <Button variant="outline" size="sm" disabled>
            Berikutnya
          </Button>
        </div>
      </div>

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