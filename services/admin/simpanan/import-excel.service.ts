import { apiSlice } from "@/services/base-query";
import type {
  SimpananExportParams,
  SimpananImportDetail,
  SimpananImportItem,
  SimpananImportListParams,
  SimpananImportResponse,
  SimpananMigrasiImportResponse,
  SimpananTagihanImportResponse,
} from "@/types/admin/simpanan/import-export";

/** Response paginated list (GET /simpanan/import) */
interface SimpananImportListApiResponse {
  data: SimpananImportItem[];
  last_page: number;
  current_page: number;
  total: number;
  per_page: number;
}

export const simpananImportApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /simpanan/import – list riwayat import (pagination + filter)
    getSimpananImportList: builder.query<
      SimpananImportListApiResponse,
      SimpananImportListParams
    >({
      query: (params) => {
        const {
          page = 1,
          paginate = 10,
          search,
          orderBy,
          order,
          searchBySpecific,
        } = params;
        return {
          url: `/simpanan/import`,
          method: "GET",
          params: {
            page,
            paginate,
            ...(search != null && search.trim() !== "" ? { search: search.trim() } : {}),
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
          data: SimpananImportItem[];
          last_page: number;
          total: number;
          per_page: number;
        };
      }): SimpananImportListApiResponse => ({
        data: response.data.data,
        last_page: response.data.last_page,
        current_page: response.data.current_page,
        total: response.data.total,
        per_page: response.data.per_page,
      }),
    }),

    // GET /simpanan/import/:id – detail satu import (dengan details, wallet, simpanan)
    getSimpananImportById: builder.query<SimpananImportDetail, number>({
      query: (id) => ({
        url: `/simpanan/import/${id}`,
        method: "GET",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: SimpananImportDetail;
      }) => response.data,
    }),

    // POST /simpanan/import – import setoran simpanan (xlsx/csv), data langsung masuk
    importSimpananExcel: builder.mutation<
      { code: number; message: string; data?: SimpananImportResponse },
      { file: File }
    >({
      query: ({ file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/simpanan/import`,
          method: "POST",
          body: formData,
        };
      },
      transformResponse: (response: {
        code: number;
        message: string;
        data?: SimpananImportResponse;
      }) => ({
        code: response.code,
        message: response.message,
        data: response.data,
      }),
    }),

    // POST /simpanan/import/tagihan – import tagihan (potong saldo simpanan)
    importSimpananTagihanExcel: builder.mutation<
      { code: number; message: string; data?: SimpananTagihanImportResponse },
      { file: File }
    >({
      query: ({ file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/simpanan/import/tagihan`,
          method: "POST",
          body: formData,
        };
      },
      transformResponse: (response: {
        code: number;
        message: string;
        data?: SimpananTagihanImportResponse;
      }) => ({
        code: response.code,
        message: response.message,
        data: response.data,
      }),
    }),

    // GET /simpanan/import/template – unduh template import setoran/tambah simpanan (xlsx)
    getSimpananTemplate: builder.query<Blob, void>({
      query: () => ({
        url: `/simpanan/import/template`,
        method: "GET",
        responseHandler: async (response) => {
          if (!response.ok) throw new Error("Gagal mengambil template import simpanan");
          return await response.blob();
        },
      }),
    }),

    // GET /simpanan/import/migrasi/template – unduh template import migrasi (rekening + saldo per anggota)
    getSimpananMigrasiTemplate: builder.query<Blob, void>({
      query: () => ({
        url: `/simpanan/import/migrasi/template`,
        method: "GET",
        responseHandler: async (response) => {
          if (!response.ok)
            throw new Error("Gagal mengambil template import migrasi simpanan");
          return await response.blob();
        },
      }),
    }),

    // POST /simpanan/import/migrasi – import migrasi (generate rekening + saldo per anggota)
    importSimpananMigrasiExcel: builder.mutation<
      { code: number; message: string; data?: SimpananMigrasiImportResponse },
      { file: File }
    >({
      query: ({ file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/simpanan/import/migrasi`,
          method: "POST",
          body: formData,
        };
      },
      transformResponse: (response: {
        code: number;
        message: string;
        data?: SimpananMigrasiImportResponse;
      }) => ({
        code: response.code,
        message: response.message,
        data: response.data,
      }),
    }),

    // GET /simpanan/import/tagihan/template – unduh template import tagihan (xlsx)
    getSimpananTagihanTemplate: builder.query<Blob, void>({
      query: () => ({
        url: `/simpanan/import/tagihan/template`,
        method: "GET",
        responseHandler: async (response) => {
          if (!response.ok) throw new Error("Gagal mengambil template tagihan");
          return await response.blob();
        },
      }),
    }),

    // POST /simpanan/export – export simpanan (queue, notifikasi saat selesai)
    exportSimpanan: builder.mutation<
      { code: number; message: string },
      SimpananExportParams
    >({
      query: ({ from_date, to_date }) => ({
        url: `/simpanan/export`,
        method: "POST",
        body: { from_date, to_date },
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (response: { code: number; message: string }) => ({
        code: response.code,
        message: response.message,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSimpananImportListQuery,
  useGetSimpananImportByIdQuery,
  useImportSimpananExcelMutation,
  useImportSimpananTagihanExcelMutation,
  useImportSimpananMigrasiExcelMutation,
  useLazyGetSimpananTemplateQuery,
  useLazyGetSimpananMigrasiTemplateQuery,
  useLazyGetSimpananTagihanTemplateQuery,
  useExportSimpananMutation,
} = simpananImportApi;
