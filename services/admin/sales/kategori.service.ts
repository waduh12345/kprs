import { apiSlice } from "../../base-query";
import {
  Kategori,
  KategoriResponse,
  CreateKategoriRequest,
  UpdateKategoriRequest,
} from "@/types/admin/sales/kategori";

export const kategoriApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 🔍 Get All Simpanan Categories (with pagination)
    getKategoriList: builder.query<
      {
        data: Kategori[];
        last_page: number;
        current_page: number;
        total: number;
        per_page: number;
      },
      { page: number; paginate: number; orderBy?: string; order?: "asc" | "desc" }
    >({
      query: ({ page, paginate, orderBy, order }) => ({
        url: `/sales/categories`,
        method: "GET",
        params: {
          page,
          paginate,
          orderBy,
          order,
        },
      }),
      transformResponse: (response: KategoriResponse) => ({
        data: response.data.data,
        last_page: response.data.last_page,
        current_page: response.data.current_page,
        total: response.data.total,
        per_page: response.data.per_page,
      }),
    }),

    // 🔍 Get Simpanan Category by ID
    getKategoriById: builder.query<Kategori, number>({
      query: (id) => ({
        url: `/sales/categories/${id}`,
        method: "GET",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Kategori;
      }) => response.data,
    }),

    // ➕ Create Simpanan Category
    createKategori: builder.mutation<
      Kategori,
      CreateKategoriRequest
    >({
      query: (payload) => ({
        url: `/sales/categories`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Kategori;
      }) => response.data,
    }),

    // ✏️ Update Simpanan Category by ID
    updateKategori: builder.mutation<
      Kategori,
      { id: number; payload: UpdateKategoriRequest }
    >({
      query: ({ id, payload }) => ({
        url: `/sales/categories/${id}`,
        method: "PUT",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Kategori;
      }) => response.data,
    }),

    // ❌ Delete Simpanan Category by ID
    deleteKategori: builder.mutation<
      { code: number; message: string },
      number
    >({
      query: (id) => ({
        url: `/sales/categories/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: null;
      }) => response,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetKategoriListQuery,
  useGetKategoriByIdQuery,
  useCreateKategoriMutation,
  useUpdateKategoriMutation,
  useDeleteKategoriMutation,
} = kategoriApi;
