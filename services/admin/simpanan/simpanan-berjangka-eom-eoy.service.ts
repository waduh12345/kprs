import { apiSlice } from "../../base-query";
import type {
  ApiResponse,
  BungaHarianListParams,
  BungaHarianParams,
  BungaHarianRecord,
  BungaHarianResponse,
  CalculateEomResponse,
  CalculateEoyResponse,
  ProcessEomParams,
  ProcessEomResponse,
  ProcessEoyParams,
  ProcessEoyResponse,
  SimpananBerjangkaAkrualBulanan,
  SimpananBerjangkaEomEoyPaginatedResponse,
  SimpananBerjangkaEomListParams,
  SimpananBerjangkaEoy,
  SimpananBerjangkaEoyListParams,
} from "@/types/admin/simpanan/simpanan-berjangka-eom-eoy";

const transformPaginated = <T>(
  response: ApiResponse<SimpananBerjangkaEomEoyPaginatedResponse<T>>
) => ({
  data: response.data.data,
  last_page: response.data.last_page,
  current_page: response.data.current_page,
  total: response.data.total,
  per_page: response.data.per_page,
});

export const simpananBerjangkaEomEoyApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /** GET /simpanan/berjangka/bunga/harian - Preview bunga per hari. */
    getBungaHarian: builder.query<BungaHarianResponse, BungaHarianParams>({
      query: (params) => ({
        url: `/simpanan/berjangka/bunga/harian`,
        method: "GET",
        params: {
          nominal: params.nominal,
          rate: params.rate,
        },
      }),
      transformResponse: (response: ApiResponse<BungaHarianResponse>) => response.data,
    }),

    /** GET /simpanan/berjangka/akrual/harian - Daftar laporan bunga harian (hasil schedular). */
    getBungaHarianList: builder.query<
      {
        data: BungaHarianRecord[];
        last_page: number;
        current_page: number;
        total: number;
        per_page: number;
      },
      BungaHarianListParams | void
    >({
      query: (params = {}) => {
        const p = params ?? {};
        return {
          url: `/simpanan/berjangka/akrual/harian`,
          method: "GET",
          params: {
            page: p.page ?? 1,
            paginate: p.paginate ?? 15,
            ...(p.date_from && { date_from: p.date_from }),
            ...(p.date_to && { date_to: p.date_to }),
            ...(p.search && { search: p.search }),
            ...(p.simpanan_berjangka_id != null && {
              simpanan_berjangka_id: p.simpanan_berjangka_id,
            }),
          },
        };
      },
      transformResponse: (
        response: ApiResponse<SimpananBerjangkaEomEoyPaginatedResponse<BungaHarianRecord>>
      ) => transformPaginated<BungaHarianRecord>(response),
    }),

    /** GET /simpanan/berjangka/akrual/eom - Daftar akrual bulanan (EOM). */
    getEomList: builder.query<
      {
        data: SimpananBerjangkaAkrualBulanan[];
        last_page: number;
        current_page: number;
        total: number;
        per_page: number;
      },
      SimpananBerjangkaEomListParams | void
    >({
      query: (params) => {
        const p = (params ?? {}) as Partial<SimpananBerjangkaEomListParams>;
        return {
          url: `/simpanan/berjangka/akrual/eom`,
          method: "GET",
          params: {
            page: p.page ?? 1,
            paginate: p.paginate ?? 15,
            ...(p.simpanan_berjangka_id != null && {
              simpanan_berjangka_id: p.simpanan_berjangka_id,
            }),
            ...(p.year != null && { year: p.year }),
            ...(p.month != null && { month: p.month }),
            ...(p.search && { search: p.search }),
          },
        };
      },
      transformResponse: (
        response: ApiResponse<SimpananBerjangkaEomEoyPaginatedResponse<SimpananBerjangkaAkrualBulanan>>
      ) => transformPaginated<SimpananBerjangkaAkrualBulanan>(response),
    }),

    /** GET /simpanan/berjangka/akrual/eom/calculate - Preview hitung EOM (tanpa simpan). */
    calculateEom: builder.query<
      CalculateEomResponse,
      { year: number; month: number }
    >({
      query: (params) => ({
        url: `/simpanan/berjangka/akrual/eom/calculate`,
        method: "GET",
        params: {
          year: params.year,
          month: params.month,
        },
      }),
      transformResponse: (response: ApiResponse<CalculateEomResponse>) =>
        response.data,
    }),

    /** POST /simpanan/berjangka/akrual/eom/process - Proses dan simpan EOM. */
    processEom: builder.mutation<ProcessEomResponse, ProcessEomParams>({
      query: (payload) => ({
        url: `/simpanan/berjangka/akrual/eom/process`,
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (response: ApiResponse<ProcessEomResponse>) =>
        response.data,
    }),

    /** GET /simpanan/berjangka/akrual/eoy - Daftar EOY (total bunga tahunan). */
    getEoyList: builder.query<
      {
        data: SimpananBerjangkaEoy[];
        last_page: number;
        current_page: number;
        total: number;
        per_page: number;
      },
      SimpananBerjangkaEoyListParams | void
    >({
      query: (params) => {
        const p = (params ?? {}) as Partial<SimpananBerjangkaEoyListParams>;
        return {
          url: `/simpanan/berjangka/akrual/eoy`,
          method: "GET",
          params: {
            page: p.page ?? 1,
            paginate: p.paginate ?? 15,
            ...(p.simpanan_berjangka_id != null && {
              simpanan_berjangka_id: p.simpanan_berjangka_id,
            }),
            ...(p.tahun != null && { tahun: p.tahun }),
            ...(p.search && { search: p.search }),
          },
        };
      },
      transformResponse: (
        response: ApiResponse<SimpananBerjangkaEomEoyPaginatedResponse<SimpananBerjangkaEoy>>
      ) => transformPaginated<SimpananBerjangkaEoy>(response),
    }),

    /** GET /simpanan/berjangka/akrual/eoy/calculate - Preview hitung EOY. */
    calculateEoy: builder.query<CalculateEoyResponse, { tahun: number }>({
      query: (params) => ({
        url: `/simpanan/berjangka/akrual/eoy/calculate`,
        method: "GET",
        params: { tahun: params.tahun },
      }),
      transformResponse: (response: ApiResponse<CalculateEoyResponse>) =>
        response.data,
    }),

    /** POST /simpanan/berjangka/akrual/eoy/process - Proses dan simpan EOY. */
    processEoy: builder.mutation<ProcessEoyResponse, ProcessEoyParams>({
      query: (payload) => ({
        url: `/simpanan/berjangka/akrual/eoy/process`,
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (response: ApiResponse<ProcessEoyResponse>) =>
        response.data,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetBungaHarianQuery,
  useLazyGetBungaHarianQuery,
  useGetBungaHarianListQuery,
  useGetEomListQuery,
  useCalculateEomQuery,
  useLazyCalculateEomQuery,
  useProcessEomMutation,
  useGetEoyListQuery,
  useCalculateEoyQuery,
  useLazyCalculateEoyQuery,
  useProcessEoyMutation,
} = simpananBerjangkaEomEoyApi;
