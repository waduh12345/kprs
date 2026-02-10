"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calculator,
  Calendar,
  Zap,
  ListChecks,
  Info,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useGetPembiayaanListQuery } from "@/services/admin/konfigurasi/pembiayaan.service";

// --- TYPES SESUAI RESPONSE API ---

interface ProdukPembiayaanApi {
  id: number;
  code: string;
  name: string;
  interest_rate: number; // Bunga dalam persen
  description: string;
  status: number;
  type: string;
  admin_fee: number; // Biaya admin nominal
  margin: number;
}

interface AngsuranDetail {
  bulan: number;
  pokok: number;
  jasa_bunga: number;
  total_angsuran: number;
  sisa_pokok: number;
}

// Tenor standar karena di API tidak disediakan list tenor
const TENOR_OPTIONS = [3, 6, 12, 18, 24, 36, 48, 60];

// --- HELPER FUNCTIONS ---

const formatRupiah = (number: number) => {
  if (isNaN(number) || number === null) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

// --- SIMULASI LOGIC (ANUITAS) ---
// Angsuran tetap per bulan; komposisi: awal bunga besar → akhir pokok besar

const calculateAnuitasAngsuran = (
  pokokPinjaman: number,
  bungaPerBulanPersen: number,
  tenorBulan: number
): {
  totalPokok: number;
  totalBunga: number;
  angsuran: AngsuranDetail[];
  angsuranPerBulan: number;
} => {
  if (pokokPinjaman <= 0 || tenorBulan <= 0) {
    return {
      totalPokok: 0,
      totalBunga: 0,
      angsuran: [],
      angsuranPerBulan: 0,
    };
  }

  const r = bungaPerBulanPersen / 100; // desimal, misal 1.5% → 0.015
  const n = tenorBulan;
  const P = pokokPinjaman;

  // PMT = P * [ r(1+r)^n ] / [ (1+r)^n - 1 ]
  const factor = Math.pow(1 + r, n);
  const pmt = (P * (r * factor)) / (factor - 1);
  const angsuranTetap = Math.round(pmt);

  let sisaPokok = P;
  const jadwalAngsuran: AngsuranDetail[] = [];
  let totalBungaAkumulasi = 0;

  for (let i = 1; i <= n; i++) {
    const jasa_bunga = Math.round(sisaPokok * r);
    const pokok = i === n
      ? Math.round(sisaPokok) // bulan terakhir: sisa pokok habis
      : Math.round(angsuranTetap - jasa_bunga);
    const total_angsuran = pokok + jasa_bunga;
    sisaPokok = Math.max(0, sisaPokok - pokok);
    totalBungaAkumulasi += jasa_bunga;

    jadwalAngsuran.push({
      bulan: i,
      pokok,
      jasa_bunga,
      total_angsuran,
      sisa_pokok: Math.round(sisaPokok),
    });
  }

  return {
    totalPokok: P,
    totalBunga: totalBungaAkumulasi,
    angsuran: jadwalAngsuran,
    angsuranPerBulan: angsuranTetap,
  };
};

// --- KOMPONEN UTAMA ---

export default function SimulasiPembiayaanPage() {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [nominalInput, setNominalInput] = useState<string>("");
  const [tenor, setTenor] = useState<number | undefined>(undefined);

  // --- FETCH DATA API ---
  const { data: apiResponse, isLoading } = useGetPembiayaanListQuery({
    page: 1,
    paginate: 100, // Ambil cukup banyak agar dropdown lengkap
  });

  const produkList = (apiResponse?.data as ProdukPembiayaanApi[]) || [];

  // Cari produk yang dipilih
  const selectedProduct = useMemo(
    () => produkList.find((p) => String(p.id) === selectedProductId),
    [selectedProductId, produkList]
  );

  // Parse nominal input
  const nominalPinjaman = useMemo(() => {
    const parsed = parseFloat(nominalInput.replace(/[^0-9]/g, ""));
    return isNaN(parsed) ? 0 : parsed;
  }, [nominalInput]);

  // Reset tenor & nominal saat produk berubah (opsional, bisa dihapus jika ingin persist)
  useEffect(() => {
    // Kita keep nominal, cuma reset tenor jika mau
    // setTenor(undefined);
  }, [selectedProductId]);

  // --- HITUNG HASIL SIMULASI (ANUITAS) ---
  // Bunga dari API: umumnya % per tahun → konversi ke % per bulan (÷ 12)
  const simulationResult = useMemo(() => {
    if (!selectedProduct || nominalPinjaman <= 0 || tenor === undefined) {
      return null;
    }
    const bungaPerBulanPersen = selectedProduct.interest_rate / 12;
    return calculateAnuitasAngsuran(
      nominalPinjaman,
      bungaPerBulanPersen,
      tenor
    );
  }, [selectedProduct, nominalPinjaman, tenor]);

  // Handler input nominal
  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    const numberValue = parseFloat(rawValue);
    if (!isNaN(numberValue)) {
      setNominalInput(formatRupiah(numberValue).replace("Rp", "").trim());
    } else {
      setNominalInput("");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-gray-800">
        <Calculator className="h-7 w-7 text-indigo-600" />
        Simulasi Pembiayaan
      </h2>

      {/* --- INPUT SIMULASI (LAYOUT HORIZONTAL) --- */}
      <Card className="shadow-lg border-t-4 border-indigo-500">
        <CardContent>
          <div className="flex flex-col gap-6 lg:flex-row lg:gap-6 items-stretch">
            {/* 1. PILIH PRODUK */}
            <div className="lg:w-1/3 flex flex-col justify-between">
              <CardTitle className="text-xl flex items-center gap-2 text-indigo-600 mb-4 lg:mb-6">
                <Zap className="h-5 w-5" /> Parameter Simulasi
              </CardTitle>
            </div>

            <div className="lg:w-1/3 flex flex-col justify-between">
              <Select onValueChange={setSelectedProductId} value={selectedProductId}>
                <SelectTrigger id="product" className="h-10 text-base">
                  <SelectValue className="w-full" placeholder="Pilih Produk Pembiayaan..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <div className="p-2 flex justify-center text-sm text-gray-500">
                      <Loader2 className="animate-spin h-4 w-4 mr-2" /> Loading...
                    </div>
                  ) : (
                    produkList.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* 2 & 3. NOMINAL PINJAMAN & PILIH TENOR */}
            <div className="lg:w-2/3 flex flex-col lg:flex-row gap-4 lg:gap-6">
              {/* NOMINAL PINJAMAN */}
              <div className="flex-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                    Rp
                  </span>
                  <Input
                    id="nominal"
                    placeholder="Nominal Pengajuan"
                    value={nominalInput}
                    onChange={handleNominalChange}
                    disabled={!selectedProduct}
                    className="pl-10 h-10 text-lg font-semibold text-gray-800"
                  />
                </div>
              </div>
              {/* PILIH TENOR */}
              <div className="flex-1">
                <Select
                  onValueChange={(v) => setTenor(parseInt(v))}
                  value={tenor?.toString() || ""}
                  disabled={!selectedProduct}
                >
                  <SelectTrigger id="tenor" className="h-10 text-base">
                    <SelectValue placeholder="Pilih Bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {TENOR_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t.toString()}>
                        {t} Bulan
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- INFORMASI PRODUK & HASIL SIMULASI --- */}
      {selectedProduct && (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Detail Produk */}
          <Card className="md:col-span-1 shadow-md bg-blue-50/50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                <Info className="h-5 w-5" /> Detail Produk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500">Nama Produk</p>
                <p className="font-semibold text-gray-800 text-base">
                  {selectedProduct.name}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-gray-500">Suku Bunga</p>
                  <p className="font-bold text-red-600 text-lg">
                    {selectedProduct.interest_rate}%
                  </p>
                  <p className="text-xs text-gray-400">
                    per tahun (≈ {(selectedProduct.interest_rate / 12).toFixed(2)}% per bulan, Anuitas)
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Biaya Admin</p>
                  <p className="font-bold text-gray-800 text-lg">
                    {formatRupiah(selectedProduct.admin_fee)}
                  </p>
                  <p className="text-xs text-gray-400">sekali bayar</p>
                </div>
              </div>
              <div>
                <p className="text-gray-500">Keterangan</p>
                <p className="text-gray-700 italic leading-relaxed">
                  {selectedProduct.description || "-"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Ringkasan Simulasi */}
          <Card className="md:col-span-2 shadow-md border-l-4 border-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                <ListChecks className="h-5 w-5" /> Ringkasan Pembiayaan
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Metode <strong>Anuitas</strong>: angsuran tetap per bulan; awal periode bunga besar, akhir periode pokok besar.
              </p>
            </CardHeader>
            <CardContent>
              {simulationResult ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">
                        Pokok Pinjaman
                      </p>
                      <p className="text-lg font-semibold text-gray-800">
                        {formatRupiah(nominalPinjaman)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">
                        Total Bunga/Jasa
                      </p>
                      <p className="text-lg font-semibold text-orange-600">
                        {formatRupiah(simulationResult.totalBunga)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">
                        Biaya Admin
                      </p>
                      <p className="text-lg font-semibold text-gray-800">
                        {formatRupiah(selectedProduct.admin_fee)}
                      </p>
                    </div>
                    <div className="bg-green-50 p-2 rounded-lg border border-green-100">
                      <p className="text-xs text-green-700 uppercase font-bold">
                        Angsuran Per Bulan
                      </p>
                      <p className="text-xl font-extrabold text-green-700">
                        {formatRupiah(simulationResult.angsuranPerBulan)}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Estimasi Pengembalian
                      </p>
                      <p className="text-xs text-gray-400">
                        (Pokok + Bunga + Admin)
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatRupiah(
                        nominalPinjaman +
                          simulationResult.totalBunga +
                          selectedProduct.admin_fee
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[150px]">
                  <Calculator className="h-10 w-10 mb-2 opacity-20" />
                  <p>
                    Masukkan nominal dan pilih tenor untuk melihat hasil simulasi.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- TABEL JADWAL ANGSURAN --- */}
      {simulationResult && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Jadwal Angsuran ({tenor} Bulan)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted text-left sticky top-0">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-700">
                    Bulan Ke
                  </th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700">
                    Pokok
                  </th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700">
                    Bunga
                  </th>
                  <th className="px-6 py-3 text-right font-bold text-gray-900">
                    Total Angsuran
                  </th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700">
                    Sisa Pokok
                  </th>
                </tr>
              </thead>
              <tbody>
                {simulationResult.angsuran.map((detail) => (
                  <tr
                    key={detail.bulan}
                    className="border-t hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {detail.bulan}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-600">
                      {formatRupiah(detail.pokok)}
                    </td>
                    <td className="px-6 py-3 text-right text-orange-600">
                      {formatRupiah(detail.jasa_bunga)}
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-primary bg-blue-50/30">
                      {formatRupiah(detail.total_angsuran)}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-500">
                      {formatRupiah(detail.sisa_pokok)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {!selectedProduct && !isLoading && (
        <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-lg">
          <p>Silahkan pilih produk pembiayaan di atas untuk memulai.</p>
        </div>
      )}
    </div>
  );
}