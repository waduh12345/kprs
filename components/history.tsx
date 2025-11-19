"use client";

import { useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { displayDate } from "@/lib/format-utils";
import QRCode from "react-qr-code";

import { useGetAnggotaByIdQuery } from "@/services/koperasi-service/anggota.service";
import { useGetSimpananListQuery } from "@/services/admin/simpanan/simpanan.service";
import { useGetPinjamanListQuery } from "@/services/admin/pinjaman.service";
import { useGetTransactionListQuery } from "@/services/admin/transaction.service";

type SimpananRow = {
  id: number;
  tanggal: string;
  reference: string;
  kategori: string;
  nominal: number;
  status: number;
  pembayaran: string;
};

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

function Badge({
  color = "gray",
  children,
}: {
  color?: "gray" | "green" | "red" | "amber" | "blue";
  children: React.ReactNode;
}) {
  const map: Record<typeof color, string> = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-sky-100 text-sky-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ${map[color]}`}
    >
      {children}
    </span>
  );
}

function statusBadgeSimpanan(code: number) {
  if (code === 1) return <Badge color="green">Sukses</Badge>;
  if (code === 2) return <Badge color="red">Gagal</Badge>;
  return <Badge>Pending</Badge>;
}

function statusBadgePinjaman(code: number) {
  if (code === 1) return <Badge color="green">APPROVED</Badge>;
  if (code === 2) return <Badge color="red">REJECTED</Badge>;
  return <Badge>Pending</Badge>;
}

function statusBadgeTransaksi(code: number) {
  if (code === 2) return <Badge color="green">Selesai</Badge>;
  if (code === -1) return <Badge color="red">Dibatalkan</Badge>;
  return <Badge color="amber">Diproses</Badge>;
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

  /* ====== NORMALISASI SESUAI RESPONSE SAMPLE ====== */
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

  // SIMPANAN
  const simpananParsed = useMemo(() => takePage(simpananRes), [simpananRes]);
  const simpananList: SimpananRow[] = useMemo(
    () =>
      simpananParsed.list.map((row, i) => {
        const r = rec(row);
        const payment = rec(r.payment);
        const channel =
          toStr(payment.channel) ||
          toStr(payment.payment_type) ||
          toStr(payment.driver) ||
          "";
        return {
          id: toNum(r.id) ?? i + 1,
          tanggal:
            toStr(r.date) || toStr(r.created_at) || toStr(r.updated_at) || "",
          reference: toStr(r.reference) || "-",
          kategori: toStr(r.category_name) || "-",
          nominal: toNum(r.nominal) ?? 0,
          status: toNum(r.status) ?? 0,
          pembayaran: channel ? channel.toUpperCase() : "-",
        };
      }),
    [simpananParsed.list]
  );
  const simpananTotal = simpananParsed.total;

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

  return (
    <div className="w-full space-y-6">
      {/* ====== TOP: KARTU & BIODATA (2 kolom) ====== */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        {/* LEFT: ID CARD STYLE */}
        <div className="col-span-12 lg:col-span-5">
          <Card className="relative overflow-hidden p-0 h-full min-h[460px] bg-white">
            {/* Strap & slot lanyard */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-4 h-8 w-28 bg-neutral-200 rounded-b-lg shadow" />
            <div className="absolute left-1/2 -translate-x-1/2 top-5 h-6 w-24 rounded-full bg-white/90 shadow" />

            {/* Top diagonal banner (merah) */}
            <div className="relative h-40">
              <div className="absolute inset-0 -skew-y-6 origin-top-left bg-gradient-to-r from-rose-600 via-red-600 to-rose-700" />
              <div className="absolute -bottom-10 -left-6 right-0 h-24 rotate-[-12deg] bg-white/95" />
            </div>

            {/* Foto bulat */}
            <div className="relative -mt-20 flex justify-center">
              <div className="relative">
                <div className="absolute -inset-8 rounded-full bg-gradient-to-tr from-rose-600 to-red-700 opacity-25" />
                <div className="relative p-1 rounded-full bg-gradient-to-tr from-rose-500 to-red-600">
                  <img
                    src="https://i.pinimg.com/1200x/4c/85/31/4c8531dbc05c77cb7a5893297977ac89.jpg"
                    alt="Foto Anggota"
                    className="w-28 h-28 rounded-full object-cover ring-4 ring-white shadow-md"
                  />
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="px-5 pt-3 pb-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  {anggota?.name ?? "-"}
                </h3>
                <p className="text-rose-600 text-xs font-medium">
                  Anggota Koperasi
                </p>
              </div>

              <div className="mt-5 grid grid-cols-12 gap-3 text-[13.5px] leading-5">
                <div className="col-span-12 space-y-2">
                  <div className="flex items-center">
                    <span className="w-16 text-muted-foreground">ID</span>
                    <span className="mx-2">:</span>
                    <span className="font-medium">
                      {anggota?.reference ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-16 text-muted-foreground">DOB</span>
                    <span className="mx-2">:</span>
                    <span className="font-medium">
                      {displayDate(anggota?.birth_date) || "—"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-16 text-muted-foreground">Phone</span>
                    <span className="mx-2">:</span>
                    <span className="font-medium">{anggota?.phone || "—"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-16 text-muted-foreground">E-mail</span>
                    <span className="mx-2">:</span>
                    <span className="font-medium truncate">
                      {anggota?.email || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* QR + label */}
              <div className="mt-4 flex flex-col items-end justify-center gap-3">
                <div className="bg-white p-2 rounded-xl border shadow-sm">
                  <QRCode
                    value={String(anggota?.reference ?? anggota?.id ?? "")}
                    size={96}
                  />
                </div>
                <h1 className="font-semibold">Scan QR Code</h1>
              </div>
            </div>

            {/* Dekorasi */}
            <div className="pointer-events-none absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-gradient-to-tr from-rose-700 via-red-500 to-rose-400 opacity-20" />
          </Card>
        </div>

        {/* RIGHT: BIODATA */}
        <div className="col-span-12 lg:col-span-7">
          <Card className="overflow-hidden bg-white h-full min-h-[460px] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-base font-semibold">
                Biodata Anggota {loadingAnggota ? "(memuat…)" : ""}
              </h2>
              <Button variant="outline" onClick={() => router.back()}>
                Tutup
              </Button>
            </div>

            {anggota ? (
              <div className="px-4 py-4 flex-1 overflow-auto">
                {/* Baris 1: Identitas akun */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <div className="text-muted-foreground">Nomor Anggota</div>
                    <div className="font-medium">
                      {anggota.reference || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Status</div>
                    <div className="font-medium">
                      {statusBadgePinjaman((anggota.status ?? 0) as number)}
                    </div>
                  </div>
                </div>

                {/* Baris 2: Kontak */}
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                  Kontak
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <div className="text-muted-foreground">Email</div>
                    <div className="font-medium">{anggota.email || "-"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Telepon</div>
                    <div className="font-medium">{anggota.phone || "-"}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-muted-foreground">Alamat</div>
                    <div className="font-medium">{anggota.address || "-"}</div>
                  </div>
                </div>

                {/* Baris 3: Data Pribadi */}
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                  Data Pribadi
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <div className="text-muted-foreground">Nama</div>
                    <div className="font-medium">{anggota.name || "-"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Gender</div>
                    <div className="font-medium">{anggota.gender || "-"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Tempat Lahir</div>
                    <div className="font-medium">
                      {anggota.birth_place || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Tanggal Lahir</div>
                    <div className="font-medium">
                      {displayDate(anggota.birth_date) || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">NIK</div>
                    <div className="font-medium">{anggota.nik || "-"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">NPWP</div>
                    <div className="font-medium">{anggota.npwp || "-"}</div>
                  </div>
                </div>

                {/* Baris 4: Pekerjaan */}
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                  Pekerjaan
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">NIP</div>
                    <div className="font-medium">{anggota.nip || "-"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Unit Kerja</div>
                    <div className="font-medium">
                      {anggota.unit_kerja || "-"}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-muted-foreground">Jabatan</div>
                    <div className="font-medium">{anggota.jabatan || "-"}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                Data anggota belum tersedia.
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ====== BOTTOM: TAB + TABEL (full width) ====== */}
      <Card className="overflow-hidden bg-white">
        <Tabs value={tab} onValueChange={handleTabChange}>
          <div className="px-4">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="simpanan">Riwayat Simpanan</TabsTrigger>
              <TabsTrigger value="pinjaman">Riwayat Pinjaman</TabsTrigger>
              <TabsTrigger value="pembayaran">Riwayat Pembayaran</TabsTrigger>
            </TabsList>
          </div>

          <div className="px-4 py-4">
            {/* SIMPANAN */}
            <TabsContent value="simpanan" className="m-0">
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-3 py-2 whitespace-nowrap">Tanggal</th>
                      <th className="px-3 py-2 whitespace-nowrap">Referensi</th>
                      <th className="px-3 py-2 whitespace-nowrap">Kategori</th>
                      <th className="px-3 py-2 whitespace-nowrap">Nominal</th>
                      <th className="px-3 py-2 whitespace-nowrap">Status</th>
                      <th className="px-3 py-2 whitespace-nowrap">
                        Pembayaran
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {simpananList.map((row) => (
                      <tr key={row.id} className="border-t">
                        <td className="px-3 py-2">
                          {displayDate(row.tanggal) || row.tanggal}
                        </td>
                        <td className="px-3 py-2">{row.reference}</td>
                        <td className="px-3 py-2">{row.kategori}</td>
                        <td className="px-3 py-2">
                          Rp {formatRupiah(row.nominal)}
                        </td>
                        <td className="px-3 py-2">
                          {statusBadgeSimpanan(row.status)}
                        </td>
                        <td className="px-3 py-2">{row.pembayaran}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <TablePagination
                page={pageS}
                total={simpananTotal}
                onChange={setPageS}
              />
            </TabsContent>

            {/* PINJAMAN */}
            <TabsContent value="pinjaman" className="m-0">
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-3 py-2">Tanggal</th>
                      <th className="px-3 py-2">Referensi</th>
                      <th className="px-3 py-2">Kategori</th>
                      <th className="px-3 py-2">Pokok</th>
                      <th className="px-3 py-2">Tenor (bln)</th>
                      <th className="px-3 py-2">Bunga (%)</th>
                      <th className="px-3 py-2">Angsuran/Bln</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pinjamanList.map((row) => (
                      <tr key={row.id} className="border-t">
                        <td className="px-3 py-2 whitespace-nowrap">
                          {displayDate(row.tanggal) || row.tanggal}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {row.reference}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {row.kategori}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          Rp {formatRupiah(row.nominal)}
                        </td>
                        <td className="px-3 py-2">{row.tenor}</td>
                        <td className="px-3 py-2">{row.bungaPersen}</td>
                        <td className="px-3 py-2">
                          Rp {formatRupiah(row.angsuranBulanan)}
                        </td>
                        <td className="px-3 py-2">
                          {statusBadgePinjaman(row.status)}
                        </td>
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
              <div className="flex items-center justify-between mb-2 text-xs sm:text-sm">
                <div className="space-x-3">
                  <span>
                    Total Grand: <strong>Rp {formatRupiah(totalGrand)}</strong>
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-3 py-2">Tanggal</th>
                      <th className="px-3 py-2">Referensi</th>
                      <th className="px-3 py-2">Total</th>
                      <th className="px-3 py-2">Grand Total</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Tipe</th>
                      <th className="px-3 py-2">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pembayaranList.map((row) => (
                      <tr key={row.id} className="border-t">
                        <td className="px-3 py-2 whitespace-nowrap">
                          {displayDate(row.tanggal) || row.tanggal}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {row.reference}
                        </td>
                        <td className="px-3 py-2">
                          Rp {formatRupiah(row.total)}
                        </td>
                        <td className="px-3 py-2">
                          Rp {formatRupiah(row.grandTotal)}
                        </td>
                        <td className="px-3 py-2">
                          {statusBadgeTransaksi(row.status)}
                        </td>
                        <td className="px-3 py-2">{row.tipe}</td>
                        <td className="px-3 py-2">{row.paymentType}</td>
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
