"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calculator,
  Play,
  Loader2,
  Calendar,
  Settings,
  Wallet,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  useLazyGetBungaHarianQuery,
  useLazyCalculateEomQuery,
  useProcessEomMutation,
  useLazyCalculateEoyQuery,
  useProcessEoyMutation,
} from "@/services/admin/simpanan/simpanan-berjangka-eom-eoy.service";

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const MONTHS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

export default function ProsesSimjakaHarianPage() {
  const [nominal, setNominal] = useState<string>("");
  const [rate, setRate] = useState<string>("");

  const [eomYear, setEomYear] = useState(currentYear);
  const [eomMonth, setEomMonth] = useState(new Date().getMonth() + 1);
  const [eoyTahun, setEoyTahun] = useState(currentYear);

  const [triggerBungaHarian, { data: bungaHarianData, isFetching: isBungaHarianLoading }] =
    useLazyGetBungaHarianQuery();
  const [triggerCalculateEom, { data: eomPreview, isFetching: isEomCalculateLoading }] =
    useLazyCalculateEomQuery();
  const [processEom, { isLoading: isEomProcessLoading }] = useProcessEomMutation();
  const [triggerCalculateEoy, { data: eoyPreview, isFetching: isEoyCalculateLoading }] =
    useLazyCalculateEoyQuery();
  const [processEoy, { isLoading: isEoyProcessLoading }] = useProcessEoyMutation();

  const handleHitungBungaHarian = () => {
    const n = Number(nominal?.replace(/\D/g, ""));
    const r = Number(rate?.replace(",", "."));
    if (!n || n <= 0 || !rate || isNaN(r)) {
      Swal.fire("Perhatian", "Nominal dan rate (%) wajib diisi dengan nilai valid.", "warning");
      return;
    }
    triggerBungaHarian({ nominal: n, rate: r });
  };

  const handlePreviewEom = () => {
    triggerCalculateEom({ year: eomYear, month: eomMonth });
  };

  const handleProcessEom = async () => {
    const confirm = await Swal.fire({
      title: "Proses EOM (Akhir Bulan)",
      html: `Simpan akrual bunga bulanan untuk <strong>${MONTHS.find((m) => m.value === eomMonth)?.label} ${eomYear}</strong>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Proses",
      cancelButtonText: "Batal",
    });
    if (!confirm.isConfirmed) return;
    try {
      const result = await processEom({ year: eomYear, month: eomMonth }).unwrap();
      Swal.fire("Berhasil", result.message ?? `EOM diproses. Jumlah: ${result.jumlah}`, "success");
      triggerCalculateEom({ year: eomYear, month: eomMonth });
    } catch (error) {
      console.error(error);
      Swal.fire("Gagal", "Proses EOM gagal.", "error");
    }
  };

  const handlePreviewEoy = () => {
    triggerCalculateEoy({ tahun: eoyTahun });
  };

  const handleProcessEoy = async () => {
    const confirm = await Swal.fire({
      title: "Proses EOY (Akhir Tahun)",
      html: `Simpan total bunga tahunan untuk <strong>${eoyTahun}</strong>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Proses",
      cancelButtonText: "Batal",
    });
    if (!confirm.isConfirmed) return;
    try {
      const result = await processEoy({ tahun: eoyTahun }).unwrap();
      Swal.fire("Berhasil", result.message ?? `EOY diproses. Jumlah: ${result.jumlah}`, "success");
      triggerCalculateEoy({ tahun: eoyTahun });
    } catch (error) {
      console.error(error);
      Swal.fire("Gagal", "Proses EOY gagal.", "error");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Proses Simpanan Berjangka</h2>
      </div>

      {/* --- Kalkulator Bunga Harian --- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5" />
            Kalkulator Bunga Harian
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Hitung estimasi bunga per hari berdasarkan nominal dan rate (%).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Nominal (Rp)</Label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={nominal}
                onChange={(e) => setNominal(e.target.value.replace(/\D/g, ""))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Rate (%)</Label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={rate}
                onChange={(e) => setRate(e.target.value.replace(",", "."))}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleHitungBungaHarian}
                disabled={isBungaHarianLoading}
                className="w-full"
              >
                {isBungaHarianLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Hitung"
                )}
              </Button>
            </div>
          </div>
          {bungaHarianData && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Hasil</p>
              <p className="text-lg font-semibold">
                Bunga per hari: {formatRupiah(bungaHarianData.bunga_per_hari)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Nominal {formatRupiah(bungaHarianData.nominal)} × rate {bungaHarianData.rate}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Proses EOM (Akhir Bulan) --- */}
      <Card className="border-t-4 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Proses EOM (Akrual Bulanan)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Preview dan simpan pembukuan bunga akhir bulan (EOM) untuk periode tertentu.
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label>Tahun</Label>
              <select
                value={eomYear}
                onChange={(e) => setEomYear(Number(e.target.value))}
                className="mt-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-[120px]"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Bulan</Label>
              <select
                value={eomMonth}
                onChange={(e) => setEomMonth(Number(e.target.value))}
                className="mt-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-[140px]"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              onClick={handlePreviewEom}
              disabled={isEomCalculateLoading}
            >
              {isEomCalculateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Preview Hitung"}
            </Button>
            <Button
              onClick={handleProcessEom}
              disabled={isEomProcessLoading || !eomPreview}
            >
              {isEomProcessLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Proses & Simpan EOM
                </>
              )}
            </Button>
          </div>
          {eomPreview && (
            <div className="rounded-lg border overflow-hidden">
              <div className="bg-muted px-4 py-2 flex justify-between items-center">
                <span className="font-medium">
                  {MONTHS.find((m) => m.value === eomPreview.period_month)?.label} {eomPreview.period_year}
                </span>
                <span className="text-sm">
                  Total bunga: {formatRupiah(eomPreview.summary_total_bunga)}
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left">No. Bilyet</th>
                      <th className="px-4 py-2 text-right">Nominal</th>
                      <th className="px-4 py-2 text-right">Rate</th>
                      <th className="px-4 py-2 text-right">Hari</th>
                      <th className="px-4 py-2 text-right">Bunga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eomPreview.items?.map((item, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-4 py-2 font-mono">{item.no_bilyet}</td>
                        <td className="px-4 py-2 text-right font-mono">{formatRupiah(item.nominal)}</td>
                        <td className="px-4 py-2 text-right">{item.rate}%</td>
                        <td className="px-4 py-2 text-right">{item.jumlah_hari}</td>
                        <td className="px-4 py-2 text-right font-mono">{formatRupiah(item.bunga_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Proses EOY (Akhir Tahun) --- */}
      <Card className="border-t-4 border-amber-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5" />
            Proses EOY (Akrual Tahunan)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Preview dan simpan total bunga tahunan (EOY) untuk tahun tertentu.
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label>Tahun</Label>
              <select
                value={eoyTahun}
                onChange={(e) => setEoyTahun(Number(e.target.value))}
                className="mt-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-[120px]"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              onClick={handlePreviewEoy}
              disabled={isEoyCalculateLoading}
            >
              {isEoyCalculateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Preview Hitung"}
            </Button>
            <Button
              onClick={handleProcessEoy}
              disabled={isEoyProcessLoading || !eoyPreview}
            >
              {isEoyProcessLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Proses & Simpan EOY
                </>
              )}
            </Button>
          </div>
          {eoyPreview && (
            <div className="rounded-lg border overflow-hidden">
              <div className="bg-muted px-4 py-2 flex justify-between items-center">
                <span className="font-medium">Tahun {eoyPreview.tahun}</span>
                <span className="text-sm">
                  Total bunga tahunan: {formatRupiah(eoyPreview.summary_total_bunga_tahunan)}
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left">No. Bilyet</th>
                      <th className="px-4 py-2 text-right">Total Bunga Tahunan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eoyPreview.items?.map((item, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-4 py-2 font-mono">{item.no_bilyet}</td>
                        <td className="px-4 py-2 text-right font-mono">
                          {formatRupiah(item.total_bunga_tahunan)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
