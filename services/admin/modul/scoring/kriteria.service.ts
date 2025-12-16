import { apiSlice } from "@/services/base-query";
import { Kriteria } from "@/types/admin/modul/scoring/kriteria";

export const scoringKriteriaApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ✅ Get All Kriteria (with optional pagination)
    getKriteriaList: builder.query<
      {
        data: Kriteria[];
        total: number;
        pageTotal: number;
        currentPage: number;
      },
      { page?: number; paginate?: number } | void
    >({
      query: (params) => {
        const page = params?.page || 1;
        const paginate = params?.paginate || 10;
        return `/scoring/criteria?page=${page}&paginate=${paginate}`;
      },
      providesTags: ["ScoringKriteria"], // Tag untuk auto-refresh
      transformResponse: (response: {
        code: number;
        message: string;
        data: {
          current_page: number;
          data: Kriteria[];
          total: number;
          last_page: number;
        };
      }) => ({
        data: response.data.data,
        total: response.data.total,
        pageTotal: response.data.last_page,
        currentPage: response.data.current_page,
      }),
    }),

    // ✅ Get Kriteria by ID
    getKriteriaById: builder.query<Kriteria, number>({
      query: (id) => `/scoring/criteria/${id}`,
      transformResponse: (response: {
        code: number;
        message: string;
        data: Kriteria;
      }) => response.data,
    }),

    // ✅ Create Kriteria
    createKriteria: builder.mutation<
      Kriteria,
      Partial<Omit<Kriteria, "id" | "created_at" | "updated_at">>
    >({
      query: (payload) => ({
        url: `/scoring/criteria`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["ScoringKriteria"], // Refresh list setelah create
      transformResponse: (response: {
        code: number;
        message: string;
        data: Kriteria;
      }) => response.data,
    }),

    // ✅ Update Kriteria
    updateKriteria: builder.mutation<
      Kriteria,
      {
        id: number;
        payload: Partial<Omit<Kriteria, "id" | "created_at" | "updated_at">>;
      }
    >({
      query: ({ id, payload }) => ({
        url: `/scoring/criteria/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["ScoringKriteria"], // Refresh list setelah update
      transformResponse: (response: {
        code: number;
        message: string;
        data: Kriteria;
      }) => response.data,
    }),

    // ✅ Delete Kriteria
    deleteKriteria: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/scoring/criteria/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ScoringKriteria"], // Refresh list setelah delete
      transformResponse: (response: {
        code: number;
        message: string;
        data: null;
      }) => ({ message: response.message }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetKriteriaListQuery,
  useGetKriteriaByIdQuery,
  useCreateKriteriaMutation,
  useUpdateKriteriaMutation,
  useDeleteKriteriaMutation,
} = scoringKriteriaApi;