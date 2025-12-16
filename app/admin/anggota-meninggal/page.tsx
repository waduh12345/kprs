"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProdukToolbar } from "@/components/ui/produk-toolbar";
import {
  useGetAnggotaMeninggalListQuery,
  useCreateAnggotaMeninggalMutation,
  useUpdateAnggotaMeninggalMutation,
  useDeleteAnggotaMeninggalMutation,
  useUpdateAnggotaMeninggalStatusMutation,
  type AnggotaMeninggal,
  type CreateAnggotaMeninggalRequest,
} from "@/services/admin/anggota-meninggal.service";
import { useGetAnggotaListQuery } from "@/services/koperasi-service/anggota.service";
import { CheckCircle, XCircle } from "lucide-react";
import Swal from "sweetalert2";
import ActionsGroup from "@/components/admin-components/actions-group";
import AnggotaMeninggalForm from "@/components/form-modal/admin/anggota-meninggal-form";

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
  const [selectedItem, setSelectedItem] = useState<AnggotaMeninggal | null>(
    null
  );
  const [formData, setFormData] = useState<CreateAnggotaMeninggalRequest>({
    anggota_id: 0,
    deceased_at: "",
    description: "",
    status: 0,
  });

  // ====== Tambahkan state untuk pencarian anggota (min 2 char) ======
  const [anggotaSearch, setAnggotaSearch] = useState<string>("");

  // API calls
  const { data: anggotaMeninggalData, isLoading } =
    useGetAnggotaMeninggalListQuery({
      page: 1,
      paginate: 100,
    });

  const { data: anggotaData, isLoading: isLoadingAnggota } =
    useGetAnggotaListQuery({
      page: 1,
      paginate: 100,
    });

  // Mutations
  const [createAnggotaMeninggal] = useCreateAnggotaMeninggalMutation();
  const [updateAnggotaMeninggal] = useUpdateAnggotaMeninggalMutation();
  const [deleteAnggotaMeninggal] = useDeleteAnggotaMeninggalMutation();
  const [updateStatus] = useUpdateAnggotaMeninggalStatusMutation();

  // Data processing
  const anggotaMeninggalList = useMemo(
    () => anggotaMeninggalData?.data || [],
    [anggotaMeninggalData?.data]
  );

  // Normalisasi list anggota (hanya field yang dibutuhkan combobox)
  const anggotaList = useMemo(
    () =>
      (anggotaData?.data || []).map((a) => ({
        id: a.id,
        name: a.name ?? "",
        email: a.email ?? "",
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

  // Filter data table
  const filteredData = useMemo(() => {
    let filtered = anggotaMeninggalList;

    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter(
        (item) => String(item.status) === filters.status
      );
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.anggota_name?.toLowerCase().includes(q) ||
          item.anggota_email?.toLowerCase().includes(q) ||
          item.anggota_phone?.toLowerCase().includes(q) ||
          item.anggota_nik?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [anggotaMeninggalList, filters.status, filters.search]);

  // Helper functions
  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
      case 1:
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        );
      case 2:
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Event handlers
  const handleCreate = () => {
    setFormData({ anggota_id: 0, deceased_at: "", description: "", status: 0 });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (item: AnggotaMeninggal) => {
    setSelectedItem(item);
    setFormData({
      anggota_id: item.anggota_id,
      deceased_at: item.deceased_at.split("T")[0],
      description: item.description || "",
      status: item.status,
    });
    setIsEditModalOpen(true);
  };

  const handleDetail = (item: AnggotaMeninggal) => {
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
        await deleteAnggotaMeninggal(id).unwrap();
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

  const handleStatusUpdate = async (id: number, status: number) => {
    try {
      await updateStatus({ id, status }).unwrap();
      Swal.fire("Berhasil!", "Status telah diperbarui.", "success");
    } catch {
      Swal.fire("Error!", "Gagal memperbarui status.", "error");
    }
  };

  // ====== Submit logic DI-PISAH untuk create/edit agar clear ======
  const submitCreate = async (payload: CreateAnggotaMeninggalRequest) => {
    await createAnggotaMeninggal(payload).unwrap();
    Swal.fire(
      "Berhasil!",
      "Data anggota meninggal telah ditambahkan.",
      "success"
    );
    setIsCreateModalOpen(false);
    setFormData({ anggota_id: 0, deceased_at: "", description: "", status: 0 });
  };

  const submitEdit = async (payload: CreateAnggotaMeninggalRequest) => {
    if (!selectedItem) return;
    await updateAnggotaMeninggal({ id: selectedItem.id, payload }).unwrap();
    Swal.fire(
      "Berhasil!",
      "Data anggota meninggal telah diperbarui.",
      "success"
    );
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Toolbar */}
      <ProdukToolbar
        addButtonLabel="Anggota Meninggal"
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

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NIK
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal Meninggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Tidak ada data
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <ActionsGroup
                          handleDetail={() => handleDetail(item)}
                          handleEdit={() => handleEdit(item)}
                          handleDelete={() => handleDelete(item.id)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.anggota_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.anggota_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.anggota_phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.anggota_nik}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.deceased_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Anggota Meninggal</DialogTitle>
          </DialogHeader>

          <AnggotaMeninggalForm
            mode="create"
            initial={formData}
            anggotaOptions={anggotaFiltered}
            isAnggotaLoading={isLoadingAnggota}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Anggota Meninggal</DialogTitle>
          </DialogHeader>

          <AnggotaMeninggalForm
            mode="edit"
            initial={formData}
            anggotaOptions={anggotaFiltered}
            isAnggotaLoading={isLoadingAnggota}
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
        </DialogContent>
      </Dialog>

      {/* Detail Modal (unchanged) */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Anggota Meninggal</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Nama
                  </Label>
                  <p className="text-sm">{selectedItem.anggota_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Email
                  </Label>
                  <p className="text-sm">{selectedItem.anggota_email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Phone
                  </Label>
                  <p className="text-sm">{selectedItem.anggota_phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    NIK
                  </Label>
                  <p className="text-sm">{selectedItem.anggota_nik}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Tanggal Meninggal
                  </Label>
                  <p className="text-sm">
                    {formatDate(selectedItem.deceased_at)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Status
                  </Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedItem.status)}
                  </div>
                </div>
              </div>
              {selectedItem.description && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Deskripsi
                  </Label>
                  <p className="text-sm">{selectedItem.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}