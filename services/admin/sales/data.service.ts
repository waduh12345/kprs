import { apiSlice } from "../../base-query";
import {
  Data,
  DataResponse,
  CreateDataRequest,
  UpdateDataRequest,
} from "@/types/admin/sales/data";

// Constant URL Template (Bisa diimport langsung di component)
export const SALES_TEMPLATE_URL =
  "https://api-koperasi.naditechno.id/template-import-sales.csv";

export const kategoriApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 🔍 Get All Data (with pagination)
    getDataList: builder.query<
      {
        data: Data[];
        last_page: number;
        current_page: number;
        total: number;
        per_page: number;
      },
      {
        page: number;
        paginate: number;
        orderBy?: string;
        order?: "asc" | "desc";
      }
    >({
      query: ({ page, paginate, orderBy, order }) => ({
        url: `/sales/sales`,
        method: "GET",
        params: {
          page,
          paginate,
          orderBy,
          order,
        },
      }),
      transformResponse: (response: DataResponse) => ({
        data: response.data.data,
        last_page: response.data.last_page,
        current_page: response.data.current_page,
        total: response.data.total,
        per_page: response.data.per_page,
      }),
    }),

    // 🔍 Get Data by ID
    getDataById: builder.query<Data, number>({
      query: (id) => ({
        url: `/sales/sales/${id}`,
        method: "GET",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Data;
      }) => response.data,
    }),

    // ➕ Create Data
    createData: builder.mutation<Data, CreateDataRequest>({
      query: (payload) => ({
        url: `/sales/sales`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Data;
      }) => response.data,
    }),

    // ✏️ Update Data by ID
    updateData: builder.mutation<
      Data,
      { id: number; payload: UpdateDataRequest }
    >({
      query: ({ id, payload }) => ({
        url: `/sales/sales/${id}`,
        method: "PUT",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Data;
      }) => response.data,
    }),

    // ❌ Delete Data by ID
    deleteData: builder.mutation<{ code: number; message: string }, number>({
      query: (id) => ({
        url: `/sales/sales/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: null;
      }) => response,
    }),

    // ✅ EXPORT Excel (body JSON: { from_date, to_date })
    exportDataExcel: builder.mutation<
      { code: number; message: string },
      { from_date: string; to_date: string }
    >({
      query: ({ from_date, to_date }) => ({
        url: `/sales/sales/export`,
        method: "POST",
        body: { from_date, to_date },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data?: string;
      }) => ({
        code: response.code,
        message: response.message,
      }),
    }),

    // ✅ IMPORT Excel (body FormData: { file })
    importDataExcel: builder.mutation<
      { code: number; message: string },
      { file: File }
    >({
      query: ({ file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/sales/sales/import`,
          method: "POST",
          body: formData,
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
  }),
  overrideExisting: false,
});

export const {
  useGetDataListQuery,
  useGetDataByIdQuery,
  useCreateDataMutation,
  useUpdateDataMutation,
  useDeleteDataMutation,
  useExportDataExcelMutation,
  useImportDataExcelMutation,
} = kategoriApi;