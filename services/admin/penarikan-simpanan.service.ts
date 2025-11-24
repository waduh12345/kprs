import {
  CreateSimpananRequest,
} from "@/types/admin/simpanan/input-simpanan";
import {   Balance,
  Transfer,
  InputSimpanan,
  Reference} from "@/types/admin/simpanan/input-simpanan";
import { apiSlice } from "../base-query";
import {
  PenarikanSimpanan,
  CreatePenarikanSimpananRequest,
  UpdatePenarikanSimpananRequest,
  Wallet,
} from "@/types/admin/penarikan-simpanan";

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface Paginated<T> {
  data: T[];
  last_page: number;
  current_page: number;
  total: number;
  per_page: number;
}

export interface WalletHistory {
  id: number;
  wallet_id: number;
  type: string; // contoh: 'credit' | 'debit'
  amount: number;
  description?: string | null;
  balance_before?: number | null;
  balance_after?: number | null;
  reference?: Reference | null;
  created_at: string;
  updated_at?: string | null;
}

/**
 * Jika transfer endpoint mengembalikan struktur khusus, ubah TransferResult.
 * Untuk saat ini asumsikan backend mengembalikan data transaksi (WalletHistory).
 */
type TransferResult = WalletHistory;

const penarikanSimpananApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 🔍 Get All Penarikan Simpanan (with pagination)
    getPenarikanSimpananList: builder.query<
      Paginated<PenarikanSimpanan>,
      { page: number; paginate: number }
    >({
      query: ({ page, paginate }) => ({
        url: `/wallet/withdrawals`,
        method: "GET",
        params: {
          page,
          paginate,
        },
      }),
      transformResponse: (
        response: ApiResponse<Paginated<PenarikanSimpanan>>
      ) => response.data,
    }),

    // ➕ Create Penarikan Simpanan
    createPenarikanSimpananWallet: builder.mutation<
      PenarikanSimpanan,
      CreatePenarikanSimpananRequest
    >({
      query: (payload) => ({
        url: `/wallet/withdrawals`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: ApiResponse<PenarikanSimpanan>) =>
        response.data,
    }),

    // ✏️ Update Penarikan Simpanan by ID
    updatePenarikanSimpanan: builder.mutation<
      PenarikanSimpanan,
      { id: number; payload: UpdatePenarikanSimpananRequest }
    >({
      query: ({ id, payload }) => ({
        url: `/wallet/withdrawals/${id}`,
        method: "PUT",
        body: payload,
      }),
      transformResponse: (response: ApiResponse<PenarikanSimpanan>) =>
        response.data,
    }),

    // ❌ Delete Penarikan Simpanan by ID
    deletePenarikanSimpanan: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({
        url: `/wallet/withdrawals/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiResponse<null>) => response,
    }),

    // 🔄 Update Status Penarikan
    updatePenarikanStatus: builder.mutation<
      PenarikanSimpanan,
      { id: number; status: string }
    >({
      query: ({ id, status }) => ({
        url: `/wallet/withdrawals/${id}/status`,
        method: "PUT",
        body: { status },
      }),
      transformResponse: (response: ApiResponse<PenarikanSimpanan>) =>
        response.data,
    }),

    // ===========================
    // Wallet endpoints (added)
    // ===========================

    // 🔍 Get Wallet List
    getWalletList: builder.query<
      Paginated<Wallet>,
      {
        page: number;
        paginate: number;
        user_id?: number;
        searchBySpecific?: string;
        search?: string;
      }
    >({
      query: ({
        page,
        paginate,
        user_id,
        searchBySpecific,
        search,
      }) => ({
        url: `/wallet`,
        method: "GET",
        params: {
          page,
          paginate,
          user_id,
          searchBySpecific,
          ...(search ? { search } : {}),
        },
      }),
      transformResponse: (response: ApiResponse<Paginated<Wallet>>) =>
        response.data,
    }),

    // ➕ Create Simpanan (Input)
    createSimpanan: builder.mutation<Wallet, CreateSimpananRequest>({
      query: (payload) => ({
        url: `/wallet/withdrawals`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: ApiResponse<Wallet>) => response.data,
    }),

    // ➕ Create Simpanan (Input)
    createSimpananWallet: builder.mutation<Wallet, CreateSimpananRequest>({
      query: (payload) => ({
        url: `/wallet`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: ApiResponse<Wallet>) => response.data,
    }),

    // 🔎 Get Wallet By ID
    getWalletById: builder.query<Wallet, number>({
      query: (id) => ({
        url: `/wallet/${id}`,
        method: "GET",
      }),
      transformResponse: (response: ApiResponse<Wallet>) => response.data,
    }),

    // ✏️ Update Wallet by ID
    updateWallet: builder.mutation<
      Wallet,
      { id: number; payload: Partial<InputSimpanan> }
    >({
      query: ({ id, payload }) => ({
        url: `/wallet/${id}`,
        method: "PUT",
        body: payload,
      }),
      transformResponse: (response: ApiResponse<Wallet>) => response.data,
    }),

    // ❌ Delete Wallet by ID
    deleteWallet: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({
        url: `/wallet/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiResponse<null>) => response,
    }),

    // 💰 Get Balance
    getWalletBalance: builder.query<Balance, { user_id?: number } | void>({
      query: (params) => ({
        url: `/wallet/balance`,
        method: "GET",
        params: params ?? undefined,
      }),
      transformResponse: (response: ApiResponse<Balance>) => response.data,
    }),

    // 📜 Get Histories (paginated)
    getWalletHistories: builder.query<
      Paginated<WalletHistory>,
      { page: number; paginate: number; wallet_id?: number; start_date?: string; end_date?: string; search?: string; type?: string }
    >({
      query: ({ page, paginate, wallet_id, start_date, end_date, search, type }) => ({
      url: `/wallet/histories`,
      method: "GET",
      params: {
        page,
        paginate,
        wallet_id,
        start_date,
        end_date,
        ...(search ? { search } : {}),
        ...(type ? { type } : {}),
      },
      }),
      transformResponse: (response: ApiResponse<Paginated<WalletHistory>>) => {
      // Map source_type based on type
      const mappedData = response.data.data.map((history) => {
        if (history.type === "debit") {
        return {
          ...history,
          source_type: "App\\Models\\Simpanan\\Simpanan",
        };
        } else if (history.type === "credit") {
        return {
          ...history,
          source_type: ["App\\Models\\Pinjaman\\Pinjaman"],
        };
        }
        return history;
      });
      return {
        ...response.data,
        data: mappedData,
      };
      },
    }),

    // 🔁 Transfer
    transferWallet: builder.mutation<ApiResponse<TransferResult>, Transfer>({
      query: (payload) => ({
        url: `/wallet/transfer`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: ApiResponse<TransferResult>) => response,
    }),
  }),
});

export const {
  useGetPenarikanSimpananListQuery,
  useCreatePenarikanSimpananWalletMutation,
  useUpdatePenarikanSimpananMutation,
  useDeletePenarikanSimpananMutation,
  useUpdatePenarikanStatusMutation,

  // wallet
  useGetWalletListQuery,
  useCreateSimpananMutation,
  useCreateSimpananWalletMutation,
  useGetWalletByIdQuery,
  useUpdateWalletMutation,
  useDeleteWalletMutation,
  useGetWalletBalanceQuery,
  useGetWalletHistoriesQuery,
  useTransferWalletMutation,
} = penarikanSimpananApi;