import { apiSlice } from "../base-query";

export interface JournalDetail {
  id: number;
  journal_id: number;
  coa_id: number;
  type: "debit" | "credit";
  debit: number;
  credit: number;
  memo: string;
  created_at: string;
  updated_at: string;
  coa?: {
    id: number;
    coa_id: number | null;
    code: string;
    name: string;
    description: string;
    level: number;
    type: string;
    created_at: string;
    updated_at: string;
  };
}

export interface JournalDetailForm {
  coa_id: number;
  type: "debit" | "credit";
  debit: number;
  credit: number;
  memo: string;
}

export interface Journal {
  id: number;
  reference: string;
  ref_number: number;
  source_type: string | null;
  source_id: number | null;
  date: string;
  description: string;
  is_posted: boolean;
  created_at: string;
  updated_at: string;
  source: string | null;
  details?: JournalDetail[];
}

export interface JournalListResponse {
  current_page: number;
  data: Journal[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{
    url: string | null;
    label: string;
    page: number | null;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface CreateJournalRequest {
  date: string;
  description: string;
  is_posted: number;
  details: JournalDetailForm[];
}

export interface UpdateJournalRequest {
  date?: string;
  description?: string;
  is_posted?: number;
  details?: JournalDetailForm[];
}

export interface GetJournalEliminasiListParams {
  page: number;
  paginate: number;
  orderBy?: string;
  order?: "asc" | "desc" | string;
  searchBySpecific?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
  is_posted?: number | string;
}

export const journalEliminasiService = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getJournalEliminasiList: builder.query<
      JournalListResponse,
      GetJournalEliminasiListParams
    >({
      query: ({
        page,
        paginate,
        orderBy = "updated_at",
        order = "desc",
        searchBySpecific,
        search,
        from_date,
        to_date,
        is_posted,
      }) => ({
        url: `/accounting/journal-eliminasis`,
        method: "GET",
        params: {
          page,
          paginate,
          orderBy,
          order,
          ...(searchBySpecific ? { searchBySpecific } : {}),
          ...(search ? { search } : {}),
          ...(from_date ? { from_date } : {}),
          ...(to_date ? { to_date } : {}),
          ...(is_posted !== undefined ? { is_posted } : {}),
        },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: JournalListResponse;
      }) => response.data,
      providesTags: ["JournalEliminasi"],
    }),

    getJournalEliminasiById: builder.query<Journal, number>({
      query: (id) => `/accounting/journal-eliminasis/${id}`,
      transformResponse: (response: {
        code: number;
        message: string;
        data: Journal;
      }) => response.data,
      providesTags: (result, error, id) => [
        { type: "JournalEliminasi" as const, id },
      ],
    }),

    createJournalEliminasi: builder.mutation<Journal, CreateJournalRequest>({
      query: (data) => ({
        url: `/accounting/journal-eliminasis`,
        method: "POST",
        body: data,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Journal;
      }) => response.data,
      invalidatesTags: ["JournalEliminasi"],
    }),

    updateJournalEliminasi: builder.mutation<
      Journal,
      { id: number; data: UpdateJournalRequest }
    >({
      query: ({ id, data }) => ({
        url: `/accounting/journal-eliminasis/${id}`,
        method: "PUT",
        body: data,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Journal;
      }) => response.data,
      invalidatesTags: (result, error, arg) => [
        "JournalEliminasi",
        { type: "JournalEliminasi" as const, id: arg.id },
      ],
    }),

    deleteJournalEliminasi: builder.mutation<void, number>({
      query: (id) => ({
        url: `/accounting/journal-eliminasis/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        "JournalEliminasi",
        { type: "JournalEliminasi" as const, id },
      ],
    }),
  }),
});

export const {
  useGetJournalEliminasiListQuery,
  useGetJournalEliminasiByIdQuery,
  useCreateJournalEliminasiMutation,
  useUpdateJournalEliminasiMutation,
  useDeleteJournalEliminasiMutation,
} = journalEliminasiService;