"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useGetAnggotaListQuery,
  useGetAnggotaStatusLogsQuery,
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
import { HistoryIcon, FileDown, ArrowRight, User, Clock } from "lucide-react";
import { displayDate } from "@/lib/format-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const ITEMS_PER_PAGE = 10;

function statusBadge(status: number) {
  if (status === 1) return <Badge variant="success">APPROVED</Badge>;
  if (status === 2) return <Badge variant="destructive">REJECTED</Badge>;
  return <Badge variant="secondary">PENDING</Badge>;
}

export default function LaporanPerubahanStatusPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");
  const [selectedAnggotaId, setSelectedAnggotaId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading } = useGetAnggotaListQuery(
    {
      page: currentPage,
      paginate: ITEMS_PER_PAGE,
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const list = useMemo(() => data?.data ?? [], [data]);
  const lastPage = useMemo(() => data?.last_page ?? 1, [data]);
  const total = useMemo(() => data?.total ?? 0, [data]);

  const filteredList = useMemo(() => {
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((it: AnggotaKoperasi) =>
      [
        it.reference,
        it.user_name,
        it.name,
        it.user_email,
        it.email,
        it.user_phone,
        it.phone,
      ].some((f) => String(f ?? "").toLowerCase().includes(q))
    );
  }, [list, query]);

  const handleExportExcel = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert("Permintaan export laporan perubahan status telah diproses.");
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Laporan Perubahan Status Anggota
        </h1>
      </div>

      <ProdukToolbar
        onSearchChange={(q: string) => setQuery(q)}
        enableStatusFilter={false}
        showAddButton={false}
        showTemplateCsvButton={false}
        enableImport={false}
        enableExport
        onExportExcel={handleExportExcel}
        exportLabel={isExporting ? "Memproses..." : "Export Laporan"}
        exportIcon={<FileDown className="h-4 w-4 mr-2" />}
      />

      <Card className="overflow-hidden border border-gray-200/80 shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-muted-foreground">Aksi</th>
                <th className="px-4 py-3 font-medium">Nomor Anggota</th>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Status Saat Ini</th>
                <th className="px-4 py-3 font-medium">Riwayat Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Tidak ada data anggota yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-gray-100 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <ActionsGroup
                        handleDetail={() =>
                          router.push(
                            `/admin/anggota/add-data?mode=detail&id=${item.id}`
                          )
                        }
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">
                      {item.reference}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                      {item.user_name ?? item.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {statusBadge(item.status)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => setSelectedAnggotaId(item.id)}
                      >
                        <Clock className="size-3.5" />
                        Lihat log status
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>

        <div className="p-4 flex items-center justify-between bg-muted/30 border-t">
          <p className="text-sm text-muted-foreground">
            Menampilkan {filteredList.length} dari {total} anggota
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= lastPage}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal log status per anggota */}
      <Dialog
        open={selectedAnggotaId !== null}
        onOpenChange={(open) => !open && setSelectedAnggotaId(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <StatusLogPanel
            anggotaId={selectedAnggotaId}
            onClose={() => setSelectedAnggotaId(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusLogPanel({
  anggotaId,
  onClose,
}: {
  anggotaId: number | null;
  onClose: () => void;
}) {
  const { data: logs, isLoading } = useGetAnggotaStatusLogsQuery(anggotaId!, {
    skip: !anggotaId,
  });

  const list = useMemo(() => logs ?? [], [logs]);

  if (!anggotaId) return null;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Clock className="size-5 text-muted-foreground" />
          Riwayat Perubahan Status
        </DialogTitle>
        <DialogDescription>
          Log perubahan status anggota (dari API detail anggota).
        </DialogDescription>
      </DialogHeader>

      <div className="mt-2 -mx-1">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Memuat riwayat...
          </div>
        ) : list.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground rounded-lg bg-muted/30">
            Belum ada riwayat perubahan status untuk anggota ini.
          </div>
        ) : (
          <ul className="space-y-0">
            {list.map((log, index) => (
              <li
                key={log.id}
                className="relative flex gap-4 py-4 px-3 rounded-lg hover:bg-muted/30 transition-colors"
              >
                {index < list.length - 1 && (
                  <div
                    className="absolute left-[19px] top-10 bottom-0 w-px bg-border"
                    aria-hidden
                  />
                )}
                <div className="relative z-0 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background">
                  <ArrowRight className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {statusBadge(log.from_status)}
                    <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                    {statusBadge(log.to_status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {displayDate(log.created_at)}
                    </span>
                    {log.changed_by_name && (
                      <span className="flex items-center gap-1">
                        <User className="size-3" />
                        {log.changed_by_name}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
