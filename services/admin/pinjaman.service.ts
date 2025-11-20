import { apiSlice } from "../base-query";
import { 
  Pinjaman, 
  PinjamanResponse, 
  CreatePinjamanRequest, 
  UpdatePinjamanRequest,
  PaymentHistory,
  PaymentHistoryResponse,
  Pelunasan,
} from "@/types/admin/pinjaman";

export const pinjamanApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 🔍 Get All Pinjaman (with pagination and filters)
    getPinjamanList: builder.query<
      {
        data: Pinjaman[];
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
        search?: string;
        searchBySpecific?: string;
      }
    >({
      query: ({ page, paginate, category_id, status, user_id, date_from, date_to, search, searchBySpecific }) => ({
        url: `/pinjaman`,
        method: "GET",
        params: {
          page,
          paginate,
          ...(searchBySpecific && { searchBySpecific }),
          ...(search && { search }),
          with: 'user,pinjaman_category', // Request relations
          ...(category_id && { category_id }),
          ...(status && { status }),
          ...(user_id && { user_id }),
          ...(date_from && { date_from }),
          ...(date_to && { date_to }),
        },
      }),
      transformResponse: (response: PinjamanResponse) => ({
        data: response.data.data,
        last_page: response.data.last_page,
        current_page: response.data.current_page,
        total: response.data.total,
        per_page: response.data.per_page,
      }),
    }),

    // 🔍 Get Pinjaman by ID
    getPinjamanById: builder.query<Pinjaman, number>({
      query: (id) => ({
        url: `/pinjaman/${id}`,
        method: "GET",
        params: {
          with: 'user,pinjaman_category', // Request relations
        },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Pinjaman;
      }) => response.data,
    }),

    // 🔍 Get Pinjaman Details with Installments
    getPinjamanDetails: builder.query<{
      id: number;
      pinjaman_category_id: number;
      user_id: number;
      reference: string;
      ref_number: number;
      description: string;
      date: string;
      nominal: number;
      tenor: number;
      interest_rate: number;
      monthly_principal: number;
      monthly_interest: number;
      monthly_installment: number;
      status: number;
      created_at: string;
      updated_at: string;
      user: {
        id: number;
        name: string;
        phone: string;
        email: string;
        email_verified_at: string;
        created_at: string;
        updated_at: string;
      };
      category: {
        id: number;
        code: string;
        name: string;
        description: string;
        status: number;
        created_at: string;
        updated_at: string;
      };
      details: Array<{
        id: number;
        pinjaman_id: number;
        month: number;
        paid: number;
        remaining: number;
        due_date: string;
        paid_at: string | null;
        description: string;
        status: boolean;
        created_at: string;
        updated_at: string;
      }>;
    }, number>({
      query: (id) => ({
        url: `/pinjaman/${id}`,
        method: "GET",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: {
          id: number;
          pinjaman_category_id: number;
          user_id: number;
          reference: string;
          ref_number: number;
          description: string;
          date: string;
          nominal: number;
          tenor: number;
          interest_rate: number;
          monthly_principal: number;
          monthly_interest: number;
          monthly_installment: number;
          status: number;
          created_at: string;
          updated_at: string;
          user: {
            id: number;
            name: string;
            phone: string;
            email: string;
            email_verified_at: string;
            created_at: string;
            updated_at: string;
          };
          category: {
            id: number;
            code: string;
            name: string;
            description: string;
            status: number;
            created_at: string;
            updated_at: string;
          };
          details: Array<{
            id: number;
            pinjaman_id: number;
            month: number;
            paid: number;
            remaining: number;
            due_date: string;
            paid_at: string | null;
            description: string;
            status: boolean;
            created_at: string;
            updated_at: string;
          }>;
        };
      }) => response.data,
    }),

    // ➕ Create Pinjaman
    createPinjaman: builder.mutation<Pinjaman, CreatePinjamanRequest>({
      query: (payload) => ({
        url: `/pinjaman`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Pinjaman;
      }) => response.data,
    }),

    // ✏️ Update Pinjaman by ID
    updatePinjaman: builder.mutation<
      Pinjaman,
      { id: number; payload: UpdatePinjamanRequest }
    >({
      query: ({ id, payload }) => ({
        url: `/pinjaman/${id}?_method=PUT`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Pinjaman;
      }) => response.data,
    }),

    // ❌ Delete Pinjaman by ID
    deletePinjaman: builder.mutation<
      { code: number; message: string },
      number
    >({
      query: (id) => ({
        url: `/pinjaman/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: null;
      }) => response,
    }),

    // 🔄 Update Status Pinjaman
    updatePinjamanStatus: builder.mutation<
      Pinjaman,
      { id: number; status: string, realization_date?: string }
    >({
      query: ({ id, status, realization_date }) => ({
        url: `/pinjaman/${id}/validate`,
        method: "PUT",
        body: { status, realization_date },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Pinjaman;
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

    bulkSettlement: builder.mutation<Pelunasan, number[]>({
      query: (data) => ({
        url: `/pinjaman/payment/bulk-settlement`,
        method: "POST",
        body: { data },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Pelunasan;
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
  useGetPinjamanListQuery,
  useGetPinjamanByIdQuery,
  useGetPinjamanDetailsQuery,
  useCreatePinjamanMutation,
  useUpdatePinjamanMutation,
  useDeletePinjamanMutation,
  useUpdatePinjamanStatusMutation,
  useGetPaymentHistoryListQuery,
  useGetPaymentHistoryByIdQuery,
  useCreatePaymentHistoryMutation,
  useUpdatePaymentHistoryMutation,
  useDeletePaymentHistoryMutation,
  useUpdatePaymentStatusMutation,
  useBulkSettlementMutation
} = pinjamanApi;
