"use client";

import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import useModal from "@/hooks/use-modal";
import { Plus } from "lucide-react"; // ⬅️ 1. Import Icon
import {
  useGetCoaListQuery,
  useCreateCoaMutation,
  useUpdateCoaMutation,
  useDeleteCoaMutation,
  type CreateCoaRequest,
  type UpdateCoaRequest,
} from "@/services/master/coa.service";
import type { CoaKoperasi } from "@/types/koperasi-types/master/coa";
import CoaForm from "@/components/form-modal/koperasi-modal/master/coa-form";
import CoaChildForm from "@/components/form-modal/koperasi-modal/master/coa-child-form";
import { ProdukToolbar } from "@/components/ui/produk-toolbar";
import ActionsGroup from "@/components/admin-components/actions-group";

export default function CoaPage() {
  const [form, setForm] = useState<Partial<CoaKoperasi>>({
    type: "Global",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [readonly, setReadonly] = useState(false);
  
  // ⬇️ 2. Tambahkan state untuk Child Modal
  const [isOpenChild, setIsOpenChild] = useState(false);

  const [selectedParent, setSelectedParent] = useState<CoaKoperasi | null>(null);

  const { isOpen, openModal, closeModal } = useModal();

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");

  const { data, isLoading, refetch } = useGetCoaListQuery({
    page: currentPage,
    paginate: itemsPerPage,
    orderBy: "coas.code",
    order: "asc",
  });

  const list = useMemo(() => data?.data ?? [], [data]);
  const lastPage = useMemo(() => data?.last_page ?? 1, [data]);

  const [createCoa, { isLoading: isCreating }] = useCreateCoaMutation();
  const [updateCoa, { isLoading: isUpdating }] = useUpdateCoaMutation();
  const [deleteCoa] = useDeleteCoaMutation();

  const handleSubmit = async () => {
    try {
      if (!form.code || !form.name) {
        throw new Error("Kode dan Nama wajib diisi");
      }
      if (
        form.level === undefined ||
        form.level === null ||
        Number.isNaN(Number(form.level))
      ) {
        throw new Error("Level wajib diisi");
      }

      const payload: CreateCoaRequest | UpdateCoaRequest = {
        coa_id: form.coa_id,
        code: form.code,
        name: form.name,
        description: form.description ?? "",
        level: Number(form.level),
        type: form.type ?? "Global",
        // parent_id: form.parent_id // ⬅️ Pastikan payload menghandle parent_id jika ada di form child
      };

      if (editingId) {
        await updateCoa({ id: editingId, payload }).unwrap();
        Swal.fire("Sukses", "COA diperbarui", "success");
      } else {
        await createCoa(payload).unwrap();
        Swal.fire("Sukses", "COA ditambahkan", "success");
      }

      setForm({ type: "Global" });
      setEditingId(null);
      await refetch();
      
      // Tutup kedua kemungkinan modal
      closeModal(); 
      setIsOpenChild(false); 

    } catch (error) {
      console.error(error);
      Swal.fire(
        "Gagal",
        (error as Error).message || "Gagal menyimpan data",
        "error"
      );
    }
  };

  const handleEdit = (item: CoaKoperasi) => {
    setForm({ ...item });
    setEditingId(item.id);
    setReadonly(false);
    openModal();
  };

  const handleDetail = (item: CoaKoperasi) => {
    setForm(item);
    setReadonly(true);
    openModal();
  };

  // ⬇️ 3. Handle Add Child Logic
  const handleAddChild = (parent: CoaKoperasi) => {
    setSelectedParent(parent); // ⬅️ Simpan object parent
    setForm({
      // coa_id akan di-handle oleh useEffect di dalam ChildForm
      // level akan di-handle oleh useEffect di dalam ChildForm
    });
    setEditingId(null);
    setReadonly(false);
    setIsOpenChild(true);
  };

  const handleDelete = async (item: CoaKoperasi) => {
    const confirm = await Swal.fire({
      title: "Yakin hapus COA?",
      text: `${item.code} - ${item.name}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteCoa(item.id).unwrap();
        await refetch();
        Swal.fire("Berhasil", "COA dihapus", "success");
      } catch (err) {
        console.error(err);
        Swal.fire("Gagal", "Gagal menghapus COA", "error");
      }
    }
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((it) =>
      [it.code, it.name, it.description ?? "", it.type, String(it.level)].some(
        (f) => f?.toLowerCase?.().includes?.(q)
      )
    );
  }, [list, query]);

  return (
    <div className="p-6 space-y-6">
      <ProdukToolbar
        openModal={() => {
          setForm({ type: "Global" });
          setEditingId(null);
          setReadonly(false);
          openModal();
        }}
        onSearchChange={setQuery}
      />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-2 w-[180px]">Aksi</th> {/* ⬅️ Lebarkan sedikit kolom aksi */}
                <th className="px-4 py-2">Kode</th>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">Deskripsi</th>
                <th className="px-4 py-2">Level</th>
                <th className="px-4 py-2">Tipe</th>
                <th className="px-4 py-2">Dibuat</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center p-4">
                    Memuat data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-4">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-2">
                      {/* ⬇️ 4. Wrapper Flex untuk Button Child */}
                      <div className="flex items-center gap-1">
                        <ActionsGroup
                          handleDetail={() => handleDetail(item)}
                          handleEdit={() => handleEdit(item)}
                          handleDelete={() => handleDelete(item)}
                        />
                        {/* Tombol Add Child */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleAddChild(item)}
                          title="Tambah Anak COA"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-4 py-2 font-mono text-sm">{item.code}</td>
                    <td className="px-4 py-2 font-medium">{item.name}</td>
                    <td className="px-4 py-2 text-gray-600 max-w-xs truncate">
                      {item.description}
                    </td>
                    <td className="px-4 py-2">{item.level}</td>
                    <td className="px-4 py-2">{item.type}</td>
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

      {/* Modal Utama */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <CoaForm
            form={form}
            setForm={setForm}
            onCancel={() => {
              setForm({ type: "Global" });
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

      {/* ⬇️ 5. Modal Child (Logic diperbaiki) */}
      {isOpenChild && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <CoaChildForm
            form={form}
            setForm={setForm}
            parent={selectedParent} // ⬅️ Pass prop parent di sini
            onCancel={() => {
              setForm({ type: "Global" });
              setEditingId(null);
              setReadonly(false);
              setSelectedParent(null); // Reset parent saat close
              setIsOpenChild(false);
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