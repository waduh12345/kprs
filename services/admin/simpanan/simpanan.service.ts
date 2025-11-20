import { apiSlice } from "../../base-query";
import {
  Simpanan,
  SimpananResponse,
  CreateSimpananRequest,
  UpdateSimpananRequest,
  PaymentHistory,
  PaymentHistoryResponse,
} from "@/types/admin/simpanan";

export const simpananApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 🔍 Get All Simpanan (with pagination and filters)
    getSimpananList: builder.query<
      {
        data: Simpanan[];
        last_page: number;
        current_page: number;
        total: number;
        per_page: number;
      },
      {
        page: number;
        paginate: number;
        category_id?: number;
        status?: string;
        user_id?: number;
        date_from?: string;
        date_to?: string;
      }
    >({
      query: ({
        page,
        paginate,
        category_id,
        status,
        user_id,
        date_from,
        date_to,
      }) => ({
        url: `/simpanan`,
        method: "GET",
        params: {
          page,
          paginate,
          with: "user,pinjaman_category", // Request relations
          ...(category_id && { category_id }),
          ...(status && { status }),
          ...(user_id && { user_id }),
          ...(date_from && { date_from }),
          ...(date_to && { date_to }),
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

    // 🔍 Get Simpanan by ID
    getSimpananById: builder.query<Simpanan, number>({
      query: (id) => ({
        url: `/simpanan/${id}`,
        method: "GET",
        params: {
          with: "user,pinjaman_category", // Request relations
        },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Simpanan;
      }) => response.data,
    }),

    // ➕ Create Simpanan
    createSimpanan: builder.mutation<Simpanan, CreateSimpananRequest>({
      query: (payload) => ({
        url: `/simpanan`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Simpanan;
      }) => response.data,
    }),

    createSimpananSetoran: builder.mutation<Simpanan, CreateSimpananRequest>({
      query: (payload) => ({
        url: `/simpanan`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Simpanan;
      }) => response.data,
    }),

    // ✏️ Update Simpanan by ID
    updateSimpanan: builder.mutation<
      Simpanan,
      { id: number; payload: UpdateSimpananRequest }
    >({
      query: ({ id, payload }) => ({
        url: `/simpanan/${id}?_method=PUT`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Simpanan;
      }) => response.data,
    }),

    // ❌ Delete Simpanan by ID
    deleteSimpanan: builder.mutation<{ code: number; message: string }, number>(
      {
        query: (id) => ({
          url: `/simpanan/${id}`,
          method: "DELETE",
        }),
        transformResponse: (response: {
          code: number;
          message: string;
          data: null;
        }) => response,
      }
    ),

    // 🔄 Update Status Simpanan
    updateSimpananStatus: builder.mutation<
      Simpanan,
      { id: number; status: number }
    >({
      query: ({ id, status }) => ({
        url: `/simpanan/${id}/validate`,
        method: "PUT",
        body: { status },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Simpanan;
      }) => response.data,
    }),

    // 💰 Payment History Endpoints
    // 🔍 Get All Payment History
    getPaymentHistoryList: builder.query<
      {
        data: PaymentHistory[];
        last_page: number;
        current_page: number;
        total: number;
        per_page: number;
      },
      {
        page: number;
        paginate: number;
        pinjaman_id?: number;
      }
    >({
      query: ({ page, paginate, pinjaman_id }) => ({
        url: `/pinjaman/payment`,
        method: "GET",
        params: {
          page,
          paginate,
          ...(pinjaman_id && { pinjaman_id }),
        },
      }),
      transformResponse: (response: PaymentHistoryResponse) => ({
        data: response.data.data,
        last_page: response.data.last_page,
        current_page: response.data.current_page,
        total: response.data.total,
        per_page: response.data.per_page,
      }),
    }),

    // 🔍 Get Payment History by ID
    getPaymentHistoryById: builder.query<PaymentHistory, number>({
      query: (id) => ({
        url: `/pinjaman/payment/${id}`,
        method: "GET",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: PaymentHistory;
      }) => response.data,
    }),

    // ➕ Create Payment History
    createPaymentHistory: builder.mutation<PaymentHistory, FormData>({
      query: (payload) => ({
        url: `/pinjaman/payment`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: PaymentHistory;
      }) => response.data,
    }),

    // ✏️ Update Payment History by ID
    updatePaymentHistory: builder.mutation<
      PaymentHistory,
      { id: number; payload: FormData }
    >({
      query: ({ id, payload }) => ({
        url: `/pinjaman/payment/${id}?_method=PUT`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: PaymentHistory;
      }) => response.data,
    }),

    // ❌ Delete Payment History by ID
    deletePaymentHistory: builder.mutation<
      { code: number; message: string },
      number
    >({
      query: (id) => ({
        url: `/pinjaman/payment/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: null;
      }) => response,
    }),

    // 🔄 Update Payment Status
    updatePaymentStatus: builder.mutation<
      PaymentHistory,
      { id: number; status: string }
    >({
      query: ({ id, status }) => ({
        url: `/pinjaman/payment/${id}/validate`,
        method: "PUT",
        body: { status },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: PaymentHistory;
      }) => response.data,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSimpananListQuery,
  useGetSimpananByIdQuery,
  useCreateSimpananMutation,
  useCreateSimpananSetoranMutation,
  useUpdateSimpananMutation,
  useDeleteSimpananMutation,
  useUpdateSimpananStatusMutation,
  useGetPaymentHistoryListQuery,
  useGetPaymentHistoryByIdQuery,
  useCreatePaymentHistoryMutation,
  useUpdatePaymentHistoryMutation,
  useDeletePaymentHistoryMutation,
  useUpdatePaymentStatusMutation,
} = simpananApi;
