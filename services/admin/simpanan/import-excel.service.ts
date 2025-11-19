import { apiSlice } from "@/services/base-query";
import type {
  Simpanan,
  SimpananResponse,
} from "@/types/admin/simpanan";

// Interface untuk data yang dikembalikan dari List Simpanan, difilter dari SimpananResponse
interface SimpananListResponse {
  data: Simpanan[];
  last_page: number;
  current_page: number;
  total: number;
  per_page: number;
}

// Interface untuk parameter Get All Data (Simpanan)
interface GetSimpananListParams {
  page: number;
  paginate: number;
  search?: string;
  status?: number;
  from_date?: string;
  to_date?: string;
  user_id?: number;
  simpanan_category_id?: number;
}

export const simpananImportApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 🔍 Get All Data Simpanan Import (dengan pagination dan filter)
    // URL: /simpanan/import?paginate=10&search=&page=1&status=1&from_date=&to_date=&user_id=&simpanan_category_id=
    getSimpananImportList: builder.query<
      SimpananListResponse,
      GetSimpananListParams
    >({
      query: (params) => {
        const {
          page,
          paginate,
          search,
          status,
          from_date,
          to_date,
          user_id,
          simpanan_category_id,
        } = params;

        return {
          url: `/simpanan/import`,
          method: "GET",
          params: {
            page,
            paginate,
            // Tambahkan parameter lain hanya jika ada nilainya
            ...(typeof search === "string" && search.trim() !== ""
              ? { search }
              : {}),
            ...(typeof status === "number" ? { status } : {}),
            ...(typeof from_date === "string" && from_date.trim() !== ""
              ? { from_date }
              : {}),
            ...(typeof to_date === "string" && to_date.trim() !== ""
              ? { to_date }
              : {}),
            ...(typeof user_id === "number" ? { user_id } : {}),
            ...(typeof simpanan_category_id === "number"
              ? { simpanan_category_id }
              : {}),
          },
        };
      },
      transformResponse: (response: SimpananResponse) => ({
        data: response.data.data,
        last_page: response.data.last_page,
        current_page: response.data.current_page,
        total: response.data.total,
        per_page: response.data.per_page,
      }),
    }),

    // 🔍 Get Simpanan by ID
    // URL: /simpanan/import/{id}
    getSimpananImportById: builder.query<Simpanan, number>({
      query: (id) => ({
        url: `/simpanan/import/${id}`,
        method: "GET",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Simpanan;
      }) => response.data,
    }),

    // 📥 Post untuk Import Excel (Simpanan)
    // URL: /simpanan/import (metode POST)
    importSimpananExcel: builder.mutation<
      { code: number; message: string },
      { file: File }
    >({
      query: ({ file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/simpanan/import`,
          method: "POST",
          body: formData, // Mengirim FormData
        };
      },
      transformResponse: (response: {
        code: number;
        message: string;
        data?: unknown;
      }) => ({
        code: response.code,
        message: response.message,
      }),
    }),

    // 📄 Template Excel (GET)
    // URL: https://api-example.id/template-import-simpanan.csv
    // Endpoint ini hanya untuk mendapatkan URL template, bukan mengambil file (diasumsikan frontend akan menggunakan URL ini langsung)
    getSimpananImportTemplateUrl: builder.query<string, void>({
      queryFn: () => {
        return {
          data: "https://api-koperasi.naditechno.id/template-import-simpanan.csv", // Mengembalikan URL statis
        };
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSimpananImportListQuery,
  useGetSimpananImportByIdQuery,
  useImportSimpananExcelMutation,
  useGetSimpananImportTemplateUrlQuery,
} = simpananImportApi;