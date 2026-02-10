"use client";

import { useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import useModal from "@/hooks/use-modal";
import {
  useGetMasterTarifBungaListQuery,
  useCreateMasterTarifBungaMutation,
  useUpdateMasterTarifBungaMutation,
  useDeleteMasterTarifBungaMutation,
  useLazyGetMasterTarifBungaImportTemplateQuery,
  useImportMasterTarifBungaMigrasiMutation,
} from "@/services/admin/konfigurasi/master-simpanan-berjangka.service";
import type { MasterTarifBunga } from "@/types/admin/konfigurasi/master-simpanan-berjangka";
import FormTarifBunga from "@/components/form-modal/admin/konfigurasi/tarif-bunga-form";
import { Input } from "@/components/ui/input";
import ActionsGroup from "@/components/admin-components/actions-group";
import { Plus, FileDown, FileUp, Loader2 } from "lucide-react";

type TenorBulan = 3 | 6 | 12;

export default function TarifBungaPage() {
  const [form, setForm] = useState<Partial<MasterTarifBunga>>({
    tenor_bulan: 3,
    rate: 0,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [readonly, setReadonly] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");

  const { data, isLoading, refetch } = useGetMasterTarifBungaListQuery({
    page: currentPage,
    paginate: itemsPerPage,
    ...(query && { search: query }),
  });

  const list = useMemo(() => data?.data ?? [], [data]);
  const lastPage = useMemo(() => data?.last_page ?? 1, [data]);

  const [create, { isLoading: isCreating }] = useCreateMasterTarifBungaMutation();
  const [update, { isLoading: isUpdating }] = useUpdateMasterTarifBungaMutation();
  const [deleteTarifBunga] = useDeleteMasterTarifBungaMutation();
  const [getTemplate, { isLoading: isTemplateLoading }] =
    useLazyGetMasterTarifBungaImportTemplateQuery();
  const [importMigrasi, { isLoading: isImporting }] =
    useImportMasterTarifBungaMigrasiMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    try {
      const blob = await getTemplate().unwrap();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template_tarif_bunga.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      Swal.fire("Berhasil", "Template berhasil diunduh", "success");
    } catch (error) {
      console.error(error);
      Swal.fire("Gagal", "Gagal mengunduh template", "error");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const result = await importMigrasi(file).unwrap();
      await refetch();
      const hasErrors = result.failed > 0 && result.errors && Object.keys(result.errors).length > 0;
      Swal.fire({
        title: result.failed > 0 ? "Import Selesai dengan Catatan" : "Import Berhasil",
        html: `
          <p>${result.message}</p>
          <p><strong>Berhasil:</strong> ${result.processed}</p>
          <p><strong>Gagal:</strong> ${result.failed}</p>
          ${hasErrors ? `<pre class="text-left text-xs mt-2 max-h-32 overflow-auto bg-gray-100 p-2 rounded">${Object.entries(result.errors).map(([row, msg]) => `Baris ${row}: ${msg}`).join("\n")}</pre>` : ""}
        `,
        icon: result.failed > 0 ? "warning" : "success",
      });
    } catch (error) {
      console.error(error);
      Swal.fire("Gagal", "Import gagal. Periksa format file.", "error");
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        kode_bunga: form.kode_bunga ?? "",
        tenor: form.tenor ?? "",
        tenor_bulan: (form.tenor_bulan ?? 3) as TenorBulan,
        rate: form.rate ?? 0,
      };

      if (editingId) {
        await update({ id: editingId, payload }).unwrap();
        Swal.fire("Sukses", "Tarif bunga diperbarui", "success");
      } else {
        await create(payload).unwrap();
        Swal.fire("Sukses", "Tarif bunga ditambahkan", "success");
      }

      setForm({ tenor_bulan: 3, rate: 0 });
      setEditingId(null);
      await refetch();
      closeModal();
    } catch (error) {
      console.error(error);
      Swal.fire("Gagal", "Gagal menyimpan data", "error");
    }
  };

  const handleEdit = (item: MasterTarifBunga) => {
    setForm({ ...item });
    setEditingId(item.id);
    setReadonly(false);
    openModal();
  };

  const handleDetail = (item: MasterTarifBunga) => {
    setForm(item);
    setReadonly(true);
    openModal();
  };

  const handleDelete = async (item: MasterTarifBunga) => {
    const confirm = await Swal.fire({
      title: "Yakin hapus tarif bunga?",
      text: `${item.kode_bunga} - ${item.tenor}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteTarifBunga(item.id).unwrap();
        await refetch();
        Swal.fire("Berhasil", "Tarif bunga dihapus", "success");
      } catch (error) {
        Swal.fire("Gagal", "Gagal menghapus tarif bunga", "error");
        console.error(error);
      }
    }
  };

  const filteredData = useMemo(() => {
    if (!query) return list;
    const q = query.toLowerCase();
    return list.filter(
      (item) =>
        item.kode_bunga?.toLowerCase().includes(q) ||
        item.tenor?.toLowerCase().includes(q) ||
        String(item.tenor_bulan).includes(q) ||
        String(item.rate).includes(q)
    );
  }, [list, query]);

  const colSpan = 7;

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-md bg-white p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Cari tarif bunga..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full sm:max-w-xs"
            />
          </div>
          <div className="shrink-0 flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleImportFile}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              disabled={isTemplateLoading}
            >
              {isTemplateLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              Template Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleImportClick}
              disabled={isImporting}
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileUp className="h-4 w-4 mr-2" />
              )}
              Import
            </Button>
            <Button onClick={openModal}>
              <Plus className="h-4 w-4 mr-2" /> Tarif Bunga
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-2">Aksi</th>
                <th className="px-4 py-2">Kode Bunga</th>
                <th className="px-4 py-2">Tenor</th>
                <th className="px-4 py-2">Tenor (Bulan)</th>
                <th className="px-4 py-2">Rate (%)</th>
                <th className="px-4 py-2">Dibuat</th>
                <th className="px-4 py-2">Diperbarui</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={colSpan} className="text-center p-4">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="text-center p-4">
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
                      {item.kode_bunga}
                    </td>
                    <td className="px-4 py-2 font-medium">{item.tenor}</td>
                    <td className="px-4 py-2 font-medium">{item.tenor_bulan}</td>
                    <td className="px-4 py-2 font-medium">{item.rate}%</td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {new Date(item.updated_at).toLocaleDateString("id-ID")}
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
          <FormTarifBunga
            form={form}
            setForm={setForm}
            onCancel={() => {
              setForm({ tenor_bulan: 3, rate: 0 });
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
