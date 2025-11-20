import { apiSlice } from "../../base-query";
import {
  Simpanan,
  SimpananResponse,
  CreateSimpananRequest,
  UpdateSimpananRequest,
} from "@/types/admin/konfigurasi/simpanan";

export const simpananApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 🔍 Get All Simpanan Categories (with pagination)
    getSimpananList: builder.query<
      {
        data: Simpanan[];
        last_page: number;
        current_page: number;
        total: number;
        per_page: number;
      },
      { page: number; paginate: number }
    >({
      query: ({ page, paginate }) => ({
        url: `/master/simpanan-categories`,
        method: "GET",
        params: {
          page,
          paginate,
        },
      }),
      transformResponse: (response: SimpananResponse) => ({
        data: response.data.data,
        last_page: response.data.last_page,
        current_page: response.data.current_page,
        total: response.data.total,
        per_page: response.data.per_page,
      }),
    }),

    // 🔍 Get Simpanan Category by ID
    getSimpananById: builder.query<Simpanan, number>({
      query: (id) => ({
        url: `/master/simpanan-categories/${id}`,
        method: "GET",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Simpanan;
      }) => response.data,
    }),

    // ➕ Create Simpanan Category
    createSimpanan: builder.mutation<
      Simpanan,
      CreateSimpananRequest
    >({
      query: (payload) => ({
        url: `/master/simpanan-categories`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Simpanan;
      }) => response.data,
    }),

    // ✏️ Update Simpanan Category by ID
    updateSimpanan: builder.mutation<
      Simpanan,
      { id: number; payload: UpdateSimpananRequest }
    >({
      query: ({ id, payload }) => ({
        url: `/master/simpanan-categories/${id}`,
        method: "PUT",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Simpanan;
      }) => response.data,
    }),

    // ❌ Delete Simpanan Category by ID
    deleteSimpanan: builder.mutation<
      { code: number; message: string },
      number
    >({
      query: (id) => ({
        url: `/master/simpanan-categories/${id}`,
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
  useGetSimpananListQuery,
  useGetSimpananByIdQuery,
  useCreateSimpananMutation,
  useUpdateSimpananMutation,
  useDeleteSimpananMutation,
} = simpananApi;
