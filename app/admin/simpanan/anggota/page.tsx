"use client";

import { useMemo, useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import useModal from "@/hooks/use-modal";
import {
  useGetSimpananListQuery,
  useCreateSimpananMutation,
  useUpdateSimpananMutation,
  useDeleteSimpananMutation,
  useUpdateSimpananStatusMutation,
} from "@/services/admin/simpanan.service";
import { Simpanan } from "@/types/admin/simpanan";
import FormSimpanan from "@/components/form-modal/simpanan-form";
import { useGetSimpananCategoryListQuery } from "@/services/master/simpanan-category.service";
import { useGetAnggotaListQuery } from "@/services/koperasi-service/anggota.service";
import {
  Download,
  Filter,
  Plus,
  CheckCircle,
  XCircle,
  CalendarIcon,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import ActionsGroup from "@/components/admin-components/actions-group";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { formatRupiahWithRp } from "@/lib/format-utils";
import { showPaymentInstruction } from "@/lib/show-payment-instructions";

type Anggota = { id: number; name?: string; email?: string };

type WrappedCreateResp = { code: number; message: string; data: Simpanan };
const isWrappedResp = (x: unknown): x is WrappedCreateResp =>
  typeof x === "object" && x !== null && "data" in x;

export default function SimpananAnggotaPage() {
  const [form, setForm] = useState<Partial<Simpanan>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [readonly, setReadonly] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();
  const [isExporting, setIsExporting] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  const initialFilters = {
    category_id: "",
    status: "",
    date_from: undefined as Date | undefined,
    date_to: undefined as Date | undefined,
    member_query: "",
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (openDropdownId && !target.closest(".dropdown-container")) {
        setOpenDropdownId(null);
      }
    };
    if (openDropdownId) {
      setTimeout(
        () => document.addEventListener("click", handleClickOutside),
        100
      );
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openDropdownId]);

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState(initialFilters);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.category_id ||
          filters.status ||
          filters.member_query.trim() ||
          filters.date_from ||
          filters.date_to
      ),
    [filters]
  );

  const handleResetFilters = () => {
    setCurrentPage(1);
    setFilters(initialFilters);
    setTimeout(() => refetch(), 0);
  };

  const { data, isLoading, isFetching, refetch } = useGetSimpananListQuery({
    page: currentPage,
    paginate: itemsPerPage,
    category_id: filters.category_id ? Number(filters.category_id) : undefined,
    status: filters.status || undefined,
    date_from: filters.date_from
      ? format(filters.date_from, "yyyy-MM-dd")
      : undefined,
    date_to: filters.date_to
      ? format(filters.date_to, "yyyy-MM-dd")
      : undefined,
  });

  const { data: categoriesData } = useGetSimpananCategoryListQuery({
    page: 1,
    paginate: 100,
  });

  const { data: usersData } = useGetAnggotaListQuery({
    page: 1,
    paginate: 100,
    status: 1,
  });

  const rawUsers: Anggota[] | undefined = usersData?.data;
  const users: Anggota[] = useMemo(() => rawUsers ?? [], [rawUsers]);

  const categories = categoriesData?.data || [];
  const simpananList = useMemo(() => data?.data || [], [data]);
  const lastPage = useMemo(() => data?.last_page || 1, [data]);

  const usersById = useMemo(() => {
    const m = new Map<number, Anggota>();
    users.forEach((u) => m.set(u.id, u));
    return m;
  }, [users]);

  const getUserName = (userId: number) =>
    usersById.get(userId)?.name || `User ID: ${userId}`;
  const getUserEmail = (userId: number) =>
    usersById.get(userId)?.email || "Email tidak tersedia";
  const getCategoryName = (categoryId: number) =>
    categories.find((c: { id: number; name: string }) => c.id === categoryId)
      ?.name ?? `Category ID: ${categoryId}`;
  const getCategoryCode = (categoryId: number) =>
    categories.find((c: { id: number; code?: string }) => c.id === categoryId)
      ?.code ?? "Kode tidak tersedia";

  const [createSimpanan, { isLoading: isCreating }] =
    useCreateSimpananMutation();
  const [updateSimpanan, { isLoading: isUpdating }] =
    useUpdateSimpananMutation();
  const [deleteSimpanan] = useDeleteSimpananMutation();
  const [updateStatus] = useUpdateSimpananStatusMutation();

  type CreatePayload = {
    simpanan_category_id: number;
    user_id: number;
    description: string;
    date: string;
    nominal: number;
    type: "automatic" | "manual";
    payment_method?: string;
    payment_channel?: string;
  };

  const handleSubmit = async () => {
    try {
      const payload: CreatePayload = {
        simpanan_category_id: form.simpanan_category_id || 0,
        user_id: form.user_id || 0,
        description: form.description || "",
        date: form.date || "",
        nominal: form.nominal || 0,
        type: (form.type as "automatic" | "manual") || "automatic",
        ...(form.payment_method ? { payment_method: form.payment_method } : {}),
        ...(form.payment_channel
          ? { payment_channel: form.payment_channel }
          : {}),
      };

      if (editingId) {
        await updateSimpanan({ id: editingId, payload }).unwrap();
        await Swal.fire("Sukses", "Simpanan diperbarui", "success");
      } else {
        const resp = await createSimpanan(payload).unwrap();

        // 👉 pastikan kita pegang objek Simpanan murni
        const createdSimpanan: Simpanan = isWrappedResp(resp)
          ? resp.data
          : (resp as Simpanan);

        await Swal.fire("Sukses", "Simpanan ditambahkan", "success");

        // Tampilkan instruksi pembayaran kalau ada
        if (createdSimpanan.payment) {
          showPaymentInstruction(createdSimpanan.payment);
        }
      }

      setForm({});
      setEditingId(null);
      await refetch();
      closeModal();
    } catch (error) {
      console.error(error);
      await Swal.fire("Gagal", "Gagal menyimpan data", "error");
    }
  };

  const handleEdit = (item: Simpanan) => {
    setForm({ ...item });
    setEditingId(item.id);
    setReadonly(false);
    openModal();
  };

  const handleDetail = (item: Simpanan) => {
    setForm(item);
    setReadonly(true);
    openModal();
  };

  const handleDelete = async (item: Simpanan) => {
    const confirm = await Swal.fire({
      title: "Yakin hapus simpanan?",
      text: `Simpanan ${item.user_name} - Rp ${item.nominal?.toLocaleString(
        "id-ID"
      )}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteSimpanan(item.id).unwrap();
        await refetch();
        void Swal.fire("Berhasil", "Simpanan dihapus", "success");
      } catch (error) {
        void Swal.fire("Gagal", "Gagal menghapus simpanan", "error");
        console.error(error);
      }
    }
  };

  const STATUS_LABEL: Record<string, string> = {
    "0": "MENUNGGU",
    "1": "DITERIMA",
    "2": "DITOLAK",
  };

  const handleStatusUpdate = async (item: Simpanan, newStatus: string) => {
    const fromLabel = STATUS_LABEL[String(item.status)] ?? String(item.status);
    const toLabel = STATUS_LABEL[String(newStatus)] ?? String(newStatus);

    const result = await Swal.fire({
      title: "Ubah status simpanan?",
      html: `Status akan diubah dari <b>${fromLabel}</b> ke <b>${toLabel}</b>.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, ubah",
      cancelButtonText: "Batal",
      reverseButtons: true,
      focusCancel: true,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async () => {
        try {
          await updateStatus({ id: item.id, status: newStatus }).unwrap();
        } catch (e) {
          Swal.showValidationMessage("Gagal memperbarui status. Coba lagi.");
          throw e;
        }
      },
    });

    if (result.isConfirmed) {
      await refetch();
      void Swal.fire("Berhasil", "Status simpanan diperbarui.", "success");
    }
  };

  const handleExport = async () => {
    if (filteredData.length === 0) {
      void Swal.fire("Info", "Tidak bisa export karena datanya kosong", "info");
      return;
    }

    const confirm = await Swal.fire({
      title: "Export Data",
      text: `Apakah Anda yakin ingin mengekspor ${filteredData.length} data simpanan?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Export",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    setIsExporting(true);

    const exportData = filteredData.map((item, index) => ({
      No: index + 1,
      Reference: item.reference,
      Anggota: getUserName(item.user_id),
      Email: getUserEmail(item.user_id),
      Kategori: getCategoryName(item.simpanan_category_id),
      "Kode Kategori": getCategoryCode(item.simpanan_category_id),
      "Nominal (Rp)": formatCurrency(item.nominal || 0),
      Tipe: item.type.toUpperCase(),
      "Metode Bayar": item.payment_method ?? "-",
      "Channel Bayar": item.payment_channel ?? "-",
      Status: item.status || "-",
      "Tanggal Simpanan": item.date
        ? new Date(item.date).toLocaleDateString("id-ID")
        : "-",
      Deskripsi: item.description || "-",
      Dibuat: item.created_at
        ? new Date(item.created_at).toLocaleString("id-ID")
        : "-",
    }));

    const headers = Object.keys(exportData[0]);
    const filterInfo: string[] = [];

    if (filters.category_id) {
      const category = categories.find(
        (c: { id: number; name: string }) =>
          c.id === Number(filters.category_id)
      );
      filterInfo.push(`Kategori: ${category?.name || "Unknown"}`);
    }
    if (filters.status) filterInfo.push(`Status: ${filters.status}`);
    if (filters.date_from) filterInfo.push(`Dari: ${filters.date_from}`);
    if (filters.date_to) filterInfo.push(`Sampai: ${filters.date_to}`);

    const csvContent = [
      "LAPORAN SIMPANAN ANGGOTA",
      `Tanggal Export: ${new Date().toLocaleString("id-ID")}`,
      `Total Data: ${filteredData.length} record`,
      ...(filterInfo.length > 0 ? [`Filter: ${filterInfo.join(", ")}`] : []),
      "",
      headers.join(","),
      ...exportData.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row];
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

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `simpanan-anggota-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    void Swal.fire(
      "Berhasil",
      `Data berhasil diekspor (${filteredData.length} record)`,
      "success"
    );
    setIsExporting(false);
  };

  const filteredData = useMemo(() => {
    let out = simpananList;
    const q = filters.member_query.trim().toLowerCase();
    if (q.length >= 2) {
      out = out.filter((item: Simpanan) => {
        const u = usersById.get(item.user_id);
        const name = u?.name?.toLowerCase() ?? "";
        const email = u?.email?.toLowerCase() ?? "";
        return name.includes(q) || email.includes(q);
      });
    }
    return out;
  }, [simpananList, filters.member_query, usersById]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const getStatusBadge = (status: string | number) => {
    const statusConfig = {
      "0": { variant: "destructive" as const, label: "Pending" },
      "1": { variant: "success" as const, label: "Approved" },
      "2": { variant: "destructive" as const, label: "Ditolak" },
      pending: { variant: "destructive" as const, label: "Pending" },
      approved: { variant: "success" as const, label: "Approved" },
      rejected: { variant: "destructive" as const, label: "Ditolak" },
    };
    const statusKey = String(status);
    const config = statusConfig[statusKey as keyof typeof statusConfig] || {
      variant: "destructive" as const,
      label: String(status),
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex justify-between items-center">
            {/* kiri */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {/* Anggota search */}
              <div className="flex flex-col gap-y-1 min-w-0">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ketik nama/email (min. 2 huruf)"
                    className="h-10 w-full rounded-md border border-gray-300 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.member_query}
                    onChange={(e) =>
                      setFilters((s) => ({
                        ...s,
                        member_query: e.target.value,
                      }))
                    }
                    aria-label="Cari anggota berdasarkan nama/email"
                  />
                  {filters.member_query && (
                    <button
                      type="button"
                      onClick={() =>
                        setFilters((s) => ({ ...s, member_query: "" }))
                      }
                      className="absolute inset-y-0 right-2 my-auto text-xs text-gray-500 hover:text-gray-700"
                      title="Bersihkan"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Kategori + Status */}
              <div className="grid grid-cols-2 gap-4 lg:col-span-2 min-w-0">
                <div className="flex flex-col gap-y-1 min-w-0">
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.category_id}
                    onChange={(e) =>
                      setFilters({ ...filters, category_id: e.target.value })
                    }
                    aria-label="Filter kategori simpanan"
                  >
                    <option value="">Semua Kategori</option>
                    {categories.map(
                      (category: { id: number; name: string }) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="flex flex-col gap-y-1 min-w-0">
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    aria-label="Filter status simpanan"
                  >
                    <option value="">Semua Status</option>
                    <option value="0">Pending</option>
                    <option value="1">Approved</option>
                    <option value="2">Ditolak</option>
                  </select>
                </div>
              </div>

              {/* Tanggal */}
              <div className="flex flex-col gap-y-1 min-w-0">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 w-40 border border-gray-300 justify-start text-left font-normal whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {filters.date_from ? (
                          filters.date_to ? (
                            <>
                              {format(filters.date_from, "LLL dd, y")} -{" "}
                              {format(filters.date_to, "LLL dd, y")}
                            </>
                          ) : (
                            format(filters.date_from, "LLL dd, y")
                          )
                        ) : (
                          <span>Filter Tanggal</span>
                        )}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      defaultMonth={filters.date_from}
                      selected={{
                        from: filters.date_from,
                        to: filters.date_to,
                      }}
                      onSelect={(val) =>
                        setFilters((s) => ({
                          ...s,
                          date_from: val.from,
                          date_to: val.to,
                        }))
                      }
                      numberOfMonths={2}
                      required
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* kanan actions */}
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
              <Button size="sm" className="h-10" onClick={() => openModal()}>
                <Plus className="h-4 w-4" />
                Simpanan
              </Button>
              <Button
                variant="destructive"
                className="h-10"
                onClick={handleResetFilters}
                disabled={!hasActiveFilters}
                title="Reset semua filter"
              >
                <Filter className="h-4 w-4 mr-2" />
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-2">Aksi</th>
                <th className="px-4 py-2">Reference</th>
                <th className="px-4 py-2">Anggota</th>
                <th className="px-4 py-2">Kategori</th>
                <th className="px-4 py-2">Nominal</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Metode</th>
                <th className="px-4 py-2">Channel</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Tanggal</th>
                <th className="px-4 py-2">Pembayaran</th>
              </tr>
            </thead>
            <tbody>
              {isLoading || isFetching ? (
                <tr>
                  <td colSpan={11} className="text-center p-4">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center p-4">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                filteredData.map((item: Simpanan) => {
                  const paid = Boolean(item.payment?.paid_at);
                  const hasPayment = Boolean(item.payment);

                  return (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-2">
                        <ActionsGroup
                          handleDetail={() => handleDetail(item)}
                          handleEdit={() => handleEdit(item)}
                          handleDelete={() => handleDelete(item)}
                          additionalActions={
                            <>
                              {item.status === 0 && (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          handleStatusUpdate(item, "1")
                                        }
                                        title="Approve"
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <CheckCircle className="size-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Approve</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          handleStatusUpdate(item, "2")
                                        }
                                        title="Reject"
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        <XCircle className="size-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Reject</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </>
                              )}
                            </>
                          }
                        />
                      </td>

                      <td className="px-4 py-2">{item.reference}</td>

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
                          <div className="font-medium whitespace-nowrap">
                            {getCategoryName(item.simpanan_category_id)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getCategoryCode(item.simpanan_category_id)}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-2 font-medium whitespace-nowrap">
                        {formatRupiahWithRp(item.nominal)}
                      </td>

                      <td className="px-4 py-2">
                        {item.type.toLocaleLowerCase()}
                      </td>

                      {/* NEW: method & channel */}
                      <td className="px-4 py-2">
                        {item.payment_method ?? "-"}
                      </td>
                      <td className="px-4 py-2">
                        {item.payment_channel ?? "-"}
                      </td>

                      <td className="px-4 py-2">
                        {getStatusBadge(item.status)}
                      </td>

                      <td className="px-4 py-2 text-sm text-gray-500">
                        {new Date(item.date).toLocaleDateString("id-ID")}
                      </td>

                      {/* NEW: Payment cell */}
                      <td className="px-4 py-2">
                        {hasPayment ? (
                          paid ? (
                            <Badge variant="success">Lunas</Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                item.payment &&
                                showPaymentInstruction(item.payment)
                              }
                            >
                              Bayar
                            </Button>
                          )
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })
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

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
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
            isLoading={isCreating || isUpdating}
          />
        </div>
      )}
    </div>
  );
}
