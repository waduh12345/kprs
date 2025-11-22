"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Banknote,
  CreditCard,
  CalendarDays,
  Target,
  BookOpen,
  PieChart,
  ListChecks,
  DollarSign,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  useGetDataHeadQuery,
  useGetSimpananChartQuery,
  useGetPinjamanChartQuery,
} from "@/services/admin/dashboard.service";

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
  ArcElement,
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

// --- DUMMY DATA (HANYA UNTUK BAGIAN YANG BELUM ADA API-NYA) ---
// Bagian: SHU, NPL, Neraca, Distribusi Simpanan
const DUMMY_DATA_FALLBACK = {
  shu_tahun_berjalan: 500000000,
  neraca_balanced: true,
  kas_bank: 5500000000,
  kol_lancar: 24250000000,
  kol_dpd: 1000000000,
  kol_macet: 250000000,
  // Untuk Pie Chart Simpanan (karena API head belum memecah per kategori)
  simpanan_detail: [1250000000, 5000000000, 11800000000, 2000000000],
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

// Generate Label Bulan (Jan - Des) untuk tahun yang dipilih
const getMonthLabels = () => [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  // 1. Fetch Data API
  const { data: headData, isLoading: loadHead } = useGetDataHeadQuery();
  
  const { data: simpananChartResponse, isLoading: loadSimpanan } = useGetSimpananChartQuery({
    year: year,
  });

  const { data: pinjamanChartResponse, isLoading: loadPinjaman } = useGetPinjamanChartQuery({
    year: year,
  });

  const isLoading = loadHead || loadSimpanan || loadPinjaman;

  // 2. Process Chart Data (Mapping API response to Array[12])
  const { labels, simpananSeries, pinjamanSeries } = useMemo(() => {
    const monthLabels = getMonthLabels();
    
    // Helper untuk mapping data API ({month: "2025-01", total: ...}) ke array urut index 0-11
    const mapToYearlyData = (apiData: { month: string; total: string | number }[] | undefined) => {
      const dataArray = new Array(12).fill(0);
      
      if (!apiData) return dataArray;

      apiData.forEach((item) => {
        // item.month format "YYYY-MM" -> ambil bagian MM
        const monthIndex = parseInt(item.month.split("-")[1], 10) - 1; 
        if (monthIndex >= 0 && monthIndex < 12) {
          dataArray[monthIndex] = Number(item.total);
        }
      });
      
      return dataArray;
    };

    return {
      labels: monthLabels,
      simpananSeries: mapToYearlyData(simpananChartResponse),
      pinjamanSeries: mapToYearlyData(pinjamanChartResponse),
    };
  }, [simpananChartResponse, pinjamanChartResponse]);


  // 3. Pie Chart Data (Masih Dummy karena API belum menyediakan detail per kategori)
  const simpananPieData: ChartData<"pie"> = useMemo(() => ({
    labels: ['Pokok', 'Wajib', 'Sukarela', 'Berjangka'],
    datasets: [{
        data: DUMMY_DATA_FALLBACK.simpanan_detail,
        backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)'
        ],
    }]
  }), []);

  // 4. Setup Data Cards (Ambil dari API Head)
  const totalAnggota = headData?.total_anggota ?? 0;
  const totalSimpanan = Number(headData?.total_simpanan ?? 0);
  const totalPinjaman = headData?.total_pinjaman ?? 0;
  const totalTagihanBulanIni = headData?.total_tagihan_pinjaman_this_month ?? 0;
  
  // Kalkulasi rasio dummy (karena API belum ada)
  const totalOutstandingDummy = DUMMY_DATA_FALLBACK.kol_lancar + DUMMY_DATA_FALLBACK.kol_dpd + DUMMY_DATA_FALLBACK.kol_macet;
  const nplRatio = (DUMMY_DATA_FALLBACK.kol_macet + DUMMY_DATA_FALLBACK.kol_dpd) / totalOutstandingDummy;

  const cards = [
    {
      title: "Total Anggota Aktif",
      value: formatNumber(totalAnggota),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      detail: "Data Realtime",
    },
    {
      title: "Total Simpanan",
      value: formatRupiah(totalSimpanan),
      icon: Banknote,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      detail: "Akumulasi Simpanan",
    },
    {
      title: "Total Piutang Pinjaman",
      value: formatRupiah(totalPinjaman),
      icon: CreditCard,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      detail: "Outstanding Pinjaman",
    },
    {
      title: "SHU Tahun Berjalan",
      value: formatRupiah(DUMMY_DATA_FALLBACK.shu_tahun_berjalan),
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      detail: "Estimasi (Dummy)",
    },
    {
      title: "Tagihan Bulan Ini",
      value: formatRupiah(totalTagihanBulanIni),
      icon: CalendarDays,
      color: "text-red-600",
      bgColor: "bg-red-100",
      detail: "Jatuh Tempo Bulan Ini",
    },
    {
      title: "Rasio NPF / NPL",
      value: `${(nplRatio * 100).toFixed(2)}%`,
      icon: Target,
      color: nplRatio > 0.05 ? "text-red-600" : "text-green-600",
      bgColor: nplRatio > 0.05 ? "bg-red-100" : "bg-green-100",
      detail: "Simulasi (Dummy)",
    },
    {
        title: "Keseimbangan Neraca",
        value: DUMMY_DATA_FALLBACK.neraca_balanced ? "SEIMBANG" : "TIDAK",
        icon: BookOpen,
        color: DUMMY_DATA_FALLBACK.neraca_balanced ? "text-green-600" : "text-red-600",
        bgColor: DUMMY_DATA_FALLBACK.neraca_balanced ? "bg-green-100" : "bg-red-100",
        detail: "Simulasi (Dummy)",
    },
    {
        title: "Kas & Bank",
        value: formatRupiah(DUMMY_DATA_FALLBACK.kas_bank),
        icon: Banknote,
        color: "text-gray-600",
        bgColor: "bg-gray-100",
        detail: "Simulasi (Dummy)",
    },
  ];

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
    }
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Koperasi</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-1/2 bg-gray-200 rounded mt-2"></div>
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
          Ringkasan kinerja operasional Tahun {year}
        </p>
      </div>

      {/* Kartu Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Card
              key={i}
              className={`hover:shadow-lg transition-shadow duration-200 ${i < 4 ? 'border-l-4 border-indigo-500' : ''}`}
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
        {/* Grafik Simpanan vs Pinjaman (API DATA) */}
        <Card className="h-96 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Trend Simpanan vs Pinjaman ({year})
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
              <Line data={{
                  labels,
                  datasets: [
                      { 
                        label: "Simpanan (API)", 
                        data: simpananSeries,
                        borderColor: "rgba(16,185,129,1)", 
                        backgroundColor: "rgba(16,185,129,0.2)",
                        fill: true,
                        tension: 0.35,
                        pointRadius: 3,
                      },
                      { 
                        label: "Pinjaman (API)", 
                        data: pinjamanSeries,
                        borderColor: "rgba(59,130,246,1)", 
                        backgroundColor: "rgba(59,130,246,0.2)",
                        fill: true,
                        tension: 0.35,
                        pointRadius: 3,
                      },
                  ]
              }} 
              options={commonOptions} />
          </CardContent>
        </Card>

        {/* Distribusi Simpanan (Pie Chart - DUMMY) */}
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
                <div className="text-gray-500 text-sm text-center">
                  Data simpanan belum tersedia<br/>(Menggunakan data dummy untuk visualisasi)
                  </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Tabel Status Kualitas Pinjaman (DUMMY) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-1">
            <ListChecks className="h-4 w-4" /> Status Kualitas Pinjaman
          </CardTitle>
          <p className="text-sm text-gray-500">Data Kolektibilitas (Simulasi)</p>
        </CardHeader>
        <CardContent>
            <table className="min-w-full text-sm border-collapse">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-2 text-left">Kategori</th>
                        <th className="px-4 py-2 text-right">Outstanding Pokok</th>
                        <th className="px-4 py-2 text-right">Persentase</th>
                    </tr>
                </thead>
                <tbody>
                    {[
                        { label: "Lancar", nominal: DUMMY_DATA_FALLBACK.kol_lancar, color: "text-green-600" },
                        { label: "Dalam Perhatian Khusus", nominal: DUMMY_DATA_FALLBACK.kol_dpd, color: "text-yellow-600" },
                        { label: "Macet", nominal: DUMMY_DATA_FALLBACK.kol_macet, color: "text-red-600" },
                    ].map((item, index) => {
                        const percent = (item.nominal / totalOutstandingDummy) * 100;
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
            </table>
        </CardContent>
      </Card>
      
      <p className="text-xs text-gray-500 mt-4">
        *Data Anggota, Total Simpanan, Total Pinjaman, Tagihan Bulan Ini, dan Grafik Garis bersumber dari API Realtime. Data lainnya masih simulasi.
      </p>
    </div>
  );
}