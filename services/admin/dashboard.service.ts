import { apiSlice } from "../base-query";

// 📝 Tipe Data untuk Response Head
export interface DashboardHead {
  total_anggota: number;
  total_simpanan: string | number; // API mengembalikan string ("5350000") atau number
  total_pinjaman: number;
  total_tagihan_pinjaman_this_month: number;
}

// 📝 Tipe Data untuk Response Chart (Simpanan & Pinjaman)
export interface DashboardChartItem {
  month: string; // Format: "YYYY-MM"
  total: number | string; // API bisa mengembalikan number (0) atau string ("4500000")
}

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 1️⃣ Get Data Head
    getDataHead: builder.query<DashboardHead, void>({
      query: () => ({
        url: `/dashboard/koperasi/head`,
        method: "GET",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: DashboardHead;
      }) => response.data,
    }),

    // 2️⃣ Get Simpanan Chart
    getSimpananChart: builder.query<DashboardChartItem[], { year: number }>({
      query: ({ year }) => ({
        url: `/dashboard/koperasi/simpanan-chart`,
        method: "GET",
        params: { year },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: DashboardChartItem[];
      }) => response.data,
    }),

    // 3️⃣ Get Pinjaman Chart
    getPinjamanChart: builder.query<DashboardChartItem[], { year: number }>({
      query: ({ year }) => ({
        url: `/dashboard/koperasi/pinjaman-chart`,
        method: "GET",
        params: { year },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: DashboardChartItem[];
      }) => response.data,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetDataHeadQuery,
  useGetSimpananChartQuery,
  useGetPinjamanChartQuery,
} = dashboardApi;