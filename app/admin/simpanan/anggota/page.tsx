"use client";

import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import useModal from "@/hooks/use-modal";
import {
  useGetWalletListQuery,
  useCreateSimpananMutation,
  useUpdateWalletMutation,
  useDeleteWalletMutation,
} from "@/services/admin/penarikan-simpanan.service";
import { InputSimpanan } from "@/types/admin/simpanan/input-simpanan";
import FormSimpanan from "@/components/form-modal/simpanan-form";
import { useGetSimpananCategoryListQuery } from "@/services/master/simpanan-category.service";
// <-- pake hook users (pastikan named export ada di file service)
import { useGetUsersListQuery } from "@/services/koperasi-service/users-management.service";
import { Combobox } from "@/components/ui/combo-box";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { SerializedError } from "@reduxjs/toolkit";
import { Filter, Plus } from "lucide-react";
import { formatRupiahWithRp } from "@/lib/format-utils";

/** Payload type to send to /wallet (create) */
type CreateSimpananPayload = {
  user_id: number;
  reference_type: string; // "App\\Models\\Master\\SimpananCategory"
  reference_id: number;
};

type AnggotaItem = { id: number; name?: string; email?: string };

function extractMessageFromFetchBaseQueryError(
  fbq: FetchBaseQueryError
): string {
  if (typeof fbq.data === "string") return fbq.data;

  if (typeof fbq.data === "object" && fbq.data !== null) {
    const d = fbq.data as Record<string, unknown>;
    if ("message" in d && typeof d.message === "string") return d.message;
    if ("errors" in d) {
      const errors = d.errors;
      if (typeof errors === "object" && errors !== null) {
        try {
          return JSON.stringify(errors);
        } catch {}
      }
    }
    try {
      return JSON.stringify(d);
    } catch {
      return String(d);
    }
  }

  if (fbq.status) return `Error ${String(fbq.status)}`;
  return "Terjadi kesalahan";
}

