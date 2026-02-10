import { apiSlice } from "../../base-query";
import type {
  ApiResponse,
  MasterBilyetBerjangka,
  MasterBilyetBerjangkaCreateRequest,
  MasterBilyetBerjangkaImportMigrasiResponse,
  MasterBilyetBerjangkaImportSampleResponse,
  MasterBilyetBerjangkaListParams,
  MasterBilyetBerjangkaLog,
  MasterBilyetBerjangkaLogListParams,
  MasterBilyetBerjangkaUpdateRequest,
  MasterPaginatedResponse,
  MasterTarifBunga,
  MasterTarifBungaCreateRequest,
  MasterTarifBungaImportMigrasiResponse,
  MasterTarifBungaImportSampleResponse,
  MasterTarifBungaListParams,
  MasterTarifBungaUpdateRequest,
  SimpananBerjangkaCategory,
  SimpananBerjangkaCategoryCreateRequest,
  SimpananBerjangkaCategoryListParams,
  SimpananBerjangkaCategoryUpdateRequest,
} from "@/types/admin/konfigurasi/master-simpanan-berjangka";

const transformPaginated = <T>(response: ApiResponse<MasterPaginatedResponse<T>>) => ({
  data: response.data.data,
  last_page: response.data.last_page,
  current_page: response.data.current_page,
  total: response.data.total,
  per_page: response.data.per_page,
});

export const masterSimpananBerjangkaApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ========== Master Tarif Bunga ==========
    getMasterTarifBungaList: builder.query<
      {
        data: MasterTarifBunga[];
        last_page: number;
        current_page: number;
        total: number;
        per_page: number;
      },
      MasterTarifBungaListParams | void
    >({
      query: (params = {}) => ({
        url: `/master/tarif-bunga`,
        method: "GET",
        params: {
          page: params?.page ?? 1,
          paginate: params?.paginate ?? 10,
          ...(params?.tenor_bulan != null && { tenor_bulan: params.tenor_bulan }),
          ...(params?.search && { search: params.search }),
          ...(params?.searchBySpecific && { searchBySpecific: params.searchBySpecific }),
          ...(params?.orderBy && { orderBy: params.orderBy }),
          ...(params?.order && { order: params.order }),
        },
      }),
      transformResponse: (response: ApiResponse<MasterPaginatedResponse<MasterTarifBunga>>) =>
        transformPaginated<MasterTarifBunga>(response),
    }),

    getMasterTarifBungaById: builder.query<MasterTarifBunga, number>({
      query: (id) => ({
        url: `/master/tarif-bunga/${id}`,
        method: "GET",
      }),
      transformResponse: (response: ApiResponse<MasterTarifBunga>) => response.data,
    }),

    createMasterTarifBunga: builder.mutation<MasterTarifBunga, MasterTarifBungaCreateRequest>({
      query: (payload) => ({
        url: `/master/tarif-bunga`,
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (response: ApiResponse<MasterTarifBunga>) => response.data,
    }),

    updateMasterTarifBunga: builder.mutation<
      MasterTarifBunga,
      { id: number; payload: MasterTarifBungaUpdateRequest }
    >({
      query: ({ id, payload }) => ({
        url: `/master/tarif-bunga/${id}?_method=PUT`,
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (response: ApiResponse<MasterTarifBunga>) => response.data,
    }),

    deleteMasterTarifBunga: builder.mutation<{ code: number; message: string }, number>({
      query: (id) => ({
        url: `/master/tarif-bunga/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiResponse<unknown>) => ({
        code: response.code,
        message: response.message,
      }),
    }),

    getMasterTarifBungaImportSample: builder.query<
      MasterTarifBungaImportSampleResponse,
      void
    >({
      query: () => ({
        url: `/master/tarif-bunga/import/sample`,
        method: "GET",
      }),
      transformResponse: (response: ApiResponse<MasterTarifBungaImportSampleResponse>) =>
        response.data,
    }),

    getMasterTarifBungaImportTemplate: builder.query<Blob, void>({
      query: () => ({
        url: `/master/tarif-bunga/import/template`,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),

    importMasterTarifBungaMigrasi: builder.mutation<
      MasterTarifBungaImportMigrasiResponse,
      File
    >({
      query: (file) => {
        const form = new FormData();
        form.append("file", file);
        return {
          url: `/master/tarif-bunga/import/migrasi`,
          method: "POST",
          body: form,
        };
      },
      transformResponse: (response: ApiResponse<MasterTarifBungaImportMigrasiResponse>) =>
        response.data,
    }),

    // ========== Master Bilyet Berjangka ==========
    getMasterBilyetBerjangkaList: builder.query<
      {
        data: MasterBilyetBerjangka[];
        last_page: number;
        current_page: number;
        total: number;
        per_page: number;
      },
      MasterBilyetBerjangkaListParams | void
    >({
      query: (params = {}) => ({
        url: `/master/bilyet-berjangka`,
        method: "GET",
        params: {
          page: params?.page ?? 1,
          paginate: params?.paginate ?? 10,
          ...(params?.status != null && { status: params.status }),
          ...(params?.tenor_bulan != null && { tenor_bulan: params.tenor_bulan }),
          ...(params?.search && { search: params.search }),
          ...(params?.searchBySpecific && { searchBySpecific: params.searchBySpecific }),
          ...(params?.orderBy && { orderBy: params.orderBy }),
          ...(params?.order && { order: params.order }),
        },
      }),
      transformResponse: (response: ApiResponse<MasterPaginatedResponse<MasterBilyetBerjangka>>) =>
        transformPaginated<MasterBilyetBerjangka>(response),
    }),

    getMasterBilyetBerjangkaById: builder.query<MasterBilyetBerjangka, number>({
      query: (id) => ({
        url: `/master/bilyet-berjangka/${id}`,
        method: "GET",
      }),
      transformResponse: (response: ApiResponse<MasterBilyetBerjangka>) => response.data,
    }),

    createMasterBilyetBerjangka: builder.mutation<
      MasterBilyetBerjangka,
      MasterBilyetBerjangkaCreateRequest
    >({
      query: (payload) => ({
        url: `/master/bilyet-berjangka`,
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (response: ApiResponse<MasterBilyetBerjangka>) => response.data,
    }),

    updateMasterBilyetBerjangka: builder.mutation<
      MasterBilyetBerjangka,
      { id: number; payload: MasterBilyetBerjangkaUpdateRequest }
    >({
      query: ({ id, payload }) => ({
        url: `/master/bilyet-berjangka/${id}?_method=PUT`,
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (response: ApiResponse<MasterBilyetBerjangka>) => response.data,
    }),

    deleteMasterBilyetBerjangka: builder.mutation<{ code: number; message: string }, number>({
      query: (id) => ({
        url: `/master/bilyet-berjangka/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiResponse<unknown>) => ({
        code: response.code,
        message: response.message,
      }),
    }),

    getMasterBilyetBerjangkaImportSample: builder.query<
      MasterBilyetBerjangkaImportSampleResponse,
      void
    >({
      query: () => ({
        url: `/master/bilyet-berjangka/import/sample`,
        method: "GET",
      }),
      transformResponse: (response: ApiResponse<MasterBilyetBerjangkaImportSampleResponse>) =>
        response.data,
    }),

    getMasterBilyetBerjangkaImportTemplate: builder.query<Blob, void>({
      query: () => ({
        url: `/master/bilyet-berjangka/import/template`,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),

    importMasterBilyetBerjangkaMigrasi: builder.mutation<
      MasterBilyetBerjangkaImportMigrasiResponse,
      File
    >({
      query: (file) => {
        const form = new FormData();
        form.append("file", file);
        return {
          url: `/master/bilyet-berjangka/import/migrasi`,
          method: "POST",
          body: form,
        };
      },
      transformResponse: (response: ApiResponse<MasterBilyetBerjangkaImportMigrasiResponse>) =>
        response.data,
    }),

    // ========== Master Bilyet Berjangka Log ==========
    getMasterBilyetBerjangkaLogList: builder.query<
      {
        data: MasterBilyetBerjangkaLog[];
        last_page: number;
        current_page: number;
        total: number;
        per_page: number;
      },
      MasterBilyetBerjangkaLogListParams | void
    >({
      query: (params = {}) => {
        const p = (params ?? {}) as Partial<MasterBilyetBerjangkaLogListParams>;
        return {
          url: `/master/bilyet-berjangka-logs`,
          method: "GET",
          params: {
            paginate: p.paginate ?? 15,
            ...(p.master_bilyet_berjangka_id != null && {
              master_bilyet_berjangka_id: p.master_bilyet_berjangka_id,
            }),
            ...(p.simpanan_berjangka_id != null && {
              simpanan_berjangka_id: p.simpanan_berjangka_id,
            }),
            ...(p.event && { event: p.event }),
          },
        };
      },
      transformResponse: (
        response: ApiResponse<MasterPaginatedResponse<MasterBilyetBerjangkaLog>>
      ) => ({
        data: response.data.data,
        last_page: response.data.last_page,
        current_page: response.data.current_page,
        total: response.data.total,
        per_page: response.data.per_page,
      }),
    }),

    getMasterBilyetBerjangkaLogById: builder.query<MasterBilyetBerjangkaLog, number>({
      query: (id) => ({
        url: `/master/bilyet-berjangka-logs/${id}`,
        method: "GET",
      }),
      transformResponse: (response: ApiResponse<MasterBilyetBerjangkaLog>) => response.data,
    }),

    // ========== Simpanan Berjangka Category ==========
    getSimpananBerjangkaCategoryList: builder.query<
      {
        data: SimpananBerjangkaCategory[];
        last_page: number;
        current_page: number;
        total: number;
        per_page: number;
      },
      SimpananBerjangkaCategoryListParams | void
    >({
      query: (params = {}) => ({
        url: `/master/simpanan-berjangka-categories`,
        method: "GET",
        params: {
          page: params?.page ?? 1,
          paginate: params?.paginate ?? 10,
          ...(params?.status != null && { status: params.status }),
          ...(params?.search && { search: params.search }),
          ...(params?.searchBySpecific && { searchBySpecific: params.searchBySpecific }),
          ...(params?.orderBy && { orderBy: params.orderBy }),
          ...(params?.order && { order: params.order }),
        },
      }),
      transformResponse: (response: ApiResponse<MasterPaginatedResponse<SimpananBerjangkaCategory>>) =>
        transformPaginated<SimpananBerjangkaCategory>(response),
    }),

    getSimpananBerjangkaCategoryById: builder.query<SimpananBerjangkaCategory, number>({
      query: (id) => ({
        url: `/master/simpanan-berjangka-categories/${id}`,
        method: "GET",
      }),
      transformResponse: (response: ApiResponse<SimpananBerjangkaCategory>) => response.data,
    }),

    createSimpananBerjangkaCategory: builder.mutation<
      SimpananBerjangkaCategory,
      SimpananBerjangkaCategoryCreateRequest
    >({
      query: (payload) => ({
        url: `/master/simpanan-berjangka-categories`,
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (response: ApiResponse<SimpananBerjangkaCategory>) => response.data,
    }),

    updateSimpananBerjangkaCategory: builder.mutation<
      SimpananBerjangkaCategory,
      { id: number; payload: SimpananBerjangkaCategoryUpdateRequest }
    >({
      query: ({ id, payload }) => ({
        url: `/master/simpanan-berjangka-categories/${id}?_method=PUT`,
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (response: ApiResponse<SimpananBerjangkaCategory>) => response.data,
    }),

    deleteSimpananBerjangkaCategory: builder.mutation<{ code: number; message: string }, number>({
      query: (id) => ({
        url: `/master/simpanan-berjangka-categories/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiResponse<unknown>) => ({
        code: response.code,
        message: response.message,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMasterTarifBungaListQuery,
  useGetMasterTarifBungaByIdQuery,
  useCreateMasterTarifBungaMutation,
  useUpdateMasterTarifBungaMutation,
  useDeleteMasterTarifBungaMutation,
  useGetMasterTarifBungaImportSampleQuery,
  useLazyGetMasterTarifBungaImportTemplateQuery,
  useImportMasterTarifBungaMigrasiMutation,
  useGetMasterBilyetBerjangkaListQuery,
  useGetMasterBilyetBerjangkaByIdQuery,
  useCreateMasterBilyetBerjangkaMutation,
  useUpdateMasterBilyetBerjangkaMutation,
  useDeleteMasterBilyetBerjangkaMutation,
  useGetMasterBilyetBerjangkaImportSampleQuery,
  useLazyGetMasterBilyetBerjangkaImportTemplateQuery,
  useImportMasterBilyetBerjangkaMigrasiMutation,
  useGetMasterBilyetBerjangkaLogListQuery,
  useGetMasterBilyetBerjangkaLogByIdQuery,
  useGetSimpananBerjangkaCategoryListQuery,
  useGetSimpananBerjangkaCategoryByIdQuery,
  useCreateSimpananBerjangkaCategoryMutation,
  useUpdateSimpananBerjangkaCategoryMutation,
  useDeleteSimpananBerjangkaCategoryMutation,
} = masterSimpananBerjangkaApi;
