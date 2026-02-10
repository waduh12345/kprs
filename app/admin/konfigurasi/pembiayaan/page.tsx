"use client";

import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import useModal from "@/hooks/use-modal";
import {
  useGetPembiayaanListQuery,
  useCreatePembiayaanMutation,
  useUpdatePembiayaanMutation,
  useDeletePembiayaanMutation,
} from "@/services/admin/konfigurasi/pembiayaan.service";
import { Pembiayaan } from "@/types/admin/konfigurasi/pembiayaan";
import FormPembiayaan from "@/components/form-modal/admin/konfigurasi/pembiayaan-form";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import ActionsGroup from "@/components/admin-components/actions-group";
import { Plus } from "lucide-react";

export default function PinjamanKategoriPage() {
  const [form, setForm] = useState<Partial<Pembiayaan>>({
    status: 1,
    admin_fee: 0,
    margin: 0,
    interest_rate: 0,
    interest_calculation_method: "anuitas",
    late_interest_type: "percent",
    late_interest_value: 0,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [readonly, setReadonly] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");

  const { data, isLoading, refetch } = useGetPembiayaanListQuery({
    page: currentPage,
    paginate: itemsPerPage,
  });

  const categoryList = useMemo(() => data?.data || [], [data]);
  const lastPage = useMemo(() => data?.last_page || 1, [data]);

  const [create, { isLoading: isCreating }] =
    useCreatePembiayaanMutation();
  const [update, { isLoading: isUpdating }] =
    useUpdatePembiayaanMutation();
  const [deletePembiayaan] = useDeletePembiayaanMutation();

  const handleSubmit = async () => {
    try {
      const payload = {
        type: form.type || "",
        code: form.code || "",
        name: form.name || "",
        description: form.description || "",
        interest_rate: form.interest_rate !== undefined ? form.interest_rate : 0,
        admin_fee: form.admin_fee !== undefined ? form.admin_fee : 0,
        margin: form.margin !== undefined ? form.margin : 0,
        interest_calculation_method: form.interest_calculation_method || "anuitas",
        late_interest_type: form.late_interest_type ?? "percent",
        late_interest_value: form.late_interest_value !== undefined ? form.late_interest_value : 0,
        status: form.status !== undefined ? form.status : 1,
      };

      if (editingId) {
        await update({ id: editingId, payload }).unwrap();
        Swal.fire("Sukses", "Produk Pinjaman diperbarui", "success");
      } else {
        await create(payload).unwrap();
        Swal.fire("Sukses", "Produk Pinjaman ditambahkan", "success");
      }

      setForm({
        status: 1,
        admin_fee: 0,
        interest_calculation_method: "anuitas",
        late_interest_type: "percent",
        late_interest_value: 0,
      });
      setEditingId(null);
      await refetch();
      closeModal();
    } catch (error) {
      console.error(error);
      Swal.fire("Gagal", "Gagal menyimpan data", "error");
    }
  };

  const handleEdit = (item: Pembiayaan) => {
    setForm({ ...item });
    setEditingId(item.id);
    setReadonly(false);
    openModal();
  };

  const handleDetail = (item: Pembiayaan) => {
    setForm(item);
    setReadonly(true);
    openModal();
  };

  const handleDelete = async (item: Pembiayaan) => {
    const confirm = await Swal.fire({
      title: "Yakin hapus produk pembiayaan?",
      text: item.name,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
    });

    if (confirm.isConfirmed) {
      try {
        await deletePembiayaan(item.id).unwrap();
        await refetch();
        Swal.fire("Berhasil", "Produk Pinjaman dihapus", "success");
      } catch (error) {
        Swal.fire("Gagal", "Gagal menghapus Produk Pinjaman", "error");
        console.error(error);
      }
    }
  };

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!query) return categoryList;
    return categoryList.filter(
      (item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.code.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.admin_fee.toString().includes(query)
    );
  }, [categoryList, query]);

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-md bg-white p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Kiri: filter */}
          <div className="w-full flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Cari produk pembiayaan..."
              value={query}
              onChange={(e) => {
                const q = e.target.value;
                setQuery(q);
              }}
              className="w-full sm:max-w-xs"
            />
          </div>

          {/* Kanan: aksi */}
          <div className="shrink-0 flex flex-wrap items-center gap-2">
            {/* Tambah data (opsional) */}
            {openModal && <Button onClick={openModal}><Plus /> Produk Pinjaman</Button>}
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-2">Aksi</th>
                <th className="px-4 py-2">Kode</th>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">Admin Fee</th>
                <th className="px-4 py-2">Bunga</th>
                <th className="px-4 py-2">Metode Bunga</th>
                <th className="px-4 py-2">Tipe Denda</th>
                <th className="px-4 py-2">Nilai Denda</th>
                <th className="px-4 py-2">Margin</th>
                <th className="px-4 py-2">Deskripsi</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Dibuat</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="text-center p-4">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center p-4">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <ActionsGroup
                          handleDetail={() => handleDetail(item)}
                          handleEdit={() => handleEdit(item)}
                          handleDelete={() => handleDelete(item)}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2 font-mono text-sm">{item.code}</td>
                    <td className="px-4 py-2 font-medium">{item.name}</td>
                    <td className="px-4 py-2 font-medium">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(item.admin_fee)}
                    </td>
                    <td className="px-4 py-2 font-medium">{item.interest_rate}</td>
                    <td className="px-4 py-2">
                      <Badge variant="secondary" className="capitalize">
                        {item.interest_calculation_method || "anuitas"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-muted-foreground text-xs capitalize">
                        {item.late_interest_type === "fixed" ? "Nominal (Rp)" : "Persen (%)"}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-medium">
                      {item.late_interest_type === "fixed"
                        ? new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0,
                          }).format(item.late_interest_value ?? 0)
                        : `${item.late_interest_value ?? 0}%`}
                    </td>
                    <td className="px-4 py-2 font-medium">{item.margin}</td>
                    <td className="px-4 py-2 text-gray-600 max-w-xs truncate">
                      {item.description}
                    </td>
                    <td className="px-4 py-2">
                      <Badge
                        variant={item.status === 1 ? "success" : "destructive"}
                      >
                        {item.status === 1 ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleDateString("id-ID")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>

        <div className="p-4 flex items-center justify-between bg-muted">
          <div className="text-sm">
            Halaman <strong>{currentPage}</strong> dari{" "}
            <strong>{lastPage}</strong>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              disabled={currentPage >= lastPage}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </Card>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <FormPembiayaan
            form={form}
            setForm={setForm}
            onCancel={() => {
              setForm({
                status: 1,
                admin_fee: 0,
                interest_calculation_method: "anuitas",
                late_interest_type: "percent",
                late_interest_value: 0,
              });
              setEditingId(null);
              setReadonly(false);
              closeModal();
            }}
            onSubmit={handleSubmit}
            readonly={readonly}
            isLoading={isCreating || isUpdating}
          />
        </div>
      )}
    </div>
  );
}
