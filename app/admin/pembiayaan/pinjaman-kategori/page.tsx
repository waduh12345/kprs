"use client";

import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import useModal from "@/hooks/use-modal";
import {
  useGetPinjamanCategoryListQuery,
  useCreatePinjamanCategoryMutation,
  useUpdatePinjamanCategoryMutation,
  useDeletePinjamanCategoryMutation,
} from "@/services/master/pinjaman-category.service";
import {
  CreatePinjamanCategoryRequest,
  PinjamanCategory,
} from "@/types/master/pinjaman-category";
import FormPinjamanCategory from "@/components/form-modal/pinjaman-category-form";
import { Badge } from "@/components/ui/badge";
import { ProdukToolbar } from "@/components/ui/produk-toolbar";
import ActionsGroup from "@/components/admin-components/actions-group";

export default function PinjamanKategoriPage() {
  const [form, setForm] = useState<Partial<PinjamanCategory>>({
    status: 1,
    type: "admin",
    admin_fee: 0,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [readonly, setReadonly] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");

  const { data, isLoading, refetch } = useGetPinjamanCategoryListQuery({
    page: currentPage,
    paginate: itemsPerPage,
  });

  const categoryList = useMemo(() => data?.data || [], [data]);
  const lastPage = useMemo(() => data?.last_page || 1, [data]);

  const [createCategory, { isLoading: isCreating }] =
    useCreatePinjamanCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdatePinjamanCategoryMutation();
  const [deleteCategory] = useDeletePinjamanCategoryMutation();

  const handleSubmit = async () => {
    try {
      const payload: CreatePinjamanCategoryRequest = {
        code: form.code || "",
        name: form.name || "",
        description: form.description || "",
        type:
          form.type === "admin" || form.type === "admin+margin"
            ? form.type
            : "admin",
        admin_fee: form.admin_fee !== undefined ? form.admin_fee : 0,
        status: form.status !== undefined ? form.status : 1,
        margin: 0,
      };

      // Only include margin field if type is 'admin+margin'
      if (form.type === "admin+margin") {
        payload.margin = form.margin !== undefined ? form.margin : 0;
      }

      if (editingId) {
        await updateCategory({ id: editingId, payload }).unwrap();
        Swal.fire("Sukses", "Kategori pinjaman diperbarui", "success");
      } else {
        await createCategory(payload).unwrap();
        Swal.fire("Sukses", "Kategori pinjaman ditambahkan", "success");
      }

      setForm({ status: 1, type: "admin", admin_fee: 0 });
      setEditingId(null);
      await refetch();
      closeModal();
    } catch (error) {
      console.error(error);
      Swal.fire("Gagal", "Gagal menyimpan data", "error");
    }
  };

  const handleEdit = (item: PinjamanCategory) => {
    setForm({ ...item });
    setEditingId(item.id);
    setReadonly(false);
    openModal();
  };

  const handleDetail = (item: PinjamanCategory) => {
    setForm(item);
    setReadonly(true);
    openModal();
  };

  const handleDelete = async (item: PinjamanCategory) => {
    const confirm = await Swal.fire({
      title: "Yakin hapus kategori pinjaman?",
      text: item.name,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteCategory(item.id).unwrap();
        await refetch();
        Swal.fire("Berhasil", "Kategori pinjaman dihapus", "success");
      } catch (error) {
        Swal.fire("Gagal", "Gagal menghapus kategori pinjaman", "error");
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
        item.type.toLowerCase().includes(query.toLowerCase()) ||
        item.admin_fee.toString().includes(query) ||
        item.margin.toString().includes(query)
    );
  }, [categoryList, query]);

  return (
    <div className="p-6 space-y-6">
      <ProdukToolbar openModal={openModal} onSearchChange={setQuery} />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-2">Aksi</th>
                <th className="px-4 py-2">Kode</th>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">Tipe</th>
                <th className="px-4 py-2">Biaya Admin</th>
                <th className="px-4 py-2">Margin</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Dibuat</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center p-4">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-4">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-2">
                      <ActionsGroup
                        handleDetail={() => handleDetail(item)}
                        handleEdit={() => handleEdit(item)}
                        handleDelete={() => handleDelete(item)}
                      />
                    </td>
                    <td className="px-4 py-2 font-mono text-sm">{item.code}</td>
                    <td className="px-4 py-2 font-medium">{item.name}</td>
                    <td className="px-4 py-2">
                      <Badge
                        variant={
                          item.type === "admin" ? "default" : "secondary"
                        }
                      >
                        {item.type === "admin"
                          ? "Biaya Admin"
                          : "Margin + Biaya Admin"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 font-medium">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(item.admin_fee)}
                    </td>
                    <td className="px-4 py-2 font-medium">
                      {item.type === "admin+margin" ? `${item.margin}%` : "-"}
                    </td>
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
          <FormPinjamanCategory
            form={form}
            setForm={setForm}
            onCancel={() => {
              setForm({ status: 1, type: "admin", admin_fee: 0 });
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