export default function SimpananAnggotaPage() {
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // wallet list
  const { data, isLoading, isFetching, refetch } = useGetWalletListQuery({
    page: currentPage,
    paginate: itemsPerPage,
  });

  // categories for reference_id selection
  const categoriesQuery = useGetSimpananCategoryListQuery({
    page: 1,
    paginate: 100,
  });
  const categories = categoriesQuery.data?.data ?? [];

  // --- USE USERS HOOK ---
  // IMPORTANT: jangan kirim `status` karena typing hook saat ini tidak mendukungnya.
  // Jika backend memang membutuhkan status, update definisi hook di service (type + url).
  const {
    data: usersResp,
    isLoading: usersLoading,
    isFetching: usersFetching,
  } = useGetUsersListQuery({
    page: 1,
    paginate: 100,
    // optional: search / search_by jika perlu
    // search: "",
    // search_by: "name",
  });

  // bentuk response: { code, data: { data: Users[], last_page, ... } }
  // ambil array Users di usersResp?.data.data
  const anggotaList: AnggotaItem[] = usersResp?.data?.data ?? [];

  const simpananList: InputSimpanan[] = useMemo(
    () => (data?.data ?? []) as InputSimpanan[],
    [data]
  );
  const lastPage = data?.last_page ?? 1;

  // modal form state
  const { isOpen, openModal, closeModal } = useModal();
  const [form, setForm] = useState<Partial<InputSimpanan>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [readonly, setReadonly] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // filters: search + anggota filter (by user_id)
  const [q, setQ] = useState("");
  const [filterAnggotaId, setFilterAnggotaId] = useState<number | null>(null);

  // mutations
  const [createSimpanan, { isLoading: creating }] = useCreateSimpananMutation();
  const [updateSimpanan, { isLoading: updating }] = useUpdateWalletMutation();
  const [deleteSimpanan] = useDeleteWalletMutation();

  // open modal to create
  const handleOpenCreate = () => {
    setForm({});
    setEditingId(null);
    setReadonly(false);
    openModal();
  };

  const handleEdit = (id: number) => {
    const item = simpananList.find((s) => s.id === id);
    if (!item) return;
    setForm({ ...item });
    setEditingId(id);
    setReadonly(false);
    openModal();
  };

  const handleDetail = (id: number) => {
    const item = simpananList.find((s) => s.id === id);
    if (!item) return;
    setForm({ ...item });
    setReadonly(true);
    setEditingId(id);
    openModal();
  };

  const handleDelete = async (id: number) => {
    const confirm = await Swal.fire({
      title: "Yakin hapus simpanan?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
    });
    if (!confirm.isConfirmed) return;
    try {
      await deleteSimpanan(id).unwrap();
      await refetch();
      void Swal.fire("Berhasil", "Simpanan dihapus", "success");
    } catch (err: unknown) {
      console.error(err);
      if (isFetchBaseQueryError(err)) {
        const fbq = err;
        const messageToShow = extractMessageFromFetchBaseQueryError(fbq);
        void Swal.fire("Gagal", messageToShow, "error");
      } else if (isSerializedError(err)) {
        void Swal.fire(
          "Gagal",
          (err as SerializedError).message ?? "Error",
          "error"
        );
      } else {
        void Swal.fire("Gagal", String(err), "error");
      }
    }
  };

  // helper type guards for RTK Query errors
  function isFetchBaseQueryError(err: unknown): err is FetchBaseQueryError {
    return typeof err === "object" && err !== null && "status" in err;
  }
  function isSerializedError(err: unknown): err is SerializedError {
    return typeof err === "object" && err !== null && "message" in err;
  }

  const handleSubmit = async () => {
    try {
      // validate create: user_id + reference_id required
      if (!editingId) {
        if (!form.user_id) {
          void Swal.fire("Error", "Pilih anggota terlebih dahulu", "error");
          return;
        }
        if (!form.reference_id) {
          void Swal.fire(
            "Error",
            "Pilih kategori (reference) terlebih dahulu",
            "error"
          );
          return;
        }

        const payload: CreateSimpananPayload = {
          user_id: Number(form.user_id),
          reference_type: "App\\Models\\Master\\SimpananCategory",
          reference_id: Number(form.reference_id),
        };

        // PRE-CHECK (client-side) : apakah wallet sudah ada untuk user+reference?
        const alreadyExists = simpananList.some(
          (w) =>
            Number(w.user_id) === payload.user_id &&
            String(w.reference_type) === payload.reference_type &&
            Number(w.reference_id) === payload.reference_id
        );
        if (alreadyExists) {
          void Swal.fire(
            "Gagal",
            "Wallet sudah ada untuk anggota dan kategori yang dipilih.",
            "error"
          );
          return;
        }

        // send create
        await createSimpanan(payload).unwrap();
        void Swal.fire("Sukses", "Simpanan berhasil dibuat", "success");
      } else {
        // Update fields allowed: name, account_number, description
        const updatePayload: Partial<InputSimpanan> = {};
        if (typeof form.name !== "undefined") updatePayload.name = form.name;
        if (typeof form.description !== "undefined")
          updatePayload.description = form.description;
        if (typeof form.account_number !== "undefined")
          updatePayload.account_number = form.account_number;

        await updateSimpanan({
          id: editingId,
          payload: updatePayload,
        }).unwrap();
        void Swal.fire("Sukses", "Simpanan berhasil diperbarui", "success");
      }

      setForm({});
      setEditingId(null);
      closeModal();
      await refetch();
    } catch (err: unknown) {
      console.error(err);
      if (isFetchBaseQueryError(err)) {
        const fbq = err;
        const messageToShow = extractMessageFromFetchBaseQueryError(fbq);
        void Swal.fire("Gagal", messageToShow, "error");
      } else if (isSerializedError(err)) {
        void Swal.fire(
          "Gagal",
          (err as SerializedError).message ?? "Error",
          "error"
        );
      } else {
        void Swal.fire("Gagal", String(err), "error");
      }
    }
  };

  const formatCurrency = (amount: number) =>
    amount == null ? "-" : formatRupiahWithRp(amount);

  // client-side filters: search by user name/email + anggota filter by user_id
  const simpanansFiltered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return simpananList.filter((item) => {
      if (filterAnggotaId && item.user_id !== filterAnggotaId) return false;
      if (!qq) return true;
      const name = item.user?.name?.toLowerCase() ?? "";
      const email = item.user?.email?.toLowerCase() ?? "";
      return name.includes(qq) || email.includes(qq);
    });
  }, [simpananList, q, filterAnggotaId]);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="w-full md:w-1/2">
              {/* search */}
              <input
                type="text"
                placeholder="Cari anggota: ketik nama atau email (min 2 huruf)"
                className="h-10 w-full rounded-md border border-gray-300 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search anggota"
              />
            </div>

            <div className="flex gap-2 items-center w-full md:w-auto">
              {/* anggota filter combobox */}
              <div className="w-full md:w-[260px]">
                <Combobox<AnggotaItem>
                  value={filterAnggotaId}
                  onChange={(v) => setFilterAnggotaId(v)}
                  onSearchChange={(s: string) => {
                    /* optional: implement server-side anggota search */
                  }}
                  data={anggotaList}
                  isLoading={usersLoading || usersFetching}
                  placeholder="Filter anggota (opsional)"
                  getOptionLabel={(item: AnggotaItem) =>
                    `${item.name ?? "User"} (${item.email ?? "-"})`
                  }
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleOpenCreate} className="h-10">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Simpanan
                </Button>
                <Button
                  variant="destructive"
                  className="h-10"
                  onClick={() => {
                    setQ("");
                    setFilterAnggotaId(null);
                    setCurrentPage(1);
                    void refetch();
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-2">Aksi</th>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">No Rekening</th>
                <th className="px-4 py-2">Reference</th>
                <th className="px-4 py-2">Anggota</th>
                <th className="px-4 py-2">Balance</th>
                <th className="px-4 py-2">Dibuat</th>
              </tr>
            </thead>
            <tbody>
              {isLoading || isFetching ? (
                <tr>
                  <td colSpan={7} className="text-center p-4">
                    Memuat data...
                  </td>
                </tr>
              ) : simpanansFiltered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-4">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                simpanansFiltered.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleDetail(item.id)}>
                          Detail
                        </Button>
                        <Button size="sm" onClick={() => handleEdit(item.id)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                    <td className="px-4 py-2 font-medium">{item.name}</td>
                    <td className="px-4 py-2">{item.account_number}</td>
                    <td className="px-4 py-2">
                      <div className="font-medium">{item.reference?.name}</div>
                      <div className="text-xs text-gray-500">
                        {item.reference?.code}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-medium">
                        {item.user?.name ?? `User ID: ${item.user_id}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.user?.email ?? "-"}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {formatCurrency(item.balance ?? 0)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString("id-ID")
                        : "-"}
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

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <FormSimpanan
            form={form}
            setForm={setForm}
            onCancel={() => {
              setForm({});
              setEditingId(null);
              setReadonly(false);
              closeModal();
            }}
            onSubmit={handleSubmit}
            readonly={readonly}
            isLoading={creating || updating}
            categories={categories}
            showAllCategories={showAllCategories}
            setShowAllCategories={setShowAllCategories}
            anggota={anggotaList}
            anggotaLoading={usersLoading || usersFetching}
          />
        </div>
      )}
    </div>
  );
}