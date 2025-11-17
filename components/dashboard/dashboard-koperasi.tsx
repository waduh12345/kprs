"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Banknote,
  CreditCard,
  CalendarDays,
  Target,
  Clock,
  BookOpen,
  PieChart,
  ListChecks,
  DollarSign,
} from "lucide-react";
import { useMemo, useState } from "react";

// Chart.js + types
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  ArcElement, // Ditambahkan untuk Pie Chart
  type ChartData,
  type ChartOptions,
  type TooltipItem,
} from "chart.js";
import { Line, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

// --- DUMMY DATA STRUCTURES ---

const DUMMY_HEAD_DATA = {
  total_anggota: 1250,
  total_simpanan: 18050000000, // 18.05 M
  total_pinjaman: 25500000000, // 25.5 M
  tagihan_bulan_ini: 1550000000, // 1.55 M
  shu_tahun_berjalan: 500000000, // Laba Bersih
};

const DUMMY_SIMPANAN_DATA = {
  // Simpanan per Kategori
  pokok: 1250000000,
  wajib: 5000000000,
  sukarela: 11800000000,
  berjangka: 2000000000,
  // Matriks Pinjaman (Kol 1 - Kol 5)
  kol_lancar: 90,
  kol_dpd: 5,
  kol_macet: 5,
};

const DUMMY_COLLECTION_DATA = {
    // Total Outstanding Pinjaman
    outstanding_total: 25500000000,
    // Outstanding Non-Performing Loan (Kol 3, 4, 5)
    outstanding_npl: 1250000000, // 1.25 M
};

const DUMMY_AKUNTANSI_DATA = {
    neraca_balanced: true,
    kas_bank: 5500000000,
    piutang_usaha: 18000000000,
};

// ===== Utils =====
const formatRupiah = (amount: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("IDR", "")
    .trim();

const formatNumber = (num: number): string =>
  new Intl.NumberFormat("id-ID").format(num);

const last12MonthLabels = (): string[] => {
  const labels: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleString("id-ID", { month: "short", year: "2-digit" }));
  }
  return labels;
};

// Simulasi data chart (digantikan dengan dummy data)
const generateDummyMonthlyData = (base: number) => {
    const data = [];
    for (let i = 0; i < 12; i++) {
        // Fluktuasi +/- 10%
        const fluctuation = (Math.random() * 0.2 - 0.1); 
        data.push(Math.round(base * (1 + fluctuation)));
    }
    return data;
}


