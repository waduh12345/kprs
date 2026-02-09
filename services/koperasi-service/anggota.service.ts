import { apiSlice } from "../base-query";
import type {
  AnggotaBulkStatusResponse,
  AnggotaImportResponse,
  AnggotaKoperasi,
  AnggotaListParams,
  AnggotaStatus,
  LogAnggotaStatus,
  LogAnggotaStatusDisplay,
} from "@/types/koperasi-types/anggota";
import { getAnggotaStatusLabel } from "@/types/koperasi-types/anggota";

export const anggotaApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /anggota/anggotas – list dengan filter & pagination
    getAnggotaList: builder.query<
      {
        data: AnggotaKoperasi[];
        last_page: number;
        current_page: number;
        total: number;
        per_page: number;
      },
      AnggotaListParams
    >({
      query: (params) => {
        const {
          page = 1,
          paginate = 10,
          search,
          status,
          type,
          meninggal,
          birth_year,
          birth_month,
          orderBy,
          order,
          searchBySpecific,
        } = params;
        return {
          url: `/anggota/anggotas`,
          method: "GET",
          params: {
            page,
            paginate,
            ...(search != null && search.trim() !== "" ? { search: search.trim() } : {}),
            ...(status !== undefined ? { status } : {}),
            ...(type != null ? { type } : {}),
            ...(meninggal !== undefined ? { meninggal: meninggal ? 1 : 0 } : {}),
            ...(birth_year !== undefined ? { birth_year } : {}),
            ...(birth_month !== undefined ? { birth_month } : {}),
            ...(orderBy != null ? { orderBy } : {}),
            ...(order != null ? { order } : {}),
            ...(searchBySpecific != null ? { searchBySpecific } : {}),
          },
        };
      },
      transformResponse: (response: {
        code: number;
        message: string;
        data: {
          current_page: number;
          data: AnggotaKoperasi[];
          last_page: number;
          total: number;
          per_page: number;
        };
      }) => ({
        data: response.data.data,
        last_page: response.data.last_page,
        current_page: response.data.current_page,
        total: response.data.total,
        per_page: response.data.per_page,
      }),
    }),

    // GET /anggota/anggotas/:id – detail (dengan documents, user, individu, perusahaan, status_logs)
    getAnggotaById: builder.query<AnggotaKoperasi, number>({
      query: (id) => ({
        url: `/anggota/anggotas/${id}`,
        method: "GET",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: AnggotaKoperasi;
      }) => response.data,
    }),

    // GET log perubahan status untuk satu anggota (menggunakan data dari show, siap tampil)
    getAnggotaStatusLogs: builder.query<LogAnggotaStatusDisplay[], number>({
      query: (anggotaId) => ({
        url: `/anggota/anggotas/${anggotaId}`,
        method: "GET",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: AnggotaKoperasi;
      }): LogAnggotaStatusDisplay[] => {
        const data = response.data;
        const logs: LogAnggotaStatus[] =
          data?.status_logs ?? (data as { statusLogs?: LogAnggotaStatus[] })?.statusLogs ?? [];
        return logs.map(
          (log): LogAnggotaStatusDisplay => ({
            ...log,
            from_status_label: getAnggotaStatusLabel(log.from_status),
            to_status_label: getAnggotaStatusLabel(log.to_status),
            changed_by_name: log.user?.name,
          })
        );
      },
    }),

    // POST /anggota/anggotas – create
    createAnggota: builder.mutation<AnggotaKoperasi, FormData>({
      query: (payload) => ({
        url: `/anggota/anggotas`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: AnggotaKoperasi;
      }) => response.data,
    }),

    // PUT /anggota/anggotas/:id – update
    updateAnggota: builder.mutation<
      AnggotaKoperasi,
      { id: number; payload: FormData }
    >({
      query: ({ id, payload }) => ({
        url: `/anggota/anggotas/${id}?_method=PUT`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: AnggotaKoperasi;
      }) => response.data,
    }),

    // DELETE /anggota/anggotas/:id
    deleteAnggota: builder.mutation<{ code: number; message: string }, number>({
      query: (id) => ({
        url: `/anggota/anggotas/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data?: null;
      }) => ({ code: response.code, message: response.message }),
    }),

    // PUT /anggota/anggotas/:id/status – ubah status satu anggota (log ke log_anggota_status)
    updateAnggotaStatus: builder.mutation<
      AnggotaKoperasi,
      { id: number; status: AnggotaStatus }
    >({
      query: ({ id, status }) => ({
        url: `/anggota/anggotas/${id}/status`,
        method: "PUT",
        body: { status },
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: AnggotaKoperasi;
      }) => response.data,
    }),

    // PUT /anggota/anggotas/:id/validate – validasi status (hanya jika status saat ini Pending)
    validateAnggotaStatus: builder.mutation<
      AnggotaKoperasi,
      { id: number; status: AnggotaStatus }
    >({
      query: ({ id, status }) => ({
        url: `/anggota/anggotas/${id}/validate`,
        method: "PUT",
        body: { status },
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: AnggotaKoperasi;
      }) => response.data,
    }),

    // POST /anggota/anggotas/bulk-status – ubah status banyak anggota
    updateAnggotaStatusBulk: builder.mutation<
      AnggotaBulkStatusResponse,
      { ids: number[]; status: AnggotaStatus }
    >({
      query: ({ ids, status }) => ({
        url: `/anggota/anggotas/bulk-status`,
        method: "POST",
        body: { ids, status },
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data?: { updated: number };
      }) => ({
        code: response.code,
        message: response.message,
        data: response.data,
      }),
    }),

    // POST /anggota/anggotas/export – export (from_date, to_date)
    exportAnggotaExcel: builder.mutation<
      { code: number; message: string },
      { from_date: string; to_date: string }
    >({
      query: ({ from_date, to_date }) => ({
        url: `/anggota/anggotas/export`,
        method: "POST",
        body: { from_date, to_date },
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data?: string;
      }) => ({ code: response.code, message: response.message }),
    }),

    // POST /anggota/anggotas/import – import Excel (xlsx/csv), data langsung masuk
    importAnggotaExcel: builder.mutation<
      { code: number; message: string; data?: AnggotaImportResponse },
      { file: File }
    >({
      query: ({ file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/anggota/anggotas/import`,
          method: "POST",
          body: formData,
        };
      },
      transformResponse: (response: {
        code: number;
        message: string;
        data?: AnggotaImportResponse;
      }) => ({
        code: response.code,
        message: response.message,
        data: response.data,
      }),
    }),

    // GET /anggota/anggotas/import/template – unduh template import (xlsx)
    getAnggotaImportTemplate: builder.query<Blob, void>({
      query: () => ({
        url: `/anggota/anggotas/import/template`,
        method: "GET",
        responseHandler: async (response) => {
          if (!response.ok) throw new Error("Gagal mengambil template");
          return await response.blob();
        },
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAnggotaListQuery,
  useGetAnggotaByIdQuery,
  useGetAnggotaStatusLogsQuery,
  useLazyGetAnggotaStatusLogsQuery,
  useCreateAnggotaMutation,
  useUpdateAnggotaMutation,
  useDeleteAnggotaMutation,
  useUpdateAnggotaStatusMutation,
  useValidateAnggotaStatusMutation,
  useUpdateAnggotaStatusBulkMutation,
  useExportAnggotaExcelMutation,
  useImportAnggotaExcelMutation,
  useLazyGetAnggotaImportTemplateQuery,
} = anggotaApi;

/** @deprecated Gunakan useLazyGetAnggotaImportTemplateQuery. Template format xlsx. */
export const useLazyGetTemplateCsvQuery = useLazyGetAnggotaImportTemplateQuery;
