"use client";

import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useModal from "@/hooks/use-modal";
import {
  useGetPinjamanListQuery,
  useGetPinjamanDetailsQuery,
  useCreatePinjamanMutation,
  useUpdatePinjamanMutation,
  useDeletePinjamanMutation,
  useUpdatePinjamanStatusMutation,
} from "@/services/admin/pinjaman.service";
import { useCreatePaymentMutation } from "@/services/installment.service";
import { Pinjaman } from "@/types/admin/pinjaman";
import FormPinjaman from "@/components/form-modal/pinjaman-form";
import { useGetPinjamanCategoryListQuery } from "@/services/master/pinjaman-category.service";
import { useGetAnggotaListQuery } from "@/services/koperasi-service/anggota.service";
import {
  Download,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  CreditCard,
  DollarSign,
} from "lucide-react";
import ActionsGroup from "@/components/admin-components/actions-group";

export default function PinjamanAnggotaPage() {
  const [form, setForm] = useState<Partial<Pinjaman>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [readonly, setReadonly] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPinjaman, setSelectedPinjaman] = useState<Pinjaman | null>(
    null
  );
  const [isExporting, setIsExporting] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<{
    id: number;
    month: number;
    remaining: number;
    due_date: string;
    status: boolean;
  } | null>(null);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [paymentType, setPaymentType] = useState<"manual" | "automatic">(
    "manual"
  );

  // Pagination
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [filters, setFilters] = useState({
    category_id: "",
    status: "",
    search: "",
  });

  const { data, isLoading, refetch } = useGetPinjamanListQuery({
    page: currentPage,
    paginate: itemsPerPage,
  });

  // Get categories and users for filters
  const { data: categoriesData } = useGetPinjamanCategoryListQuery({
    page: 1,
    paginate: 100,
  });

  const { data: usersData } = useGetAnggotaListQuery({
    page: 1,
    paginate: 100,
    status: 1,
  });

  const categories = categoriesData?.data || [];
  const users = usersData?.data || [];
  const pinjamanList = useMemo(() => data?.data || [], [data]);
  const lastPage = useMemo(() => data?.last_page || 1, [data]);

  // Helper functions to get names by ID
  const getUserName = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    return user?.name || `User ID: ${userId}`;
  };

  const getUserEmail = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    return user?.email || "Email tidak tersedia";
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || `Category ID: ${categoryId}`;
  };

  const getCategoryCode = (categoryId: number) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.code || "Kode tidak tersedia";
  };

  const [createPinjaman, { isLoading: isCreating }] =
    useCreatePinjamanMutation();
  const [updatePinjaman, { isLoading: isUpdating }] =
    useUpdatePinjamanMutation();
  const [deletePinjaman] = useDeletePinjamanMutation();
  const [updateStatus] = useUpdatePinjamanStatusMutation();
  const [createPayment] = useCreatePaymentMutation();
  // const [generateInstallments] = useGenerateInstallmentsMutation();

  // Get pinjaman details with installments when a pinjaman is selected
  const {
    data: pinjamanDetails,
    isLoading: isLoadingInstallments,
    refetch: refetchInstallments,
  } = useGetPinjamanDetailsQuery(selectedPinjaman?.id || 0, {
    skip: !selectedPinjaman?.id,
  });

  const handleSubmit = async () => {
    try {
      const payload = {
        pinjaman_category_id: form.pinjaman_category_id || 0,
        user_id: form.user_id || 0,
        description: form.description || "",
        date: form.date || "",
        nominal: form.nominal || 0,
        tenor: form.tenor || 0,
        interest_rate: form.interest_rate || 0,
      };

      if (editingId) {
        await updatePinjaman({ id: editingId, payload }).unwrap();
        Swal.fire("Sukses", "Pinjaman diperbarui", "success");
      } else {
        await createPinjaman(payload).unwrap();
        Swal.fire("Sukses", "Pinjaman ditambahkan", "success");
      }

      setForm({});
      setEditingId(null);
      await refetch();
      closeModal();
    } catch (error) {
      console.error(error);
      Swal.fire("Gagal", "Gagal menyimpan data", "error");
    }
  };

  const handleEdit = (item: Pinjaman) => {
    setForm({ ...item });
    setEditingId(item.id);
    setReadonly(false);
    openModal();
  };

  const handleDetail = (item: Pinjaman) => {
    setForm(item);
    setReadonly(true);
    openModal();
  };

  const handleDelete = async (item: Pinjaman) => {
    const confirm = await Swal.fire({
      title: "Yakin hapus pinjaman?",
      text: `Pinjaman ${item.user?.name} - Rp ${item.nominal?.toLocaleString(
        "id-ID"
      )}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
    });

    if (confirm.isConfirmed) {
      try {
        await deletePinjaman(item.id).unwrap();
        await refetch();
        Swal.fire("Berhasil", "Pinjaman dihapus", "success");
      } catch (error) {
        Swal.fire("Gagal", "Gagal menghapus pinjaman", "error");
        console.error(error);
      }
    }
  };

  const handleStatusUpdate = async (item: Pinjaman, newStatus: string) => {
    try {
      await updateStatus({ id: item.id, status: newStatus }).unwrap();
      await refetch();
      Swal.fire("Berhasil", "Status pinjaman diperbarui", "success");
    } catch (error) {
      Swal.fire("Gagal", "Gagal memperbarui status", "error");
      console.error(error);
    }
  };

  const handlePaymentHistory = (item: Pinjaman) => {
    setSelectedPinjaman(item);
    setPaymentModalOpen(true);
  };

  const handleCreatePayment = async () => {
    if (!selectedInstallment || !selectedPinjaman) {
      Swal.fire("Error", "Data tidak lengkap", "error");
      return;
    }

    if (paymentType === "manual" && !paymentFile) {
      Swal.fire(
        "Error",
        "Pilih file bukti pembayaran terlebih dahulu",
        "error"
      );
      return;
    }

    try {
      await createPayment({
        pinjaman_id: selectedPinjaman.id,
        pinjaman_detail_id: selectedInstallment.id,
        amount: selectedInstallment.remaining,
        type: paymentType,
        image: paymentType === "manual" ? paymentFile || undefined : undefined,
      }).unwrap();

      await refetchInstallments();
      setPaymentModalOpen(false);
      setSelectedInstallment(null);
      setPaymentFile(null);
      setPaymentType("manual");

      Swal.fire("Berhasil", "Pembayaran berhasil diproses", "success");
    } catch (error) {
      Swal.fire("Gagal", "Gagal memproses pembayaran", "error");
      console.error(error);
    }
  };

  const handleExport = async () => {
    if (filteredData.length === 0) {
      Swal.fire("Info", "Tidak bisa export karena datanya kosong", "info");
      return;
    }

    const confirm = await Swal.fire({
      title: "Export Data",
      text: `Apakah Anda yakin ingin mengekspor ${filteredData.length} data pinjaman?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Export",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    setIsExporting(true);

    // Prepare data for export
    const exportData = filteredData.map((item, index) => ({
      No: index + 1,
      Anggota: getUserName(item.user_id),
      Email: getUserEmail(item.user_id),
      Kategori: getCategoryName(item.pinjaman_category_id),
      "Kode Kategori": getCategoryCode(item.pinjaman_category_id),
      "Nominal (Rp)": formatCurrency(item.nominal || 0),
      "Tenor (Bulan)": item.tenor || 0,
      "Suku Bunga (%)": item.interest_rate || 0,
      Status: item.status || "-",
      "Tanggal Pinjaman": item.date
        ? new Date(item.date).toLocaleDateString("id-ID")
        : "-",
      Deskripsi: item.description || "-",
      Dibuat: item.created_at
        ? new Date(item.created_at).toLocaleString("id-ID")
        : "-",
    }));

    // Create CSV content with metadata
    const headers = Object.keys(exportData[0]);
    const filterInfo = [];

    if (filters.category_id) {
      const category = categories.find(
        (c) => c.id === Number(filters.category_id)
      );
      filterInfo.push(`Kategori: ${category?.name || "Unknown"}`);
    }
    if (filters.status) {
      filterInfo.push(`Status: ${filters.status}`);
    }
    if (filters.search) {
      filterInfo.push(`Pencarian: ${filters.search}`);
    }

    const csvContent = [
      "LAPORAN PINJAMAN ANGGOTA",
      `Tanggal Export: ${new Date().toLocaleString("id-ID")}`,
      `Total Data: ${filteredData.length} record`,
      ...(filterInfo.length > 0 ? [`Filter: ${filterInfo.join(", ")}`] : []),
      "",
      headers.join(","),
      ...exportData.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row];
            // Escape commas and quotes in values
            if (
              typeof value === "string" &&
              (value.includes(",") || value.includes('"'))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(",")
      ),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `pinjaman-anggota-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire(
      "Berhasil",
      `Data berhasil diekspor (${filteredData.length} record)`,
      "success"
    );
    setIsExporting(false);
  };

  // Filter data based on all filters
  const filteredData = useMemo(() => {
    let filtered = pinjamanList;

    // Apply category filter
    if (filters.category_id) {
      filtered = filtered.filter(
        (item) => item.pinjaman_category_id === Number(filters.category_id)
      );
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(
        (item) => String(item.status) === filters.status
      );
    }

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(
        (item) =>
          item.user?.name
            ?.toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          item.pinjaman_category?.name
            ?.toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          item.description?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    return filtered;
  }, [pinjamanList, filters.category_id, filters.status, filters.search]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string | number) => {
    const statusConfig = {
      "0": {
        variant: "secondary" as const,
        label: "Pending",
        className: "bg-yellow-100 text-yellow-800",
      },
      "1": {
        variant: "success" as const,
        label: "Approved",
        className: "bg-green-100 text-green-800",
      },
      "2": {
        variant: "destructive" as const,
        label: "Ditolak",
        className: "bg-red-100 text-red-800",
      },
      pending: {
        variant: "secondary" as const,
        label: "Pending",
        className: "bg-yellow-100 text-yellow-800",
      },
      approved: {
        variant: "success" as const,
        label: "Approved",
        className: "bg-green-100 text-green-800",
      },
      rejected: {
        variant: "destructive" as const,
        label: "Ditolak",
        className: "bg-red-100 text-red-800",
      },
    };

    const statusKey = String(status);
    const config = statusConfig[statusKey as keyof typeof statusConfig] || {
      variant: "destructive" as const,
      label: String(status),
      className: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between"></div>

      {/* Filters */}
      <div className="rounded-md bg-white p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Kiri: filter */}
          <div className="w-full flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 sm:max-w-xs"
                placeholder="Cari nama, kategori, atau deskripsi..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>

            {/* Kategori */}
            <select
              className="w-full sm:w-56 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.category_id}
              onChange={(e) =>
                setFilters({ ...filters, category_id: e.target.value })
              }
              aria-label="Filter kategori pinjaman"
            >
              <option value="">Semua Kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              className="w-full sm:w-48 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              aria-label="Filter status pinjaman"
            >
              <option value="">Semua Status</option>
              <option value="0">Pending</option>
              <option value="1">Approved</option>
              <option value="2">Ditolak</option>
            </select>

          </div>

          {/* Kanan: aksi */}
          <div className="shrink-0 flex flex-wrap items-center gap-2">
            <div className="flex gap-2">
              <Button
                onClick={handleExport}
                variant="green"
                disabled={isExporting}
                className="h-10"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export Excel"}
              </Button>
              <Button className="h-10" onClick={() => openModal()}>
                <Plus className="h-4 w-4" />
                Pinjaman
              </Button>
            </div>
            <Button
              variant="destructive"
              className="h-10"
              onClick={() =>
                setFilters({
                  category_id: "",
                  status: "",
                  search: "",
                })
              }
            >
              Reset Filter
            </Button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-2">Aksi</th>
                <th className="px-4 py-2">Anggota</th>
                <th className="px-4 py-2">Kategori</th>
                <th className="px-4 py-2">Nominal</th>
                <th className="px-4 py-2">Tenor</th>
                <th className="px-4 py-2">Suku Bunga</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Tanggal</th>
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
                        handleDetail={() => {
                          handleDetail(item);
                        }}
                        handleEdit={() => {
                          handleEdit(item);
                        }}
                        handleDelete={() => {
                          handleDelete(item);
                        }}
                        additionalActions={
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    handlePaymentHistory(item);
                                  }}
                                >
                                  <CreditCard className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>History Pembayaran</p>
                              </TooltipContent>
                            </Tooltip>

                            {(String(item.status) === "0" ||
                              item.status === "pending" ||
                              Number(item.status) === 0) && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleStatusUpdate(item, "1")
                                      }
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="size-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Approve Pinjaman</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleStatusUpdate(item, "2")
                                      }
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      <XCircle className="size-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Reject Pinjaman</p>
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            )}
                          </>
                        }
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div>
                        <div className="font-medium">
                          {getUserName(item.user_id)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getUserEmail(item.user_id)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div>
                        <div className="font-medium">
                          {getCategoryName(item.pinjaman_category_id)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getCategoryCode(item.pinjaman_category_id)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 font-medium">
                      {formatCurrency(item.nominal)}
                    </td>
                    <td className="px-4 py-2">{item.tenor} bulan</td>
                    <td className="px-4 py-2">{item.interest_rate}%</td>
                    <td className="px-4 py-2">{getStatusBadge(item.status)}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {new Date(item.date).toLocaleDateString("id-ID")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>

        {/* Pagination */}
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

      {/* Pinjaman Form Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <FormPinjaman
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
            isLoading={isCreating || isUpdating}
          />
        </div>
      )}

      {/* Payment History Modal */}
      {paymentModalOpen && selectedPinjaman && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold">
                  History Pembayaran -{" "}
                  {pinjamanDetails?.user?.name || selectedPinjaman.user?.name}
                </h2>
                <p className="text-sm text-gray-500">
                  Pinjaman:{" "}
                  {formatCurrency(
                    pinjamanDetails?.nominal || selectedPinjaman.nominal
                  )}{" "}
                  - {pinjamanDetails?.tenor || selectedPinjaman.tenor} bulan
                </p>
                <p className="text-xs text-gray-400">
                  Angsuran per bulan:{" "}
                  {formatCurrency(pinjamanDetails?.monthly_installment || 0)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setPaymentModalOpen(false)}
                >
                  ✕
                </Button>
              </div>
            </div>

            {isLoadingInstallments ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Memuat data angsuran...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-500">
                            Total Angsuran
                          </p>
                          <p className="font-semibold">
                            {pinjamanDetails?.details?.length || 0} bulan
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-500">Sudah Dibayar</p>
                          <p className="font-semibold">
                            {pinjamanDetails?.details?.filter(
                              (i) => i.status === true
                            ).length || 0}{" "}
                            bulan
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="text-sm text-gray-500">Belum Dibayar</p>
                          <p className="font-semibold">
                            {pinjamanDetails?.details?.filter(
                              (i) => i.status === false
                            ).length || 0}{" "}
                            bulan
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Installments Table */}
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted text-left">
                          <tr>
                            <th className="px-4 py-2">Bulan Ke</th>
                            <th className="px-4 py-2">Nominal</th>
                            <th className="px-4 py-2">Jatuh Tempo</th>
                            <th className="px-4 py-2">Tanggal Bayar</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {!pinjamanDetails?.details ||
                          pinjamanDetails.details.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="text-center p-8 text-gray-500"
                              >
                                Belum ada data angsuran.
                              </td>
                            </tr>
                          ) : (
                            pinjamanDetails.details.map((installment) => (
                              <tr key={installment.id} className="border-t">
                                <td className="px-4 py-2 font-medium">
                                  {installment.month}
                                </td>
                                <td className="px-4 py-2 font-medium">
                                  {formatCurrency(installment.remaining)}
                                </td>
                                <td className="px-4 py-2">
                                  {new Date(
                                    installment.due_date
                                  ).toLocaleDateString("id-ID")}
                                </td>
                                <td className="px-4 py-2">
                                  {installment.paid_at
                                    ? new Date(
                                        installment.paid_at
                                      ).toLocaleDateString("id-ID")
                                    : "-"}
                                </td>
                                <td className="px-4 py-2">
                                  <Badge
                                    variant={
                                      installment.status
                                        ? "success"
                                        : "secondary"
                                    }
                                    className={
                                      installment.status
                                        ? "bg-green-100 text-green-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }
                                  >
                                    {installment.status
                                      ? "Lunas"
                                      : "Belum Bayar"}
                                  </Badge>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex gap-2">
                                    {!installment.status ? (
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => {
                                          setSelectedInstallment(installment);
                                          setPaymentModalOpen(true);
                                        }}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Bayar
                                      </Button>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          variant="success"
                                          className="text-xs"
                                        >
                                          Lunas
                                        </Badge>
                                      </div>
                                    )}
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
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModalOpen && selectedInstallment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Pembayaran Angsuran</h2>
              <Button
                variant="ghost"
                onClick={() => {
                  setPaymentModalOpen(false);
                  setSelectedInstallment(null);
                  setPaymentFile(null);
                  setPaymentType("manual");
                }}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Angsuran Bulan Ke:{" "}
                  <strong>{selectedInstallment.month}</strong>
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Nominal:{" "}
                  <strong>
                    {formatCurrency(selectedInstallment.remaining)}
                  </strong>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Jatuh Tempo:{" "}
                  <strong>
                    {new Date(selectedInstallment.due_date).toLocaleDateString(
                      "id-ID"
                    )}
                  </strong>
                </p>
              </div>

              {/* Payment Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tipe Pembayaran
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentType"
                      value="manual"
                      checked={paymentType === "manual"}
                      onChange={(e) =>
                        setPaymentType(e.target.value as "manual" | "automatic")
                      }
                      className="mr-2"
                    />
                    Manual (Upload Bukti)
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentType"
                      value="automatic"
                      checked={paymentType === "automatic"}
                      onChange={(e) =>
                        setPaymentType(e.target.value as "manual" | "automatic")
                      }
                      className="mr-2"
                    />
                    Otomatis
                  </label>
                </div>
              </div>

              {/* Manual Payment - File Upload */}
              {paymentType === "manual" && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Pilih File Bukti Pembayaran
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      setPaymentFile(e.target.files?.[0] || null)
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format yang didukung: JPG, PNG, PDF (Max 5MB)
                  </p>
                </div>
              )}

              {/* Automatic Payment - Summary */}
              {paymentType === "automatic" && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">
                    Ringkasan Pembayaran Otomatis
                  </h3>
                  <p className="text-sm text-blue-800">
                    Pembayaran akan diproses secara otomatis dengan nominal yang
                    tertera. Pastikan saldo mencukupi untuk melakukan
                    pembayaran.
                  </p>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPaymentModalOpen(false);
                    setSelectedInstallment(null);
                    setPaymentFile(null);
                    setPaymentType("manual");
                  }}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleCreatePayment}
                  disabled={paymentType === "manual" && !paymentFile}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {paymentType === "manual"
                    ? "Upload & Bayar"
                    : "Bayar Otomatis"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