export default function DashboardPage() {
  // Get current year for API call (retained but unused for dummy data)
  const currentYear = new Date().getFullYear();
  const isLoading = false; // Set loading to false for dummy data display

  // Data processing (Simulasi)
  const labels = useMemo(last12MonthLabels, []);
  
  const monthlySimpanan = useMemo(() => generateDummyMonthlyData(DUMMY_HEAD_DATA.total_simpanan / 12), []);
  const monthlyPinjaman = useMemo(() => generateDummyMonthlyData(DUMMY_HEAD_DATA.total_pinjaman / 12), []);

  // Ringkasan from DUMMY DATA
  const totalAnggota = DUMMY_HEAD_DATA.total_anggota;
  const totalSimpanan = DUMMY_HEAD_DATA.total_simpanan;
  const totalPinjaman = DUMMY_HEAD_DATA.total_pinjaman;
  const totalTagihanBulanIni = DUMMY_HEAD_DATA.tagihan_bulan_ini;
  const totalSHUBersih = DUMMY_HEAD_DATA.shu_tahun_berjalan;
  const totalNPL = DUMMY_COLLECTION_DATA.outstanding_npl;
  const totalOutstanding = DUMMY_COLLECTION_DATA.outstanding_total;
  const nplRatio = totalOutstanding > 0 ? (totalNPL / totalOutstanding) : 0;
  
  // Data untuk Pie Chart Simpanan
  const simpananPieData: ChartData<"pie"> = useMemo(() => ({
    labels: ['Pokok', 'Wajib', 'Sukarela', 'Berjangka'],
    datasets: [{
        data: [
            DUMMY_SIMPANAN_DATA.pokok,
            DUMMY_SIMPANAN_DATA.wajib,
            DUMMY_SIMPANAN_DATA.sukarela,
            DUMMY_SIMPANAN_DATA.berjangka
        ],
        backgroundColor: [
            'rgba(255, 99, 132, 0.8)', // Merah
            'rgba(54, 162, 235, 0.8)', // Biru
            'rgba(255, 206, 86, 0.8)', // Kuning
            'rgba(75, 192, 192, 0.8)' // Hijau
        ],
        hoverBackgroundColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)'
        ],
    }]
  }), []);


  const cards = [
    {
      title: "Total Anggota Aktif",
      value: formatNumber(totalAnggota),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      detail: "Modul Anggota",
    },
    {
      title: "Total Simpanan (Kewajiban)",
      value: formatRupiah(totalSimpanan),
      icon: Banknote,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      detail: "Modul Simpanan",
    },
    {
      title: "Total Piutang Pinjaman",
      value: formatRupiah(totalPinjaman),
      icon: CreditCard,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      detail: "Modul Pembiayaan",
    },
    {
      title: "SHU / Laba Bersih Berjalan",
      value: formatRupiah(totalSHUBersih),
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      detail: "Modul Akuntansi",
    },
    // Tambahan untuk NPL dan Tagihan
    {
      title: "Tagihan Angsuran Bulan Ini",
      value: formatRupiah(totalTagihanBulanIni),
      icon: CalendarDays,
      color: "text-red-600",
      bgColor: "bg-red-100",
      detail: "Modul Collection",
    },
    {
      title: "Rasio NPF / NPL",
      value: `${(nplRatio * 100).toFixed(2)}%`,
      icon: Target,
      color: nplRatio > 0.05 ? "text-red-600" : "text-green-600",
      bgColor: nplRatio > 0.05 ? "bg-red-100" : "bg-green-100",
      detail: "Modul Collection",
    },
    {
        title: "Keseimbangan Neraca",
        value: DUMMY_AKUNTANSI_DATA.neraca_balanced ? "SEIMBANG" : "TIDAK",
        icon: BookOpen,
        color: DUMMY_AKUNTANSI_DATA.neraca_balanced ? "text-green-600" : "text-red-600",
        bgColor: DUMMY_AKUNTANSI_DATA.neraca_balanced ? "bg-green-100" : "bg-red-100",
        detail: "Modul Akuntansi",
    },
    {
        title: "Kas & Bank (Aktiva Lancar)",
        value: formatRupiah(DUMMY_AKUNTANSI_DATA.kas_bank),
        icon: Banknote,
        color: "text-gray-600",
        bgColor: "bg-gray-100",
        detail: "Modul Akuntansi",
    },
  ] as const;

  // ===== Chart configurations =====
  const commonOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<"line">): string => {
            const v = ctx.parsed.y ?? 0;
            return `${ctx.dataset.label ?? "Data"}: ${formatRupiah(v)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (tickValue: string | number) =>
            formatRupiah(Number(tickValue)),
        },
      },
    },
  };
  
  const pieOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'right', align: 'center' },
        tooltip: {
            callbacks: {
                label: (ctx: TooltipItem<'pie'>): string => {
                    const label = ctx.label || '';
                    const value = ctx.raw as number;
                    const total = ctx.dataset.data.reduce((a, b) => (a as number) + (b as number), 0) as number;
                    const percentage = total ? ((value / total) * 100).toFixed(1) : 0;
                    return `${label}: ${formatRupiah(value)} (${percentage}%)`;
                }
            }
        }
    }
  }

  const simpananData: ChartData<"line"> = {
    labels,
    datasets: [
      {
        label: "Simpanan Total (Kredit)",
        data: monthlySimpanan,
        borderColor: "rgba(16,185,129,1)", // emerald-500
        backgroundColor: "rgba(16,185,129,0.2)",
        fill: true,
        tension: 0.35,
        pointRadius: 2,
      },
    ],
  };

  const pinjamanData: ChartData<"line"> = {
    labels,
    datasets: [
      {
        label: "Piutang Pinjaman (Debit)",
        data: monthlyPinjaman,
        borderColor: "rgba(59,130,246,1)", // blue-500
        backgroundColor: "rgba(59,130,246,0.2)",
        fill: true,
        tension: 0.35,
        pointRadius: 2,
      },
    ],
  };


  if (isLoading) {
    // Reusing the loading state from the original code
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Koperasi</h1>
          <p className="text-sm text-gray-500">
            Ringkasan keseluruhan modul
          </p>
        </div>
        
        {/* Loading Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-full bg-gray-200">
                    <div className="h-4 w-4 bg-gray-300 rounded"></div>
                  </div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-6 w-1/2 bg-gray-200 rounded mx-auto"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Koperasi</h1>
        <p className="text-sm text-gray-500">
          Ringkasan kinerja operasional, risiko, dan akuntansi
        </p>
      </div>

      {/* Kartu Ringkasan (Modul Head) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
        {cards.slice(0, 4).map((c, i) => {
          const Icon = c.icon;
          return (
            <Card
              key={i}
              className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-indigo-500"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {c.title}
                  </CardTitle>
                  <div className={`p-1 rounded-full ${c.bgColor}`}>
                    <Icon className={`h-4 w-4 ${c.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-2xl font-bold text-gray-900">
                  {c.value}
                </div>
                <p className="text-xs text-gray-500 mt-1">{c.detail}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Kartu Ringkasan (Modul Pendukung & Risiko) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
        {cards.slice(4, 8).map((c, i) => {
          const Icon = c.icon;
          return (
            <Card
              key={i + 4}
              className="hover:shadow-lg transition-shadow duration-200"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {c.title}
                  </CardTitle>
                  <div className={`p-1 rounded-full ${c.bgColor}`}>
                    <Icon className={`h-4 w-4 ${c.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className={`text-xl font-bold ${c.color === "text-red-600" ? 'text-red-600' : 'text-gray-900'}`}>
                  {c.value}
                </div>
                <p className="text-xs text-gray-500 mt-1">{c.detail}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Grafik Lini Masa & Distribusi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik Simpanan */}
        <Card className="h-96 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Grafik Mutasi Total Pinjaman vs Simpanan (1 Tahun)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
              <Line data={{
                  labels,
                  datasets: [
                      { ...simpananData.datasets[0], label: "Simpanan (Kredit)", yAxisID: 'y' },
                      { ...pinjamanData.datasets[0], label: "Pinjaman (Debit)", borderColor: "rgba(59,130,246,1)", backgroundColor: "rgba(59,130,246,0.2)", fill: false, tension: 0.1, yAxisID: 'y' },
                  ]
              }} 
              options={commonOptions} />
          </CardContent>
        </Card>

        {/* Distribusi Simpanan (Pie Chart) */}
        <Card className="h-96">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-1">
                <PieChart className="h-4 w-4" /> Distribusi Simpanan
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {totalSimpanan > 0 ? (
                <Pie data={simpananPieData} options={pieOptions} />
            ) : (
                <div className="text-gray-500">Tidak ada data simpanan</div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Tabel Status Kualitas Pinjaman */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-1">
            <ListChecks className="h-4 w-4" /> Status Kualitas Pinjaman (Kolektibilitas)
          </CardTitle>
          <p className="text-sm text-gray-500">Posisi Outstanding Pinjaman Berdasarkan Kualitas</p>
        </CardHeader>
        <CardContent>
            <table className="min-w-full text-sm border-collapse">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-2 text-left">Kategori</th>
                        <th className="px-4 py-2 text-right">Outstanding Pokok</th>
                        <th className="px-4 py-2 text-right">Persentase Total</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Simulasi data kolektibilitas */}
                    {[
                        { label: "Lancar (Kol 1)", nominal: 24250000000, color: "text-green-600" }, // 95%
                        { label: "Dalam Perhatian Khusus (Kol 2)", nominal: 1000000000, color: "text-yellow-600" }, // ~4%
                        { label: "Kurang Lancar s/d Macet (Kol 3-5 / NPL)", nominal: 250000000, color: "text-red-600" }, // 1%
                    ].map((item, index) => {
                        const percent = (item.nominal / totalOutstanding) * 100;
                        return (
                            <tr key={index} className="border-t hover:bg-gray-50">
                                <td className="px-4 py-2">{item.label}</td>
                                <td className={`px-4 py-2 text-right font-semibold ${item.color}`}>
                                    {formatRupiah(item.nominal)}
                                </td>
                                <td className="px-4 py-2 text-right font-medium">
                                    {percent.toFixed(2)}%
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot className="bg-gray-200 font-bold border-t-2">
                    <tr>
                        <td className="px-4 py-2">TOTAL OUTSTANDING</td>
                        <td className="px-4 py-2 text-right">{formatRupiah(totalOutstanding)}</td>
                        <td className="px-4 py-2 text-right">100.00%</td>
                    </tr>
                </tfoot>
            </table>
        </CardContent>
      </Card>
      
      <p className="text-xs text-gray-500 mt-4">
        *Data di atas adalah simulasi dummy dan bukan data real-time.
      </p>
    </div>
  );
}