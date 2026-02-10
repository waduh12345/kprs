"use client";

import { useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import useModal from "@/hooks/use-modal";
import {
  useGetMasterBilyetBerjangkaListQuery,
  useCreateMasterBilyetBerjangkaMutation,
  useUpdateMasterBilyetBerjangkaMutation,
  useDeleteMasterBilyetBerjangkaMutation,
  useLazyGetMasterBilyetBerjangkaImportTemplateQuery,
  useImportMasterBilyetBerjangkaMigrasiMutation,
  useGetMasterBilyetBerjangkaLogListQuery,
} from "@/services/admin/konfigurasi/master-simpanan-berjangka.service";
import type {
  MasterBilyetBerjangka,
  MasterBilyetBerjangkaLog,
} from "@/types/admin/konfigurasi/master-simpanan-berjangka";
import FormBilyetBerjangka from "@/components/form-modal/admin/konfigurasi/bilyet-berjangka-form";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import ActionsGroup from "@/components/admin-components/actions-group";
import { Plus, FileDown, FileUp, Loader2, ScrollText } from "lucide-react";

type TenorBulan = 3 | 6 | 12;
type HariTenor = 90 | 180 | 360;

const defaultForm: Partial<MasterBilyetBerjangka> = {
  status: 1,
  tenor_bulan: 3,
  hari_tenor: 90,
  penalti_cair_awal: 0,
  minimal_simpanan: 0,
  bunga_tahunan: 0,
};

export default function BilyetBerjangkaPage() {
  const [form, setForm] = useState<Partial<MasterBilyetBerjangka>>(defaultForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [readonly, setReadonly] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");

  const { data, isLoading, refetch } = useGetMasterBilyetBerjangkaListQuery({
    page: currentPage,
    paginate: itemsPerPage,
    ...(query && { search: query }),
  });

  const list = useMemo(() => data?.data ?? [], [data]);
  const lastPage = useMemo(() => data?.last_page ?? 1, [data]);

  const [create, { isLoading: isCreating }] =
    useCreateMasterBilyetBerjangkaMutation();
  const [update, { isLoading: isUpdating }] =
    useUpdateMasterBilyetBerjangkaMutation();
  const [deleteBilyet] = useDeleteMasterBilyetBerjangkaMutation();
  const [getTemplate, { isLoading: isTemplateLoading }] =
    useLazyGetMasterBilyetBerjangkaImportTemplateQuery();
  const [importMigrasi, { isLoading: isImporting }] =
    useImportMasterBilyetBerjangkaMigrasiMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [logModalBilyetId, setLogModalBilyetId] = useState<number | null>(null);
  const [logModalBilyetLabel, setLogModalBilyetLabel] = useState<string>("");
  const logPaginate = 20;

  const { data: logData, isLoading: isLogLoading } =
    useGetMasterBilyetBerjangkaLogListQuery(
      logModalBilyetId != null
        ? {
            paginate: logPaginate,
            master_bilyet_berjangka_id: logModalBilyetId,
          }
        : { paginate: 1 },
      { skip: logModalBilyetId == null }
    );
  const logList = useMemo(() => logData?.data ?? [], [logData]);

  const openLogModal = (item: MasterBilyetBerjangka) => {
    setLogModalBilyetId(item.id);
    setLogModalBilyetLabel(`${item.kode_bilyet} — ${item.nama_produk}`);
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await getTemplate().unwrap();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template_bilyet_berjangka.xlsx";
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
      const hasErrors =
        result.failed > 0 && result.errors && Object.keys(result.errors).length > 0;
      Swal.fire({
        title:
          result.failed > 0 ? "Import Selesai dengan Catatan" : "Import Berhasil",
        html: `
          <p>${result.message}</p>
          <p><strong>Berhasil:</strong> ${result.processed}</p>
          <p><strong>Gagal:</strong> ${result.failed}</p>
          ${
            hasErrors
              ? `<pre class="text-left text-xs mt-2 max-h-32 overflow-auto bg-gray-100 p-2 rounded">${Object.entries(result.errors)
                  .map(([row, msg]) => `Baris ${row}: ${msg}`)
                  .join("\n")}</pre>`
              : ""
          }
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
        kode_bilyet: form.kode_bilyet ?? "",
        nama_produk: form.nama_produk ?? "",
        tenor_bulan: (form.tenor_bulan ?? 3) as TenorBulan,
        hari_tenor: (form.hari_tenor ?? 90) as HariTenor,
        bunga_tahunan: form.bunga_tahunan ?? 0,
        metode_bunga: form.metode_bunga ?? "",
        metode_pembayaran: form.metode_pembayaran ?? "",
        minimal_simpanan: form.minimal_simpanan ?? 0,
        penalti_cair_awal: form.penalti_cair_awal ?? 0,
        status: form.status ?? 1,
      };

      if (editingId) {
        await update({ id: editingId, payload }).unwrap();
        Swal.fire("Sukses", "Bilyet berjangka diperbarui", "success");
      } else {
        await create(payload).unwrap();
        Swal.fire("Sukses", "Bilyet berjangka ditambahkan", "success");
      }

      setForm(defaultForm);
      setEditingId(null);
      await refetch();
      closeModal();
    } catch (error) {
      console.error(error);
      Swal.fire("Gagal", "Gagal menyimpan data", "error");
    }
  };

  const handleEdit = (item: MasterBilyetBerjangka) => {
    setForm({ ...item });
    setEditingId(item.id);
    setReadonly(false);
    openModal();
  };

  const handleDetail = (item: MasterBilyetBerjangka) => {
    setForm(item);
    setReadonly(true);
    openModal();
  };

  const handleDelete = async (item: MasterBilyetBerjangka) => {
    const confirm = await Swal.fire({
      title: "Yakin hapus bilyet berjangka?",
      text: `${item.kode_bilyet} - ${item.nama_produk}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
    });

    if (confirm.isConfirmed) {
      try {
        await deleteBilyet(item.id).unwrap();
        await refetch();
        Swal.fire("Berhasil", "Bilyet berjangka dihapus", "success");
      } catch (error) {
        Swal.fire("Gagal", "Gagal menghapus bilyet berjangka", "error");
        console.error(error);
      }
    }
  };

  const filteredData = useMemo(() => {
    if (!query) return list;
    const q = query.toLowerCase();
    return list.filter(
      (item) =>
        item.kode_bilyet?.toLowerCase().includes(q) ||
        item.nama_produk?.toLowerCase().includes(q) ||
        String(item.tenor_bulan).includes(q) ||
        String(item.bunga_tahunan).includes(q) ||
        item.metode_bunga?.toLowerCase().includes(q) ||
        item.metode_pembayaran?.toLowerCase().includes(q)
    );
  }, [list, query]);

  const colSpan = 10;

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-md bg-white p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Cari bilyet berjangka..."
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
              <Plus className="h-4 w-4 mr-2" /> Bilyet Berjangka
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
                <th className="px-4 py-2">Kode</th>
                <th className="px-4 py-2">Nama Produk</th>
                <th className="px-4 py-2">Tenor</th>
                <th className="px-4 py-2">Bunga (%)</th>
                <th className="px-4 py-2">Min. Simpanan</th>
                <th className="px-4 py-2">Metode Bunga</th>
                <th className="px-4 py-2">Penalti</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Dibuat</th>
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
                      <div className="flex gap-2 flex-wrap">
                        <ActionsGroup
                          handleDetail={() => handleDetail(item)}
                          handleEdit={() => handleEdit(item)}
                          handleDelete={() => handleDelete(item)}
                          additionalActions={
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openLogModal(item)}
                              className="text-muted-foreground"
                            >
                              <ScrollText className="h-4 w-4 mr-1" />
                              Log
                            </Button>
                          }
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2 font-mono text-sm">
                      {item.kode_bilyet}
                    </td>
                    <td className="px-4 py-2 font-medium">{item.nama_produk}</td>
                    <td className="px-4 py-2 font-medium">
                      {item.tenor_bulan} bln
                    </td>
                    <td className="px-4 py-2 font-medium">
                      {item.bunga_tahunan}%
                    </td>
                    <td className="px-4 py-2 font-medium">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(item.minimal_simpanan)}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {item.metode_bunga || "-"}
                    </td>
                    <td className="px-4 py-2 font-medium">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(item.penalti_cair_awal ?? 0)}
                    </td>
                    <td className="px-4 py-2">
                      <Badge
                        variant={
                          item.status === 1
                            ? "success"
                            : item.status === 2
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {item.status === 1
                          ? "Aktif"
                          : item.status === 2
                            ? "Terpakai"
                            : "Tidak Aktif"}
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

      {logModalBilyetId != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setLogModalBilyetId(null)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg w-full max-w-4xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <h3 className="font-semibold flex items-center gap-2">
                <ScrollText className="h-5 w-5" />
                Log: {logModalBilyetLabel}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLogModalBilyetId(null)}
              >
                ✕
              </Button>
            </div>
            <div className="overflow-auto p-4">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left sticky top-0">
                  <tr>
                    <th className="px-4 py-2">Waktu</th>
                    <th className="px-4 py-2">Event</th>
                    <th className="px-4 py-2">Simpanan Berjangka</th>
                    <th className="px-4 py-2">Status Lama</th>
                    <th className="px-4 py-2">Status Baru</th>
                  </tr>
                </thead>
                <tbody>
                  {isLogLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-muted-foreground">
                        Memuat log...
                      </td>
                    </tr>
                  ) : logList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-muted-foreground">
                        Tidak ada log untuk bilyet ini
                      </td>
                    </tr>
                  ) : (
                    logList.map((log: MasterBilyetBerjangkaLog) => (
                      <tr key={log.id} className="border-t hover:bg-muted/20">
                        <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                          {new Date(log.created_at).toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-2">
                          <Badge variant="secondary">{log.event}</Badge>
                        </td>
                        <td className="px-4 py-2">
                          {log.simpanan_berjangka ? (
                            <span className="font-mono text-xs">
                              {log.simpanan_berjangka.no_bilyet}
                              {log.simpanan_berjangka.user?.anggota?.reference && (
                                <span className="block text-muted-foreground">
                                  {log.simpanan_berjangka.user.anggota.reference}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {log.old_status != null ? (
                            <Badge variant="outline">{log.old_status}</Badge>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {log.new_status != null ? (
                            <Badge variant="outline">{log.new_status}</Badge>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <FormBilyetBerjangka
            form={form}
            setForm={setForm}
            onCancel={() => {
              setForm(defaultForm);
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
