"use client";

import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import useModal from "@/hooks/use-modal";
import {
  useGetDataListQuery,
  useCreateDataMutation,
  useUpdateDataMutation,
  useDeleteDataMutation,
  useExportDataExcelMutation, // ⬅️ Import hook Export
  useImportDataExcelMutation, // ⬅️ Import hook Import
  SALES_TEMPLATE_URL, // ⬅️ Import URL Template
} from "@/services/admin/sales/data.service";
import { Data } from "@/types/admin/sales/data";
import FormData from "@/components/form-modal/admin/sales/data-form";
import { Badge } from "@/components/ui/badge";
import ActionsGroup from "@/components/admin-components/actions-group";
import { ProdukToolbar } from "@/components/ui/produk-toolbar"; // ⬅️ Gunakan Toolbar standar
import { Download } from "lucide-react";

export default function PinjamanDataPage() {
  const [form, setForm] = useState<Partial<Data>>({
    status: true,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [readonly, setReadonly] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");

  const { data, isLoading, refetch } = useGetDataListQuery({
    page: currentPage,
    paginate: itemsPerPage,
  });

  const categoryList = useMemo(() => data?.data || [], [data]);
  const lastPage = useMemo(() => data?.last_page || 1, [data]);

  // CRUD Mutations
  const [createCategory, { isLoading: isCreating }] = useCreateDataMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateDataMutation();
  const [deleteCategory] = useDeleteDataMutation();

  // Excel Mutations
  const [exportData, { isLoading: isExporting }] = useExportDataExcelMutation();
  const [importData, { isLoading: isImporting }] = useImportDataExcelMutation();

  // === HANDLE IMPORT EXCEL ===
  const handleImportExcel = async (file?: File) => {
    try {
      if (!file) return Swal.fire("Gagal", "File tidak ditemukan", "error");
      const res = await importData({ file }).unwrap();
      Swal.fire(
        "Import Berhasil",
        res.message ?? "Data berhasil diunggah",
        "success"
      );
      await refetch();
    } catch (e) {
      Swal.fire("Gagal", "Import gagal diproses", "error");
      console.error(e);
    }
  };

  // === HANDLE EXPORT EXCEL ===
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
      title: "Export Data Sales",
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
          <p class="sae-hint">Pilih rentang tanggal export data.</p>
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
        return { from_date, to_date };
      },
    });

    if (!formValues) return;

    try {
      Swal.fire({
        title: "Memproses export...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        showConfirmButton: false,
      });
      const res = await exportData(formValues).unwrap();
      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: res.message ?? "Permintaan export diterima, cek notifikasi.",
      });
    } catch (e) {
      Swal.fire("Gagal", "Export gagal diproses", "error");
      console.error(e);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        sales_category_id: form.sales_category_id || 0,
        code: form.code || "",
        name: form.name || "",
        address: form.address || "",
        phone: form.phone || "",
        status: form.status !== undefined ? (form.status ? 1 : 0) : 1,
      };

      if (editingId) {
        await updateCategory({ id: editingId, payload }).unwrap();
        Swal.fire("Sukses", "Data Sales diperbarui", "success");
      } else {
        await createCategory(payload).unwrap();
        Swal.fire("Sukses", "Data Sales ditambahkan", "success");
      }

      setForm({ status: true });
      setEditingId(null);
      await refetch();
      closeModal();
    } catch (error) {
      console.error(error);
      Swal.fire("Gagal", "Gagal menyimpan data", "error");
    }
  };

  const handleEdit = (item: Data) => {
    setForm({ ...item });
    setEditingId(item.id);
    setReadonly(false);
    openModal();
  };

  const handleDetail = (item: Data) => {
    setForm(item);
    setReadonly(true);
    openModal();
  };

  const handleDelete = async (item: Data) => {
    const confirm = await Swal.fire({
      title: "Yakin hapus Data Sales?",
      text: item.name,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteCategory(item.id).unwrap();
        await refetch();
        Swal.fire("Berhasil", "Data Sales dihapus", "success");
      } catch (error) {
        Swal.fire("Gagal", "Gagal menghapus Data Sales", "error");
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
        item.address.toLowerCase().includes(query.toLowerCase())
    );
  }, [categoryList, query]);

  return (
    <div className="p-6 space-y-6">
      {/* MENGGANTI BAGIAN FILTER MANUAL DENGAN PRODUK TOOLBAR */}
      <ProdukToolbar
        // Search & Add
        onSearchChange={(q) => setQuery(q)}
        openModal={() => {
          setForm({ status: true });
          setEditingId(null);
          setReadonly(false);
          openModal();
        }}
        showAddButton={true}
        addButtonLabel="Data Sales"
        // Import
        enableImport={true}
        onImportExcel={(file) => {
          if (!isImporting) void handleImportExcel(file);
        }}
        importLabel={isImporting ? "Mengunggah..." : "Import Excel"}
        // Export
        enableExport={true}
        onExportExcel={() => {
          if (!isExporting) void handleExportExcel();
        }}
        exportLabel={isExporting ? "Memproses..." : "Export Excel"}
        exportIcon={<Download className="mr-2 size-4" />}
        // Template CSV
        showTemplateCsvButton={true}
        templateCsvUrl={SALES_TEMPLATE_URL}
        templateCsvLabel="Template CSV"
      />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-2">Aksi</th>
                <th className="px-4 py-2">Kategori</th>
                <th className="px-4 py-2">Kode</th>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">Alamat</th>
                <th className="px-4 py-2">No. HP</th>
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
                      <div className="flex gap-2">
                        <ActionsGroup
                          handleDetail={() => handleDetail(item)}
                          handleEdit={() => handleEdit(item)}
                          handleDelete={() => handleDelete(item)}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2 font-mono text-sm">
                      {item.sales_category_code} - {item.sales_category_name}
                    </td>
                    <td className="px-4 py-2 font-mono text-sm">{item.code}</td>
                    <td className="px-4 py-2 font-medium">{item.name}</td>
                    <td className="px-4 py-2 text-gray-600 max-w-xs truncate">
                      {item.address}
                    </td>
                    <td className="px-4 py-2 text-gray-600 max-w-xs truncate">
                      {item.phone}
                    </td>
                    <td className="px-4 py-2">
                      <Badge
                        variant={
                          item.status === true ? "success" : "destructive"
                        }
                      >
                        {item.status === true ? "Aktif" : "Nonaktif"}
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
          <FormData
            form={form}
            setForm={setForm}
            onCancel={() => {
              setForm({ status: 1 });
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