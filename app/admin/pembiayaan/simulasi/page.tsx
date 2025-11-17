"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, DollarSign, Calendar, Zap, ListChecks } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// --- DUMMY DATA ---

interface ProdukPembiayaan {
  id: string;
  nama: string;
  min_nominal: number;
  max_nominal: number;
  bunga_tahunan_persen: number; // Dalam persen per tahun
  tenor_tersedia: number[]; // Tenor dalam bulan
}

const produkList: ProdukPembiayaan[] = [
  {
    id: "PROD01",
    nama: "Pembiayaan Mikro",
    min_nominal: 1000000,
    max_nominal: 20000000,
    bunga_tahunan_persen: 18, // 1.5% per bulan flat
    tenor_tersedia: [6, 12, 18, 24],
  },
  {
    id: "PROD02",
    nama: "Pembiayaan Investasi",
    min_nominal: 5000000,
    max_nominal: 100000000,
    bunga_tahunan_persen: 12, // 1% per bulan flat
    tenor_tersedia: [12, 24, 36, 48],
  },
  {
    id: "PROD03",
    nama: "Kredit Multi Guna",
    min_nominal: 1000000,
    max_nominal: 50000000,
    bunga_tahunan_persen: 24, // 2% per bulan flat
    tenor_tersedia: [3, 6, 12],
  },
];

interface AngsuranDetail {
  bulan: number;
  pokok: number;
  jasa_bunga: number;
  total_angsuran: number;
  sisa_pokok: number;
}

// --- HELPER FUNCTIONS ---

