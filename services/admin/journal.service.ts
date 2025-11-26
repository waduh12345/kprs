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

export interface COAListResponse {
  current_page: number;
  data: COA[];
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

/** Params type for fetching journal list */
export interface GetJournalListParams {
  page: number;
  paginate: number;
  orderBy?: string;
  order?: "asc" | "desc" | string;
  from_date?: string; 
  to_date?: string;   
  searchBySpecific?: string; 
  search?: string; 
}

export const journalService = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getJournalList: builder.query<JournalListResponse, GetJournalListParams>({
      query: ({
        page,
        paginate,
        orderBy = "updated_at",
        order = "desc",
        searchBySpecific = "",
        search = "",
        from_date = "",
        to_date = "",
      }) => {
        const params: Record<string, any> = {
          page,
          paginate,
          orderBy,
          order,
          searchBySpecific,
          search,
        };
        if (from_date) params.from_date = from_date;
        if (to_date) params.to_date = to_date;

        return {
          url: `/accounting/journals`,
          method: "GET",
          params,
        };
      },
      transformResponse: (response: {
        code: number;
        message: string;
        data: JournalListResponse;
      }) => response.data,
      providesTags: ["Journal"],
    }),

    getJournalById: builder.query<Journal, number>({
      query: (id) => `/accounting/journals/${id}`,
      transformResponse: (response: {
        code: number;
        message: string;
        data: Journal;
      }) => response.data,
      providesTags: ["Journal"],
    }),

    createJournal: builder.mutation<Journal, CreateJournalRequest>({
      query: (data) => ({
        url: `/accounting/journals`,
        method: "POST",
        body: data,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Journal;
      }) => response.data,
      invalidatesTags: ["Journal"],
    }),

    updateJournal: builder.mutation<
      Journal,
      { id: number; data: UpdateJournalRequest }
    >({
      query: ({ id, data }) => ({
        url: `/accounting/journals/${id}`,
        method: "PUT",
        body: data,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Journal;
      }) => response.data,
      invalidatesTags: ["Journal"],
    }),

    deleteJournal: builder.mutation<void, number>({
      query: (id) => ({
        url: `/accounting/journals/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Journal"],
    }),

    getCOAList: builder.query<
      COAListResponse,
      { page: number; paginate: number; orderBy?: string; order?: "asc" | "desc" }
    >({
      query: ({ page, paginate, orderBy, order }) => ({
        url: `/master/coas`,
        method: "GET",
        params: {
          page,
          paginate,
          orderBy,
          order,
        },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: COAListResponse;
      }) => response.data,
      providesTags: ["COA"],
    }),
  }),
});

// ⬇️ Tambahkan useLazyGetJournalListQuery di sini
export const {
  useGetJournalListQuery,
  useLazyGetJournalListQuery, // <--- INI YANG DITAMBAHKAN
  useGetJournalByIdQuery,
  useCreateJournalMutation,
  useUpdateJournalMutation,
  useDeleteJournalMutation,
  useGetCOAListQuery,
} = journalService;