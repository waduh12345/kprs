import { apiSlice } from "@/services/base-query";
import { Rule } from "@/types/admin/modul/scoring/rule";

export const scoringRuleApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ✅ Get All Rules (with optional pagination)
    getRuleList: builder.query<
      {
        data: Rule[];
        total: number;
        pageTotal: number;
        currentPage: number;
      },
      { page?: number; paginate?: number } | void
    >({
      query: (params) => {
        const page = params?.page || 1;
        const paginate = params?.paginate || 10;
        return `/scoring/rules?page=${page}&paginate=${paginate}`;
      },
      providesTags: ["ScoringRule"], // Tag untuk auto-refresh
      transformResponse: (response: {
        code: number;
        message: string;
        data: {
          current_page: number;
          data: Rule[];
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

    // ✅ Get Rule by ID
    getRuleById: builder.query<Rule, number>({
      query: (id) => `/scoring/rules/${id}`,
      transformResponse: (response: {
        code: number;
        message: string;
        data: Rule;
      }) => response.data,
    }),

    // ✅ Create Rule
    // Omit field read-only dan field relasi (category/parameter name)
    createRule: builder.mutation<
      Rule,
      Partial<
        Omit<
          Rule,
          | "id"
          | "created_at"
          | "updated_at"
          | "scoring_category"
          | "scoring_parameter"
        >
      >
    >({
      query: (payload) => ({
        url: `/scoring/rules`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["ScoringRule"], // Refresh list setelah create
      transformResponse: (response: {
        code: number;
        message: string;
        data: Rule;
      }) => response.data,
    }),

    // ✅ Update Rule
    updateRule: builder.mutation<
      Rule,
      {
        id: number;
        payload: Partial<
          Omit<
            Rule,
            | "id"
            | "created_at"
            | "updated_at"
            | "scoring_category"
            | "scoring_parameter"
          >
        >;
      }
    >({
      query: ({ id, payload }) => ({
        url: `/scoring/rules/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["ScoringRule"], // Refresh list setelah update
      transformResponse: (response: {
        code: number;
        message: string;
        data: Rule;
      }) => response.data,
    }),

    // ✅ Delete Rule
    deleteRule: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/scoring/rules/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ScoringRule"], // Refresh list setelah delete
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
  useGetRuleListQuery,
  useGetRuleByIdQuery,
  useCreateRuleMutation,
  useUpdateRuleMutation,
  useDeleteRuleMutation,
} = scoringRuleApi;