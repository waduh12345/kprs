"use client";

import { useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { displayDate, formatRupiahWithRp } from "@/lib/format-utils";
import QRCode from "react-qr-code";

import { useGetAnggotaByIdQuery } from "@/services/koperasi-service/anggota.service";
import { useGetSimpananListQuery } from "@/services/admin/simpanan/simpanan.service";
import { useGetPinjamanListQuery } from "@/services/admin/pinjaman.service";
import { useGetTransactionListQuery } from "@/services/admin/transaction.service";
import type { AnggotaKoperasi } from "@/types/koperasi-types/anggota";
import type { Simpanan } from "@/types/admin/simpanan";

type PinjamanRow = {
  id: number;
  tanggal: string;
  reference: string;
  kategori: string;
  nominal: number;
  tenor: number;
  bungaPersen: number;
  angsuranBulanan: number;
  status: number; // 0 pending, 1 approved, 2 rejected
};

type TransaksiRow = {
  id: number;
  tanggal: string;
  reference: string;
  total: number;
  grandTotal: number;
  status: number; // -1, 0, 2 (sesuai sample)
  tipe: string; // online/offline
  paymentType: string; // automatic / dsb
};

/* =================== Helpers (tanpa any) =================== */
const isNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const toNum = (v: unknown): number | undefined => {
  if (isNum(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};
const toStr = (v: unknown): string | undefined =>
  typeof v === "string" ? v : undefined;
const rec = (v: unknown): Record<string, unknown> =>
  (v ?? {}) as Record<string, unknown>;

function formatRupiah(n: number) {
  try {
    return new Intl.NumberFormat("id-ID").format(n);
  } catch {
    return String(n);
  }
}

function statusBadgeSimpanan(code: number) {
  if (code === 1) return <Badge variant="success">Sukses</Badge>;
  if (code === 2) return <Badge variant="destructive">Gagal</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}

function statusBadgeAnggota(code: number) {
  if (code === 1) return <Badge variant="success">APPROVED</Badge>;
  if (code === 2) return <Badge variant="destructive">REJECTED</Badge>;
  return <Badge variant="secondary">PENDING</Badge>;
}

function statusBadgePinjaman(code: number) {
  if (code === 1) return <Badge variant="success">APPROVED</Badge>;
  if (code === 2) return <Badge variant="destructive">REJECTED</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}

function statusBadgeTransaksi(code: number) {
  if (code === 2) return <Badge variant="success">Selesai</Badge>;
  if (code === -1) return <Badge variant="destructive">Dibatalkan</Badge>;
  return <Badge variant="secondary">Diproses</Badge>;
}

function genderLabel(gender: string | null | undefined) {
  if (!gender) return "—";
  const g = String(gender).toUpperCase();
  if (g === "M" || g === "L") return "Laki-laki";
  if (g === "F" || g === "P") return "Perempuan";
  return gender;
}

function getAnggotaDisplay(anggota: AnggotaKoperasi | undefined) {
  if (!anggota) return { name: "—", email: "—", phone: "—", gender: "—", birthDate: "—", birthPlace: "—", nik: "—", npwp: "—", address: "—" };
  const name = anggota.user_name ?? anggota.name ?? anggota.individu?.name ?? anggota.perusahaan?.name ?? "—";
  const email = anggota.user_email ?? anggota.email ?? anggota.individu?.email ?? anggota.perusahaan?.email ?? "—";
  const phone = anggota.user_phone ?? anggota.phone ?? anggota.individu?.phone ?? anggota.perusahaan?.phone ?? "—";
  const gender = genderLabel(anggota.gender ?? anggota.individu?.gender ?? null);
  const birthDate = displayDate(anggota.birth_date ?? anggota.individu?.birth_date ?? null) || "—";
  const birthPlace = anggota.birth_place ?? anggota.individu?.birth_place ?? "—";
  const nik = anggota.nik ?? anggota.individu_nik ?? anggota.individu?.nik ?? "—";
  const npwp = anggota.npwp ?? anggota.individu_npwp ?? anggota.perusahaan_npwp ?? anggota.perusahaan?.npwp ?? "—";
  const address = anggota.address ?? anggota.individu?.address ?? anggota.perusahaan?.address ?? "—";
  return { name, email, phone, gender, birthDate, birthPlace, nik, npwp, address };
}

function RowLabel({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center text-sm gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right truncate">{value ?? "—"}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="font-medium text-sm">{value ?? "—"}</div>
    </div>
  );
}

function TablePagination({
  page,
  total,
  perPage = 10,
  onChange,
}: {
  page: number;
  total: number;
  perPage?: number;
  onChange: (page: number) => void;
}) {
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  return (
    <div className="p-3 flex items-center justify-between bg-muted/40 border-t">
      <div className="text-xs sm:text-sm">
        Halaman <strong>{page}</strong> dari <strong>{lastPage}</strong>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Sebelumnya
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= lastPage}
          onClick={() => onChange(page + 1)}
        >
          Berikutnya
        </Button>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="p-6">Memuat riwayat…</div>}>
      <HistoryPageInner />
    </Suspense>
  );
}

function HistoryPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const anggotaIdParam = sp.get("anggota_id");
  const anggotaId = anggotaIdParam ? Number(anggotaIdParam) : undefined;

  // Biodata anggota
  const { data: anggota, isFetching: loadingAnggota } = useGetAnggotaByIdQuery(
    anggotaId as number,
    { skip: !anggotaId }
  );

  // Pagination per tab
  const PER_PAGE = 10;
  const [tab, setTab] = useState<"simpanan" | "pinjaman" | "pembayaran">(
    "simpanan"
  );
  const [pageS, setPageS] = useState(1);
  const [pageL, setPageL] = useState(1);
  const [pageP, setPageP] = useState(1);

  const userId = anggota?.user_id;

  // Query list by user_id
  const { data: simpananRes } = useGetSimpananListQuery(
    { user_id: userId as number, page: pageS, paginate: PER_PAGE },
    { skip: !userId }
  );
  const { data: pinjamanRes } = useGetPinjamanListQuery(
    { user_id: userId as number, page: pageL, paginate: PER_PAGE },
    { skip: !userId }
  );
  const { data: transaksiRes } = useGetTransactionListQuery(
    { user_id: userId as number, page: pageP, paginate: PER_PAGE },
    { skip: !userId }
  );

  /* ====== SIMPANAN: typed dari service (data = Simpanan[]) ====== */
  const simpananList: Simpanan[] = useMemo(
    () => simpananRes?.data ?? [],
    [simpananRes?.data]
  );
  const simpananTotal = simpananRes?.total ?? 0;

  function simpananPaymentLabel(s: Simpanan): string {
    const ch = s.payment?.channel ?? s.payment_channel ?? s.payment_method;
    return ch ? String(ch).toUpperCase() : "—";
  }

  /* ====== NORMALISASI untuk Pinjaman & Transaksi (response Laravel-style) ====== */
  const takePage = (
    raw: unknown
  ): { list: ReadonlyArray<Record<string, unknown>>; total: number } => {
    const top = rec(raw);
    const inner = rec(top.data);
    const arr = Array.isArray(inner.data)
      ? (inner.data as ReadonlyArray<Record<string, unknown>>)
      : [];
    const total = toNum(inner.total) ?? arr.length;
    return { list: arr, total };
  };

  // PINJAMAN
  const pinjamanParsed = useMemo(() => takePage(pinjamanRes), [pinjamanRes]);
  const pinjamanList: PinjamanRow[] = useMemo(
    () =>
      pinjamanParsed.list.map((row, i) => {
        const r = rec(row);
        return {
          id: toNum(r.id) ?? i + 1,
          tanggal:
            toStr(r.date) || toStr(r.created_at) || toStr(r.updated_at) || "",
          reference: toStr(r.reference) || "-",
          kategori: toStr(r.category_name) || "-",
          nominal: toNum(r.nominal) ?? 0,
          tenor: toNum(r.tenor) ?? 0,
          bungaPersen: toNum(r.interest_rate) ?? 0,
          angsuranBulanan: toNum(r.monthly_installment) ?? 0,
          status: toNum(r.status) ?? 0,
        };
      }),
    [pinjamanParsed.list]
  );
  const pinjamanTotal = pinjamanParsed.total;

  // TRANSAKSI (Pembayaran)
  const transaksiParsed = useMemo(() => takePage(transaksiRes), [transaksiRes]);
  const pembayaranList: TransaksiRow[] = useMemo(
    () =>
      transaksiParsed.list.map((row, i) => {
        const r = rec(row);
        return {
          id: toNum(r.id) ?? i + 1,
          tanggal:
            toStr(r.created_at) || toStr(r.updated_at) || toStr(r.date) || "",
          reference: toStr(r.reference) || "-",
          total: toNum(r.total) ?? 0,
          grandTotal: toNum(r.grand_total) ?? 0,
          status: toNum(r.status) ?? 0,
          tipe: (toStr(r.type) || "-").toUpperCase(),
          paymentType: (toStr(r.payment_type) || "-").toUpperCase(),
        };
      }),
    [transaksiParsed.list]
  );
  const pembayaranTotal = transaksiParsed.total;

  /* ====== AGGREGATES untuk transaksi ====== */
  const totalGrand = useMemo(
    () => pembayaranList.reduce((acc, it) => acc + it.grandTotal, 0),
    [pembayaranList]
  );

  const handleTabChange = (v: string) =>
    setTab(v as "simpanan" | "pinjaman" | "pembayaran");

  const display = getAnggotaDisplay(anggota);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Riwayat Anggota
        </h1>
        <Button variant="outline" onClick={() => router.back()}>
          Kembali
        </Button>
      </div>

      {/* ====== TOP: KARTU & BIODATA (2 kolom) ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Kartu anggota (ringkas) */}
        <div className="lg:col-span-5">
          <Card className="overflow-hidden border border-gray-200/80 shadow-sm">
            <div className="bg-gradient-to-br from-rose-600 to-red-700 px-5 py-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                  {display.name.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white truncate max-w-[200px]">
                    {display.name}
                  </h2>
                  <p className="text-rose-100 text-sm">
                    No. Anggota: {anggota?.reference ?? "—"}
                  </p>
                  {anggota && statusBadgeAnggota(anggota.status)}
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <RowLabel label="Email" value={display.email} />
              <RowLabel label="Telepon" value={display.phone} />
              <RowLabel label="Tgl. Lahir" value={display.birthDate} />
              <div className="pt-3 border-t flex justify-center">
                <div className="bg-white p-2 rounded-lg border shadow-sm">
                  <QRCode
                    value={String(anggota?.reference ?? anggota?.id ?? "")}
                    size={80}
                  />
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground">Scan QR</p>
            </div>
          </Card>
        </div>

        {/* RIGHT: BIODATA detail */}
        <div className="lg:col-span-7">
          <Card className="overflow-hidden border border-gray-200/80 shadow-sm">
            <div className="px-5 py-4 border-b bg-muted/30">
              <h2 className="text-base font-semibold text-gray-900">
                Biodata Lengkap {loadingAnggota ? "(memuat…)" : ""}
              </h2>
            </div>

            {anggota ? (
              <div className="p-5 space-y-6">
                <Section title="Identitas">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Nomor Anggota" value={anggota.reference} />
                    <Field label="Tipe" value={anggota.type} />
                    <Field label="Status" value={statusBadgeAnggota(anggota.status)} />
                  </div>
                </Section>
                <Section title="Kontak">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Nama" value={display.name} />
                    <Field label="Email" value={display.email} />
                    <Field label="Telepon" value={display.phone} />
                    <div className="sm:col-span-2">
                      <Field label="Alamat" value={display.address} />
                    </div>
                  </div>
                </Section>
                <Section title="Data Pribadi">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Gender" value={display.gender} />
                    <Field label="Tempat Lahir" value={display.birthPlace} />
                    <Field label="Tanggal Lahir" value={display.birthDate} />
                    <Field label="NIK" value={display.nik} />
                    <Field label="NPWP" value={display.npwp} />
                  </div>
                </Section>
              </div>
            ) : !loadingAnggota ? (
              <div className="p-8 text-center text-muted-foreground">
                Data anggota tidak tersedia. Pastikan parameter <code className="text-xs bg-muted px-1 rounded">anggota_id</code> ada.
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                Memuat biodata…
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ====== BOTTOM: TAB + TABEL (full width) ====== */}
      <Card className="overflow-hidden border border-gray-200/80 shadow-sm">
        <Tabs value={tab} onValueChange={handleTabChange}>
          <div className="px-4 pt-4">
            <TabsList className="w-full sm:w-auto justify-start gap-1 bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="simpanan" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Riwayat Simpanan
              </TabsTrigger>
              <TabsTrigger value="pinjaman" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Riwayat Pinjaman
              </TabsTrigger>
              <TabsTrigger value="pembayaran" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Riwayat Pembayaran
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="px-4 py-4">
            {/* SIMPANAN — typed Simpanan[] dari service */}
            <TabsContent value="simpanan" className="m-0">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-4 py-3 whitespace-nowrap font-medium">Tanggal</th>
                      <th className="px-4 py-3 whitespace-nowrap font-medium">Referensi</th>
                      <th className="px-4 py-3 whitespace-nowrap font-medium">Kategori</th>
                      <th className="px-4 py-3 whitespace-nowrap font-medium text-right">Nominal</th>
                      <th className="px-4 py-3 whitespace-nowrap font-medium">Status</th>
                      <th className="px-4 py-3 whitespace-nowrap font-medium">Pembayaran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simpananList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          Belum ada riwayat simpanan.
                        </td>
                      </tr>
                    ) : (
                      simpananList.map((row) => (
                        <tr key={row.id} className="border-t border-gray-100 hover:bg-muted/30">
                          <td className="px-4 py-3 whitespace-nowrap">
                            {displayDate(row.date) || row.date}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">{row.reference}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{row.category_name ?? "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-right font-medium">
                            {formatRupiahWithRp(row.nominal)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{statusBadgeSimpanan(row.status)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{simpananPaymentLabel(row)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {simpananTotal > PER_PAGE && (
                <TablePagination
                  page={pageS}
                  total={simpananTotal}
                  perPage={PER_PAGE}
                  onChange={setPageS}
                />
              )}
            </TabsContent>

            {/* PINJAMAN */}
            <TabsContent value="pinjaman" className="m-0">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Referensi</th>
                      <th className="px-4 py-3">Kategori</th>
                      <th className="px-4 py-3 text-right">Pokok</th>
                      <th className="px-4 py-3">Tenor (bln)</th>
                      <th className="px-4 py-3">Bunga (%)</th>
                      <th className="px-4 py-3 text-right">Angsuran/Bln</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pinjamanList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                          Belum ada riwayat pinjaman.
                        </td>
                      </tr>
                    ) : pinjamanList.map((row) => (
                      <tr key={row.id} className="border-t border-gray-100 hover:bg-muted/30">
                        <td className="px-4 py-3 whitespace-nowrap">{displayDate(row.tanggal) || row.tanggal}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">{row.reference}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{row.kategori}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">Rp {formatRupiah(row.nominal)}</td>
                        <td className="px-4 py-3">{row.tenor}</td>
                        <td className="px-4 py-3">{row.bungaPersen}</td>
                        <td className="px-4 py-3 text-right">Rp {formatRupiah(row.angsuranBulanan)}</td>
                        <td className="px-4 py-3">{statusBadgePinjaman(row.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <TablePagination
                page={pageL}
                total={pinjamanTotal}
                onChange={setPageL}
              />
            </TabsContent>

            {/* PEMBAYARAN */}
            <TabsContent value="pembayaran" className="m-0">
              <div className="flex items-center justify-between mb-4 text-sm">
                <span className="text-muted-foreground">
                  Total Grand: <strong className="text-foreground">Rp {formatRupiah(totalGrand)}</strong>
                </span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Referensi</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-right">Grand Total</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Tipe</th>
                      <th className="px-4 py-3">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pembayaranList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          Belum ada riwayat pembayaran.
                        </td>
                      </tr>
                    ) : pembayaranList.map((row) => (
                      <tr key={row.id} className="border-t border-gray-100 hover:bg-muted/30">
                        <td className="px-4 py-3 whitespace-nowrap">{displayDate(row.tanggal) || row.tanggal}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">{row.reference}</td>
                        <td className="px-4 py-3 text-right">Rp {formatRupiah(row.total)}</td>
                        <td className="px-4 py-3 text-right font-medium">Rp {formatRupiah(row.grandTotal)}</td>
                        <td className="px-4 py-3">{statusBadgeTransaksi(row.status)}</td>
                        <td className="px-4 py-3">{row.tipe}</td>
                        <td className="px-4 py-3">{row.paymentType}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <TablePagination
                page={pageP}
                total={pembayaranTotal}
                onChange={setPageP}
              />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
