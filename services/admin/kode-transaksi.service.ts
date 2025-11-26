import { apiSlice } from "../base-query";

/** ==== Shared Envelope, Paging, Helpers ==== */
interface ApiEnvelope<T> {
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

export interface COA {
  id: number;
  coa_id: number | null;
  code: string;
  name: string;
  description: string;
  level: number;
  type: string;
  created_at: string;
  updated_at: string;
  parent_name: string | null;
  parent_code: string | null;
  parent_level: number | null;
}

export interface JournalTemplateLine {
  id: number;
  journal_template_id: number;
  coa_id: number;
  order: number;
  type: "debit" | "credit";
  created_at: string;
  updated_at: string;
  coa: {
    id: number;
    coa_id: number;
    code: string;
    name: string;
    description: string;
    level: number;
    type: string;
    created_at: string;
    updated_at: string;
  };
}

export interface KodeTransaksi {
  id: number;
  module: string;
  description: string;
  code: string;
  status: number;
  created_at: string;
  updated_at: string;
  debits?: JournalTemplateLine[];
  credits?: JournalTemplateLine[];
}

export interface CreateKodeTransaksiRequest {
  code: string;
  module: string;
  description: string;
  status: number;
  debits: Array<{ coa_id: number; order: number }>;
  credits: Array<{ coa_id: number; order: number }>;
}
export type UpdateKodeTransaksiRequest = CreateKodeTransaksiRequest;

/** ==== Service ==== */
export const kodeTransaksiService = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getKodeTransaksiList: builder.query<
      Paginated<KodeTransaksi>,
      {
        page: number;
        paginate: number;
        orderBy?: string;
        order?: "asc" | "desc";
      }
    >({
      query: ({ page, paginate, orderBy = "updated_at", order = "desc" }) => ({
        url: `/accounting/journal-templates`,
        method: "GET",
        params: { page, paginate, orderBy, order },
      }),
      transformResponse: (response: ApiEnvelope<Paginated<KodeTransaksi>>) =>
        response.data,
      providesTags: ["KodeTransaksi"],
    }),

    getKodeTransaksiById: builder.query<KodeTransaksi, number>({
      query: (id) => `/accounting/journal-templates/${id}`,
      transformResponse: (response: ApiEnvelope<KodeTransaksi>) =>
        response.data,
      providesTags: (_r, _e, id) => [{ type: "KodeTransaksi" as const, id }],
    }),

    createKodeTransaksi: builder.mutation<
      KodeTransaksi,
      CreateKodeTransaksiRequest
    >({
      query: (data) => ({
        url: `/accounting/journal-templates`,
        method: "POST",
        body: data,
      }),
      transformResponse: (response: ApiEnvelope<KodeTransaksi>) =>
        response.data,
      invalidatesTags: ["KodeTransaksi"],
    }),

    updateKodeTransaksi: builder.mutation<
      KodeTransaksi,
      { id: number; data: UpdateKodeTransaksiRequest }
    >({
      query: ({ id, data }) => ({
        url: `/accounting/journal-templates/${id}`,
        method: "PUT",
        body: data,
      }),
      transformResponse: (response: ApiEnvelope<KodeTransaksi>) =>
        response.data,
      invalidatesTags: (_r, _e, arg) => [
        { type: "KodeTransaksi" as const, id: arg.id },
        "KodeTransaksi",
      ],
    }),

    deleteKodeTransaksi: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/accounting/journal-templates/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiEnvelope<{ success: boolean }>) =>
        response.data,
      invalidatesTags: ["KodeTransaksi"],
    }),

    getCOAList: builder.query<
      Paginated<COA>,
      { page: number; paginate: number; orderBy?: string; order?: "asc" | "desc" }
    >({
      query: ({ page, paginate, orderBy, order }) => ({
        url: `/master/coas`,
        method: "GET",
        params: { page, paginate, orderBy, order },
      }),
      transformResponse: (response: ApiEnvelope<Paginated<COA>>) =>
        response.data,
      providesTags: ["COA"],
    }),
  }),
});

export const {
  useGetKodeTransaksiListQuery,
  useGetKodeTransaksiByIdQuery,
  useCreateKodeTransaksiMutation,
  useUpdateKodeTransaksiMutation,
  useDeleteKodeTransaksiMutation,
  useGetCOAListQuery,
} = kodeTransaksiService;