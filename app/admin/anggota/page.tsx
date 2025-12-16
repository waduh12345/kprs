"use client";

import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useGetAnggotaListQuery,
  useDeleteAnggotaMutation,
  useExportAnggotaExcelMutation,
  useImportAnggotaExcelMutation,
} from "@/services/koperasi-service/anggota.service";
import type { AnggotaKoperasi } from "@/types/koperasi-types/anggota";
import { Badge } from "@/components/ui/badge";
import { ProdukToolbar } from "@/components/ui/produk-toolbar";
import { useRouter } from "next/navigation";
import ActionsGroup from "@/components/admin-components/actions-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HistoryIcon, LandmarkIcon } from "lucide-react";

export default function AnggotaPage() {
  const router = useRouter();

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "0" | "1" | "2">("all");

  const { data, isLoading, refetch } = useGetAnggotaListQuery(
    {
      page: currentPage,
      paginate: itemsPerPage,
    },
    {
      refetchOnMountOrArgChange: true, // ⬅️ refetch saat halaman dimount kembali
      refetchOnFocus: true, // ⬅️ bonus: refetch saat tab kembali fokus
      refetchOnReconnect: true, // ⬅️ bonus: refetch saat jaringan balik
    }
  );

  const list = useMemo(() => data?.data ?? [], [data]);

  const filteredList = useMemo(() => {
    let arr = list;
    if (status !== "all")
      arr = arr.filter((it) => it.status === Number(status));
    if (!query.trim()) return arr;
    const q = query.toLowerCase();
    return arr.filter((it) =>
      [it.name, it.email, it.phone, it.address, it.nik, it.npwp ?? ""].some(
        (f) => f?.toLowerCase?.().includes?.(q)
      )
    );
  }, [list, query, status]);

  const lastPage = useMemo(() => data?.last_page ?? 1, [data]);

  const [deleteAnggota] = useDeleteAnggotaMutation();

  // export/import hooks
  const [exportAnggotaExcel, { isLoading: isExporting }] =
    useExportAnggotaExcelMutation();
  const [importAnggotaExcel, { isLoading: isImporting }] =
    useImportAnggotaExcelMutation();

  const handleDelete = async (item: AnggotaKoperasi) => {
    const confirm = await Swal.fire({
      title: "Yakin hapus Anggota?",
      text: `${item.name} (${item.email})`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
    });
    if (confirm.isConfirmed) {
      try {
        await deleteAnggota(item.id).unwrap();
        await refetch();
        Swal.fire("Berhasil", "Anggota dihapus", "success");
      } catch (error) {
        Swal.fire("Gagal", "Gagal menghapus Anggota", "error");
        console.error(error);
      }
    }
  };

  // === Import handler ===
  const handleImportExcel = async (file?: File) => {
    try {
      if (!file) return Swal.fire("Gagal", "File tidak ditemukan", "error");
      const res = await importAnggotaExcel({ file }).unwrap();
      Swal.fire(
        "Import Dikirim",
        res.message ?? "Berhasil mengunggah file",
        "success"
      );
    } catch (e) {
      Swal.fire("Gagal", "Import gagal diproses", "error");
      console.error(e);
    }
  };

  // === Export handler (dengan SweetAlert elegan) ===
  const handleExportExcel = async () => {
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
    const today = new Date();
    const last30 = new Date();
    last30.setDate(today.getDate() - 30);
    const todayStr = fmt(today),
      last30Str = fmt(last30);

    const { value: formValues } = await Swal.fire({
      title: "Export Anggota",
      html: `
        <div class="sae-wrap">
          <div class="sae-field">
            <label for="from_date" class="sae-label"><span class="sae-icon">📅</span> From date</label>
            <input id="from_date" type="date" class="sae-input" />
          </div>
          <div class="sae-field">
            <label for="to_date" class="sae-label"><span class="sae-icon">📆</span> To date</label>
            <input id="to_date" type="date" class="sae-input" />
          </div>
          <p class="sae-hint">Pilih rentang tanggal export anggota.</p>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Kirim",
      cancelButtonText: "Batal",
      width: 520,
      color: "#0f172a",
      background: "rgba(255,255,255,0.9)",
      backdrop: `rgba(15,23,42,0.4)`,
      customClass: {
        popup: "sae-popup",
        title: "sae-title",
        confirmButton: "sae-btn-confirm",
        cancelButton: "sae-btn-cancel",
      },
      didOpen: () => {
        if (!document.getElementById("sae-styles")) {
          const style = document.createElement("style");
          style.id = "sae-styles";
          style.innerHTML = `
            .sae-popup{border-radius:18px;box-shadow:0 20px 60px rgba(2,6,23,.15),0 2px 8px rgba(2,6,23,.06);backdrop-filter: blur(8px); border:1px solid rgba(2,6,23,.06)}
            .sae-title{font-weight:700; letter-spacing:.2px}
            .sae-wrap{display:grid; gap:14px}
            .sae-field{display:grid; gap:8px}
            .sae-label{font-size:12px; color:#475569; display:flex; align-items:center; gap:6px}
            .sae-icon{font-size:14px}
            .sae-input{appearance:none;width:100%;padding:12px 14px;border-radius:12px;border:1px solid #e2e8f0;background:#fff;font-size:14px;transition:all .15s ease}
            .sae-input:focus{outline:none;border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.15)}
            .sae-hint{margin-top:4px;font-size:12px;color:#64748b}
            .sae-btn-confirm{background:linear-gradient(90deg,#6366f1,#22d3ee);color:white;border:none;border-radius:10px !important;padding:10px 18px;font-weight:600}
            .sae-btn-cancel{background:white;color:#0f172a;border:1px solid #e2e8f0;border-radius:10px !important;padding:10px 18px;font-weight:600}
          `;
          document.head.appendChild(style);
        }
        const fromEl = document.getElementById("from_date") as HTMLInputElement;
        const toEl = document.getElementById("to_date") as HTMLInputElement;
        if (fromEl && toEl) {
          fromEl.value = last30Str;
          toEl.value = todayStr;
          fromEl.max = todayStr;
          toEl.max = todayStr;
          toEl.min = fromEl.value;
          fromEl.addEventListener("input", () => {
            toEl.min = fromEl.value || "";
            if (toEl.value < fromEl.value) toEl.value = fromEl.value;
          });
          toEl.addEventListener("input", () => {
            fromEl.max = toEl.value || todayStr;
          });
        }
      },
      preConfirm: () => {
        const from_date = (
          document.getElementById("from_date") as HTMLInputElement
        )?.value;
        const to_date = (document.getElementById("to_date") as HTMLInputElement)
          ?.value;
        if (!from_date || !to_date) {
          Swal.showValidationMessage("from_date dan to_date wajib diisi");
          return;
        }
        if (to_date < from_date) {
          Swal.showValidationMessage("to_date tidak boleh < from_date");
          return;
        }
        return { from_date, to_date };
      },
    });

    if (!formValues) return;

    try {
      Swal.fire({
        title: "Mengirim permintaan…",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        showConfirmButton: false,
        customClass: { popup: "sae-popup", title: "sae-title" },
      });
      const res = await exportAnggotaExcel(formValues).unwrap();
      Swal.fire({
        icon: "success",
        title: "Export diproses",
        text:
          res.message ??
          "Permintaan export diterima \n Silahkan cek di notifikasi",
        confirmButtonText: "Oke",
        customClass: {
          popup: "sae-popup",
          title: "sae-title",
          confirmButton: "sae-btn-confirm",
        },
      });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Export gagal diproses",
        confirmButtonText: "Tutup",
        customClass: {
          popup: "sae-popup",
          title: "sae-title",
          confirmButton: "sae-btn-cancel",
        },
      });
      console.error(e);
    }
  };

  const statusBadge = (status: number) => {
    if (status === 1) return <Badge variant="success">APPROVED</Badge>;
    if (status === 2) return <Badge variant="destructive">REJECTED</Badge>;
    return <Badge variant="secondary">PENDING</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <ProdukToolbar
        showTemplateCsvButton
        openModal={() => router.push("/admin/anggota/add-data?mode=add")}
        onSearchChange={(q: string) => setQuery(q)}
        enableStatusFilter
        statusOptions={[
          { value: "all", label: "Semua Status" },
          { value: "0", label: "PENDING" },
          { value: "1", label: "APPROVED" },
          { value: "2", label: "REJECTED" },
        ]}
        initialStatus={status}
        onStatusChange={(s: string) => setStatus(s as "all" | "0" | "1" | "2")}
        onImportExcel={(file) => {
          if (!isImporting) void handleImportExcel(file);
        }}
        onExportExcel={() => {
          if (!isExporting) void handleExportExcel();
        }}
        importLabel={isImporting ? "Mengunggah..." : "Import Excel"}
        exportLabel={isExporting ? "Memproses..." : "Export Excel"}
      />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-2">Aksi</th>
                <th className="px-4 py-2">Nomor Anggota</th>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Telepon</th>
                <th className="px-4 py-2">Tipe</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center p-4">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-4">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-2">
                      <ActionsGroup
                        handleDetail={() =>
                          router.push(
                            `/admin/anggota/add-data?mode=detail&id=${item.id}`
                          )
                        }
                        handleEdit={() =>
                          router.push(
                            `/admin/anggota/add-data?mode=edit&id=${item.id}`
                          )
                        }
                        handleDelete={() => handleDelete(item)}
                        additionalActions={
                          <div className="flex items-center gap-2">
                            {/* History Anggota */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    router.push(
                                      `/admin/history?anggota_id=${item.id}`
                                    )
                                  }
                                >
                                  <HistoryIcon className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>History Anggota</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    router.push(
                                      `/admin/anggota/user-bank?user_id=${
                                        item.user_id ?? item.id
                                      }`
                                    )
                                  }
                                >
                                  <LandmarkIcon className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>User Bank</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        }
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {item.reference}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{item.user_name}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {item.user_email}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {item.user_phone}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {item.type}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {statusBadge(item.status)}
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
    </div>
  );
}
