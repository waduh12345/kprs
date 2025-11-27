import { apiSlice } from "../base-query";

// ==========================================
// Types & Interfaces
// ==========================================

export interface ReportCoaItem {
  id: number;
  coa_id: number | null;
  code: string;
  name: string;
  description: string;
  level: number;
  type: string; // "Global" | "Detail"
  created_at: string;
  updated_at: string;
  debit: number;
  credit: number;
  children: ReportCoaItem[]; // Struktur rekursif
}

export interface NeracaResponseData {
  assets: ReportCoaItem;
  liabilities_equity: ReportCoaItem[];
}

export interface LabaRugiResponseData {
  revenues: ReportCoaItem;
  expenses: ReportCoaItem[];
}

export interface ReportParams {
  from_date: string;
  to_date: string;
}

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// ==========================================
// Service Definition
// ==========================================

export const reportService = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 1. API Get Neraca
    getNeraca: builder.query<NeracaResponseData, ReportParams>({
      query: ({ from_date, to_date }) => ({
        url: `/report/neraca`,
        method: "GET",
        params: {
          from_date,
          to_date,
        },
      }),
      transformResponse: (response: ApiResponse<NeracaResponseData>) => {
        return response.data;
      },
    }),

    // 2. API Get Laba Rugi
    getLabaRugi: builder.query<LabaRugiResponseData, ReportParams>({
      query: ({ from_date, to_date }) => ({
        url: `/report/profit-loss`,
        method: "GET",
        params: {
          from_date,
          to_date,
        },
      }),
      transformResponse: (response: ApiResponse<LabaRugiResponseData>) => {
        return response.data;
      },
    }),
  }),
});

export const {
  useGetNeracaQuery,
  useLazyGetNeracaQuery,
  useGetLabaRugiQuery,
  useLazyGetLabaRugiQuery,
} = reportService;