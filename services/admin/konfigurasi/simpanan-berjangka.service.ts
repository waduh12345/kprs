import { apiSlice } from "../../base-query";
import {
  SimpananBerjangka,
  SimpananBerjangkaResponse,
  CreateSimpananBerjangkaRequest,
  UpdateSimpananBerjangkaRequest,
} from "@/types/admin/konfigurasi/simpanan-berjangka";

export const simpananBerjangka = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 🔍 Get All SimpananBerjangka Categories (with pagination)
    getSimpananBerjangkaList: builder.query<
      {
        data: SimpananBerjangka[];
        last_page: number;
        current_page: number;
        total: number;
        per_page: number;
      },
      { page: number; paginate: number }
    >({
      query: ({ page, paginate }) => ({
        url: `/master/simpanan-berjangka-categories`,
        method: "GET",
        params: {
          page,
          paginate,
        },
      }),
      transformResponse: (response: SimpananBerjangkaResponse) => ({
        data: response.data.data,
        last_page: response.data.last_page,
        current_page: response.data.current_page,
        total: response.data.total,
        per_page: response.data.per_page,
      }),
    }),

    // 🔍 Get SimpananBerjangka Category by ID
    getSimpananBerjangkaById: builder.query<SimpananBerjangka, number>({
      query: (id) => ({
        url: `/master/simpanan-berjangka-categories/${id}`,
        method: "GET",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: SimpananBerjangka;
      }) => response.data,
    }),

    // ➕ Create SimpananBerjangka Category
    createSimpananBerjangka: builder.mutation<
      SimpananBerjangka,
      CreateSimpananBerjangkaRequest
    >({
      query: (payload) => ({
        url: `/master/simpanan-berjangka-categories`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: SimpananBerjangka;
      }) => response.data,
    }),

    // ✏️ Update SimpananBerjangka Category by ID
    updateSimpananBerjangka: builder.mutation<
      SimpananBerjangka,
      { id: number; payload: UpdateSimpananBerjangkaRequest }
    >({
      query: ({ id, payload }) => ({
        url: `/master/simpanan-berjangka-categories/${id}`,
        method: "PUT",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: SimpananBerjangka;
      }) => response.data,
    }),

    // ❌ Delete SimpananBerjangka Category by ID
    deleteSimpananBerjangka: builder.mutation<
      { code: number; message: string },
      number
    >({
      query: (id) => ({
        url: `/master/simpanan-berjangka-categories/${id}`,
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
  useGetSimpananBerjangkaListQuery,
  useGetSimpananBerjangkaByIdQuery,
  useCreateSimpananBerjangkaMutation,
  useUpdateSimpananBerjangkaMutation,
  useDeleteSimpananBerjangkaMutation,
} = simpananBerjangka;