const formatRupiah = (number: number) => {
  if (isNaN(number) || number === null) return 'Rp 0';
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

// --- SIMULASI LOGIC (FLAT RATE) ---

const calculateFlatAngsuran = (
  pokokPinjaman: number,
  bungaTahunanPersen: number,
  tenorBulan: number
): { totalPokok: number, totalBunga: number, angsuran: AngsuranDetail[] } => {
  if (pokokPinjaman <= 0 || tenorBulan <= 0) {
    return { totalPokok: 0, totalBunga: 0, angsuran: [] };
  }

  // Bunga per bulan (Flat Rate)
  const bungaBulananDesimal = bungaTahunanPersen / 100 / 12;

  // 1. Hitung total bunga selama tenor
  const totalBungaNominal = pokokPinjaman * bungaBulananDesimal * tenorBulan;

  // 2. Hitung angsuran pokok dan bunga per bulan
  const angsuranPokokBulanan = pokokPinjaman / tenorBulan;
  const angsuranBungaBulanan = totalBungaNominal / tenorBulan;
  const totalAngsuranBulanan = angsuranPokokBulanan + angsuranBungaBulanan;

  let sisaPokok = pokokPinjaman;
  const jadwalAngsuran: AngsuranDetail[] = [];

  for (let i = 1; i <= tenorBulan; i++) {
    const pokok = angsuranPokokBulanan;
    const jasa_bunga = angsuranBungaBulanan;
    const total_angsuran = totalAngsuranBulanan;
    
    sisaPokok -= pokok;
    if (i === tenorBulan) sisaPokok = 0; // Pastikan sisa pokok menjadi 0 di bulan terakhir

    jadwalAngsuran.push({
      bulan: i,
      pokok: Math.round(pokok),
      jasa_bunga: Math.round(jasa_bunga),
      total_angsuran: Math.round(total_angsuran),
      sisa_pokok: Math.round(sisaPokok),
    });
  }

  return {
    totalPokok: pokokPinjaman,
    totalBunga: Math.round(totalBungaNominal),
    angsuran: jadwalAngsuran,
  };
};

// --- KOMPONEN UTAMA ---

export default function SimulasiPembiayaanPage() {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [nominalInput, setNominalInput] = useState<string>('');
  const [tenor, setTenor] = useState<number | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedProduct = useMemo(
    () => produkList.find((p) => p.id === selectedProductId),
    [selectedProductId]
  );

  const nominalPinjaman = useMemo(() => {
    const parsed = parseFloat(nominalInput.replace(/[^0-9]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }, [nominalInput]);

  // Reset tenor saat produk berubah
  useEffect(() => {
    setTenor(undefined);
    setNominalInput('');
    setErrorMessage(null);
  }, [selectedProductId]);
  
  // Validasi Nominal secara real-time
  useEffect(() => {
    if (selectedProduct) {
        if (nominalPinjaman > 0 && nominalPinjaman < selectedProduct.min_nominal) {
            setErrorMessage(`Minimal nominal pinjaman adalah ${formatRupiah(selectedProduct.min_nominal)}.`);
        } else if (nominalPinjaman > selectedProduct.max_nominal) {
             setErrorMessage(`Maksimal nominal pinjaman adalah ${formatRupiah(selectedProduct.max_nominal)}.`);
        } else {
            setErrorMessage(null);
        }
    }
  }, [nominalPinjaman, selectedProduct]);


  // Hitung hasil simulasi
  const simulationResult = useMemo(() => {
    if (!selectedProduct || nominalPinjaman <= 0 || tenor === undefined || errorMessage) {
      return null;
    }

    return calculateFlatAngsuran(
      nominalPinjaman,
      selectedProduct.bunga_tahunan_persen,
      tenor
    );
  }, [selectedProduct, nominalPinjaman, tenor, errorMessage]);

  // Handler input nominal untuk format Rupiah saat mengetik
  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const numberValue = parseFloat(rawValue);
    if (!isNaN(numberValue)) {
      setNominalInput(formatRupiah(numberValue).replace('Rp', '').trim());
    } else {
      setNominalInput('');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-gray-800">
        <Calculator className="h-7 w-7 text-indigo-600" />
        Simulasi Pembiayaan
      </h2>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-indigo-600">
            <Zap className="h-5 w-5" /> Input Simulasi
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="product">Pilih Produk Pembiayaan</Label>
            <Select onValueChange={setSelectedProductId} value={selectedProductId}>
              <SelectTrigger id="product">
                <SelectValue placeholder="Pilih Produk" />
              </SelectTrigger>
              <SelectContent>
                {produkList.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nominal">Nominal Pinjaman</Label>
            <Input
              id="nominal"
              placeholder="Contoh: 10.000.000"
              value={nominalInput}
              onChange={handleNominalChange}
              disabled={!selectedProduct}
              className={errorMessage ? "border-red-500" : ""}
            />
            {errorMessage && <p className="text-xs text-red-500 mt-1">{errorMessage}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenor">Pilih Tenor (Bulan)</Label>
            <Select onValueChange={(v) => setTenor(parseInt(v))} value={tenor?.toString() || ''} disabled={!selectedProduct}>
              <SelectTrigger id="tenor">
                <SelectValue placeholder="Pilih Tenor" />
              </SelectTrigger>
              <SelectContent>
                {selectedProduct?.tenor_tersedia.map((t) => (
                  <SelectItem key={t} value={t.toString()}>
                    {t} Bulan
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* --- INFORMASI PRODUK & HASIL SIMULASI --- */}
      {selectedProduct && (
        <Card className="shadow-lg border-t-4 border-blue-500">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-blue-600">
              <ListChecks className="h-5 w-5" /> Informasi Produk
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-4 gap-6">
            <div>
                <p className="text-sm text-gray-500">Produk</p>
                <p className="font-semibold">{selectedProduct.nama}</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Min. Nominal</p>
                <p className="font-semibold">{formatRupiah(selectedProduct.min_nominal)}</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Max. Nominal</p>
                <p className="font-semibold">{formatRupiah(selectedProduct.max_nominal)}</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Bunga/Jasa Tahunan</p>
                <p className="font-semibold text-red-600">{selectedProduct.bunga_tahunan_persen}% Flat</p>
            </div>
          </CardContent>
          
          {/* --- RINGKASAN HASIL SIMULASI --- */}
          {simulationResult && (
            <>
              <Separator className="mt-4 mb-4 mx-6" />
              <CardFooter className="pt-0 grid md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Pokok Pinjaman</p>
                  <p className="text-xl font-bold text-indigo-600">{formatRupiah(nominalPinjaman)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Jasa/Bunga</p>
                  <p className="text-xl font-bold text-red-600">{formatRupiah(simulationResult.totalBunga)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Pembayaran</p>
                  <p className="text-xl font-bold text-green-600">{formatRupiah(nominalPinjaman + simulationResult.totalBunga)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Angsuran Per Bulan</p>
                  <p className="text-xl font-bold text-primary">{formatRupiah(simulationResult.angsuran[0].total_angsuran)}</p>
                </div>
              </CardFooter>
            </>
          )}
        </Card>
      )}

      {/* --- TABEL JADWAL ANGSURAN --- */}
      {simulationResult && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Tabel Angsuran Pembiayaan ({tenor} Bulan)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted text-left sticky top-0">
                <tr>
                  <th className="px-4 py-3">Bulan Ke-</th>
                  <th className="px-4 py-3 text-right">Pokok</th>
                  <th className="px-4 py-3 text-right">Jasa / Bunga</th>
                  <th className="px-4 py-3 text-right">Total Angsuran</th>
                  <th className="px-4 py-3 text-right">Sisa Pokok</th>
                </tr>
              </thead>
              <tbody>
                {simulationResult.angsuran.map((detail) => (
                  <tr key={detail.bulan} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{detail.bulan}</td>
                    <td className="px-4 py-3 text-right">{formatRupiah(detail.pokok)}</td>
                    <td className="px-4 py-3 text-right text-red-600">{formatRupiah(detail.jasa_bunga)}</td>
                    <td className="px-4 py-3 text-right font-bold text-primary">{formatRupiah(detail.total_angsuran)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatRupiah(detail.sisa_pokok)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {!selectedProduct && (
        <p className="text-center text-gray-500 mt-10">
          Silahkan pilih produk pembiayaan di atas untuk memulai simulasi.
        </p>
      )}
    </div>
  );
}