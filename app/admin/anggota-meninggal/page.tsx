"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProdukToolbar } from "@/components/ui/produk-toolbar";
import {
  useGetMeninggalListQuery,
  useCreateMeninggalMutation,
  useUpdateMeninggalMutation,
  useDeleteMeninggalMutation,
  useValidateMeninggalStatusMutation,
} from "@/services/admin/anggota-meninggal.service";
import type {
  MeninggalItem,
  MeninggalCreatePayload,
  MeninggalUpdatePayload,
  MeninggalStatus,
} from "@/types/admin/anggota-meninggal";
import { useGetAnggotaListQuery } from "@/services/koperasi-service/anggota.service";
import type { AnggotaKoperasi } from "@/types/koperasi-types/anggota";
import Swal from "sweetalert2";
import ActionsGroup from "@/components/admin-components/actions-group";
import AnggotaMeninggalForm from "@/components/form-modal/admin/anggota-meninggal-form";
import { displayDate } from "@/lib/format-utils";

export default function AnggotaMeninggalPage() {
  // State management
  type Filters = { search: string; status: "all" | "0" | "1" | "2" };

  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [statusModalItem, setStatusModalItem] = useState<MeninggalItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<MeninggalItem | null>(null);
  const [formData, setFormData] = useState<MeninggalCreatePayload>({
    anggota_id: 0,
    deceased_at: "",
    description: "",
    status: 0,
  });

  // ====== Tambahkan state untuk pencarian anggota (min 2 char) ======
  const [anggotaSearch, setAnggotaSearch] = useState<string>("");

  // API calls
  const { data: meninggalData, isLoading, refetch: refetchMeninggal } = useGetMeninggalListQuery({
    page: 1,
    paginate: 100,
    ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
    ...(filters.status !== "all"
      ? { status: Number(filters.status) as MeninggalStatus }
      : {}),
  });

  const { data: anggotaData, isLoading: isLoadingAnggota } =
    useGetAnggotaListQuery({
      page: 1,
      paginate: 100,
    });

  // Mutations
  const [createMeninggal] = useCreateMeninggalMutation();
  const [updateMeninggal] = useUpdateMeninggalMutation();
  const [deleteMeninggal] = useDeleteMeninggalMutation();
  const [validateMeninggalStatus] = useValidateMeninggalStatusMutation();

  // Data processing
  const meninggalList = useMemo(
    () => meninggalData?.data ?? [],
    [meninggalData?.data]
  );

  // Normalisasi list anggota sesuai AnggotaKoperasi (user_name, user_email)
  const anggotaList = useMemo(
    () =>
      (anggotaData?.data ?? []).map((a: AnggotaKoperasi) => ({
        id: a.id,
        name: a.user_name ?? a.name ?? "",
        email: a.user_email ?? a.email ?? "",
      })),
    [anggotaData?.data]
  );

  // Filter lokal untuk combobox (aktif saat query >= 2 huruf)
  const anggotaFiltered = useMemo(() => {
    const q = anggotaSearch.trim().toLowerCase();
    if (q.length < 2) return anggotaList;
    return anggotaList.filter(
      (a) =>
        a.name?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        String(a.id).includes(q)
    );
  }, [anggotaSearch, anggotaList]);

  // Filter data table (search/status sudah di API via MeninggalListParams; tampilkan list dari API)
  const filteredData = useMemo(() => meninggalList, [meninggalList]);

  const getStatusBadge = (status: number) => {
    if (status === 1) return <Badge variant="success">Approved</Badge>;
    if (status === 2) return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  function FieldLabel({ label, value }: { label: string; value?: string | null }) {
    return (
      <div>
        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
        <p className="mt-1 text-sm text-foreground">{value ?? "—"}</p>
      </div>
    );
  }

  // Event handlers
  const handleCreate = () => {
    setFormData({ anggota_id: 0, deceased_at: "", description: "", status: 0 });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (item: MeninggalItem) => {
    setSelectedItem(item);
    setFormData({
      anggota_id: item.anggota_id,
      deceased_at: item.deceased_at?.split("T")[0] ?? "",
      description: item.description ?? "",
      status: item.status,
    });
    setIsEditModalOpen(true);
  };

  const handleDetail = (item: MeninggalItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Apakah Anda yakin?",
      text: "Data anggota meninggal akan dihapus secara permanen!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        await deleteMeninggal(id).unwrap();
        await refetchMeninggal();
        Swal.fire(
          "Berhasil!",
          "Data anggota meninggal telah dihapus.",
          "success"
        );
      } catch {
        Swal.fire("Error!", "Gagal menghapus data.", "error");
      }
    }
  };

  const handleStatusUpdate = async (id: number, status: 1 | 2) => {
    try {
      await validateMeninggalStatus({ id, status }).unwrap();
      await refetchMeninggal();
      setStatusModalItem(null);
      Swal.fire("Berhasil!", "Status telah diperbarui.", "success");
    } catch {
      Swal.fire("Error!", "Gagal memperbarui status.", "error");
    }
  };

  const submitCreate = async (payload: MeninggalCreatePayload) => {
    await createMeninggal(payload).unwrap();
    await refetchMeninggal();
    Swal.fire(
      "Berhasil!",
      "Data anggota meninggal telah ditambahkan.",
      "success"
    );
    setIsCreateModalOpen(false);
    setFormData({ anggota_id: 0, deceased_at: "", description: "", status: 0 });
  };

  const submitEdit = async (payload: MeninggalCreatePayload) => {
    if (!selectedItem) return;
    const updatePayload: MeninggalUpdatePayload = {
      anggota_id: payload.anggota_id,
      deceased_at: payload.deceased_at,
      description: payload.description ?? null,
      status: (payload.status ?? 0) as MeninggalStatus,
    };
    await updateMeninggal({ id: selectedItem.id, payload: updatePayload }).unwrap();
    await refetchMeninggal();
    Swal.fire(
      "Berhasil!",
      "Data anggota meninggal telah diperbarui.",
      "success"
    );
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Anggota Meninggal
        </h1>
      </div>

      <ProdukToolbar
        addButtonLabel="Tambah Anggota Meninggal"
        openModal={handleCreate}
        onSearchChange={(search: string) =>
          setFilters((s) => ({ ...s, search }))
        }
        enableStatusFilter
        statusOptions={[
          { value: "all", label: "Semua Status" },
          { value: "0", label: "Pending" },
          { value: "1", label: "Approved" },
          { value: "2", label: "Rejected" },
        ]}
        initialStatus={filters.status}
        onStatusChange={(status: string) =>
          setFilters((s) => ({
            ...s,
            status:
              status === "0" || status === "1" || status === "2"
                ? (status as Filters["status"])
                : "all",
          }))
        }
      />

      <Card className="overflow-hidden border border-gray-200/80 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Aksi</th>
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Telepon</th>
                  <th className="px-4 py-3 font-medium">NIK</th>
                  <th className="px-4 py-3 font-medium">Tanggal Meninggal</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      Memuat data...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      Tidak ada data anggota meninggal.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="border-t border-gray-100 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <ActionsGroup
                          handleDetail={() => handleDetail(item)}
                          handleEdit={() => handleEdit(item)}
                          handleDelete={() => handleDelete(item.id)}
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium">
                        {item.anggota_name ?? "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {item.anggota_email ?? "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {item.anggota_phone ?? "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">
                        {item.anggota_nik ?? "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {displayDate(item.deceased_at) || "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(item.status)}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => setStatusModalItem(item)}
                          >
                            Ubah status
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          if (!open) setIsCreateModalOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Anggota Meninggal</DialogTitle>
            <DialogDescription>
              Pilih anggota dan isi tanggal serta keterangan meninggal.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
          <AnggotaMeninggalForm
            mode="create"
            initial={formData}
            anggotaOptions={anggotaFiltered}
            isAnggotaLoading={isLoadingAnggota}
            statusEditable={false}
            onAnggotaSearch={(q) => setAnggotaSearch(q)}
            onSubmit={async (payload) => {
              try {
                await submitCreate(payload);
              } catch {
                Swal.fire("Error!", "Gagal menyimpan data.", "error");
              }
            }}
            onCancel={() => setIsCreateModalOpen(false)}
          />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={isEditModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsEditModalOpen(false);
            setSelectedItem(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Anggota Meninggal</DialogTitle>
            <DialogDescription>
              Ubah tanggal meninggal, deskripsi, atau status.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
          <AnggotaMeninggalForm
            mode="edit"
            initial={formData}
            anggotaOptions={anggotaFiltered}
            isAnggotaLoading={isLoadingAnggota}
            statusEditable={false}
            onAnggotaSearch={(q) => setAnggotaSearch(q)}
            onSubmit={async (payload) => {
              try {
                await submitEdit(payload);
              } catch {
                Swal.fire("Error!", "Gagal menyimpan data.", "error");
              }
            }}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedItem(null);
            }}
          />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Ubah Status */}
      <Dialog
        open={statusModalItem !== null}
        onOpenChange={(open) => !open && setStatusModalItem(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ubah Status</DialogTitle>
            <DialogDescription>
              {statusModalItem && (
                <>
                  Anggota: <strong>{statusModalItem.anggota_name ?? "—"}</strong>. Pilih status baru.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {statusModalItem && (
            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center border-green-200 bg-green-50 hover:bg-green-100 text-green-800"
                onClick={() => handleStatusUpdate(statusModalItem.id, 1)}
              >
                Setujui (Approved)
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center border-red-200 bg-red-50 hover:bg-red-100 text-red-800"
                onClick={() => handleStatusUpdate(statusModalItem.id, 2)}
              >
                Tolak (Rejected)
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStatusModalItem(null)}
              >
                Batal
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Anggota Meninggal</DialogTitle>
            <DialogDescription>
              Informasi lengkap data anggota yang tercatat meninggal.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="mt-2 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldLabel label="Nama" value={selectedItem.anggota_name} />
                <FieldLabel label="Email" value={selectedItem.anggota_email} />
                <FieldLabel label="Telepon" value={selectedItem.anggota_phone} />
                <FieldLabel label="NIK" value={selectedItem.anggota_nik} />
                <FieldLabel
                  label="Tanggal Meninggal"
                  value={displayDate(selectedItem.deceased_at) || "—"}
                />
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
                </div>
              </div>
              {selectedItem.description && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Deskripsi</Label>
                  <p className="mt-1 text-sm text-foreground">{selectedItem.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}