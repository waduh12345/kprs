import { apiSlice } from "../../base-query";
import { 
  Pembiayaan, 
  PembiayaanResponse, 
  CreatePembiayaanRequest, 
  UpdatePembiayaanRequest 
} from "@/types/admin/konfigurasi/pembiayaan";

export const pembiayaanApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 🔍 Get All Pinjaman Categories (with pagination)
    getPembiayaanList: builder.query<
      {
        data: Pembiayaan[];
        last_page: number;
        current_page: number;
        total: number;
        per_page: number;
      },
      { page: number; paginate: number }
    >({
      query: ({ page, paginate }) => ({
        url: `/master/pinjaman-categories`,
        method: "GET",
        params: {
          page,
          paginate,
        },
      }),
      transformResponse: (response: PembiayaanResponse) => ({
        data: response.data.data,
        last_page: response.data.last_page,
        current_page: response.data.current_page,
        total: response.data.total,
        per_page: response.data.per_page,
      }),
    }),

    // 🔍 Get Pinjaman Category by ID
    getPembiayaanById: builder.query<Pembiayaan, number>({
      query: (id) => ({
        url: `/master/pinjaman-categories/${id}`,
        method: "GET",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Pembiayaan;
      }) => response.data,
    }),

    // ➕ Create Pinjaman Category
    createPembiayaan: builder.mutation<
      Pembiayaan, 
      CreatePembiayaanRequest
    >({
      query: (payload) => ({
        url: `/master/pinjaman-categories`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Pembiayaan;
      }) => response.data,
    }),

    // ✏️ Update Pinjaman Category by ID
    updatePembiayaan: builder.mutation<
      Pembiayaan,
      { id: number; payload: UpdatePembiayaanRequest }
    >({
      query: ({ id, payload }) => ({
        url: `/master/pinjaman-categories/${id}`,
        method: "PUT",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Pembiayaan;
      }) => response.data,
    }),

    // ❌ Delete Pinjaman Category by ID
    deletePembiayaan: builder.mutation<
      { code: number; message: string },
      number
    >({
      query: (id) => ({
        url: `/master/pinjaman-categories/${id}`,
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
  useGetPembiayaanListQuery,
  useGetPembiayaanByIdQuery,
  useCreatePembiayaanMutation,
  useUpdatePembiayaanMutation,
  useDeletePembiayaanMutation,
} = pembiayaanApi;
