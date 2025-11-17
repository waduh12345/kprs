"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Zap,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ListChecks,
  Target,
  Calculator,
  Percent,
} from "lucide-react";
import Swal from "sweetalert2";
import { Separator } from "@/components/ui/separator";

// --- DUMMY DATA & TYPES ---

interface Allocation {
  name: string;
  percentage: number;
  nominal: number;
}

// Persentase SHU default (Berdasarkan AD/ART fiktif)
const defaultAllocations: Allocation[] = [
    { name: "Dana Cadangan", percentage: 25, nominal: 0 },
    { name: "Dana Jasa Anggota (Simpanan & Pinjaman)", percentage: 40, nominal: 0 },
    { name: "Dana Pengurus/Karyawan", percentage: 20, nominal: 0 },
    { name: "Dana Sosial & Pendidikan", percentage: 15, nominal: 0 },
];

const SHU_KOTOR_TAHUNAN = 500000000; // Saldo SHU kotor dari Laba Ditahan

// --- HELPER FUNCTIONS ---

const formatRupiah = (number: number) => {
  if (isNaN(number) || number === null || number === undefined) return 'Rp 0';
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Math.abs(number));
  return number < 0 ? `(${formatted})` : formatted;
};

// --- KOMPONEN UTAMA ---

export default function PerhitunganSHUPage() {
  const currentYear = new Date().getFullYear() - 1; // SHU dihitung untuk tahun lalu
  
  const [tahunSHU, setTahunSHU] = useState(currentYear);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCalculated, setIsCalculated] = useState(false);
  const [allocations, setAllocations] = useState<Allocation[]>(defaultAllocations);

  const totalPercentage = useMemo(() => {
    return allocations.reduce((sum, item) => sum + (item.percentage || 0), 0);
  }, [allocations]);

  const isValidPercentage = totalPercentage === 100;
  
  // --- HANDLER UPDATE PERSENTASE ---
  const handleUpdatePercentage = (index: number, value: number) => {
    const newAllocations = [...allocations];
    newAllocations[index].percentage = value;
    setAllocations(newAllocations);
    setIsCalculated(false); // Reset hasil jika persentase diubah
  };

  // --- HANDLER KALKULASI SHU ---
  const handleCalculateSHU = async () => {
    if (!isValidPercentage) {
        return Swal.fire("Gagal Kalkulasi", "Total Persentase Alokasi harus tepat 100%!", "error");
    }

    setIsCalculating(true);
    
    // Simulasi pemanggilan API Kalkulasi
    setTimeout(() => {
      const totalSHU = SHU_KOTOR_TAHUNAN;
      
      const results = allocations.map(item => ({
          ...item,
          nominal: Math.round(totalSHU * (item.percentage / 100))
      }));

      setAllocations(results);
      setIsCalculating(false);
      setIsCalculated(true);

      Swal.fire({
        icon: "success",
        title: "Perhitungan Selesai",
        text: `Alokasi SHU Tahun ${tahunSHU} berhasil dihitung. Total yang dialokasikan: ${formatRupiah(totalSHU)}.`,
      });
      
    }, 2000); 
  };
  
  // --- RENDERING TABEL ALOKASI ---
  const renderAllocationTable = () => (
      <div className="p-0 overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-indigo-100 text-indigo-700 text-left">
            <tr>
              <th className="px-4 py-3 w-1/2">Pos Alokasi</th>
              <th className="px-4 py-3 text-right w-[150px]">Persentase (%)</th>
              <th className="px-4 py-3 text-right">Nominal Alokasi (IDR)</th>
            </tr>
          </thead>
          <tbody>
            {allocations.map((item, index) => (
              <tr key={index} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-right">
                    <div className="flex justify-end">
                        <Input
                            type="number"
                            value={item.percentage}
                            onChange={(e) => handleUpdatePercentage(index, parseFloat(e.target.value) || 0)}
                            className="w-20 text-right p-1 h-8 border-indigo-300"
                            disabled={isCalculating || isCalculated}
                            min={0}
                            max={100}
                        />
                    </div>
                </td>
                <td className={`px-4 py-3 text-right font-bold ${isCalculated ? 'text-green-700' : 'text-gray-500'}`}>
                    {isCalculated ? formatRupiah(item.nominal) : 'Belum Dihitung'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-200 font-extrabold">
              <tr>
                  <td className="px-4 py-3">TOTAL PERSENTASE</td>
                  <td className={`px-4 py-3 text-right ${isValidPercentage ? 'text-green-600' : 'text-red-600'}`}>
                      {totalPercentage.toFixed(0)}%
                  </td>
                  <td className="px-4 py-3 text-right">
                      {isCalculated ? formatRupiah(SHU_KOTOR_TAHUNAN) : '-'}
                  </td>
              </tr>
          </tfoot>
        </table>
      </div>
  );


  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Calculator className="h-6 w-6 text-primary" />
        Perhitungan Sisa Hasil Usaha (SHU)
      </h2>
      <p className="text-gray-600">Langkah 1: Menentukan alokasi nominal SHU kotor berdasarkan persentase AD/ART.</p>


      {/* --- KARTU KONTROL TAHUN & SHU KOTOR --- */}
      <Card className="border-t-4 border-indigo-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-indigo-600">
            <Calendar className="h-5 w-5" /> Data Sumber
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-4 items-end">
          <div className="col-span-1 space-y-2">
            <Label htmlFor="tahun_shu">Tahun Buku</Label>
            <Input
              id="tahun_shu"
              type="number"
              min={2020}
              value={tahunSHU}
              onChange={(e) => {
                  setTahunSHU(parseInt(e.target.value) || currentYear);
                  setIsCalculated(false);
              }}
              disabled={isCalculating}
            />
          </div>
          <div className="col-span-3 space-y-2">
            <Label>Saldo SHU (Laba Bersih) Kotor Tahun {tahunSHU}</Label>
            <Input
              value={formatRupiah(SHU_KOTOR_TAHUNAN)}
              readOnly
              className="font-extrabold text-xl text-primary bg-indigo-50"
            />
            <p className="text-xs text-gray-500">
                Saldo ini berasal dari akun Laba Ditahan/SHU Akhir Tahun.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* --- KARTU PENGATURAN ALOKASI --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Percent className="h-5 w-5" /> Pengaturan Alokasi Persentase
          </CardTitle>
        </CardHeader>
        <CardContent>
            {renderAllocationTable()}
        </CardContent>
        <CardFooter className="flex justify-between pt-4">
            <div className={`font-semibold p-2 rounded-md ${isValidPercentage ? 'text-green-700' : 'text-red-700 bg-red-100'}`}>
                <AlertTriangle className={`h-5 w-5 inline mr-2 ${isValidPercentage ? 'hidden' : ''}`}/>
                Total Persentase: {isValidPercentage ? "SUDAH 100%" : "BELUM 100%"}
            </div>

            <Button
                onClick={handleCalculateSHU}
                disabled={isCalculating || !isValidPercentage}
                className="bg-primary hover:bg-indigo-700 text-lg"
            >
                {isCalculating ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Menghitung Nominal...
                    </>
                ) : (
                    <>
                        <Zap className="mr-2 h-5 w-5" />
                        Hitung Nominal Alokasi
                    </>
                )}
            </Button>
        </CardFooter>
      </Card>

      {/* --- KARTU STATUS (SETELAH KALKULASI) --- */}
      {isCalculated && (
        <Card className="border-t-4 border-green-500">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-green-600">
                    <CheckCircle className="h-5 w-5" /> Hasil Perhitungan Selesai
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-lg font-semibold">Langkah selanjutnya adalah memproses **Pembagian SHU** untuk Dana Jasa Anggota (Nominal: {formatRupiah(allocations.find(a => a.name === 'Dana Jasa Anggota (Simpanan & Pinjaman)')?.nominal || 0)}).</p>
            </CardContent>
        </Card>
      )}

    </div>
  );
}