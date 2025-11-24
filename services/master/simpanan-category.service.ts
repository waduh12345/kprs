import { apiSlice } from "../base-query";
import {
  SimpananCategory,
  SimpananCategoryResponse,
  CreateSimpananCategoryRequest,
  UpdateSimpananCategoryRequest,
} from "@/types/master/simpanan-category";

export const simpananCategoryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 🔍 Get All Simpanan Categories (with pagination)
    getSimpananCategoryList: builder.query<
      {
        data: SimpananCategory[];
        last_page: number;
        current_page: number;
        total: number;
        per_page: number;
      },
      { page: number; paginate: number; orderBy?: string; order?: "asc" | "desc" }
    >({
      query: ({ page, paginate, orderBy, order }) => ({
        url: `/master/simpanan-categories`,
        method: "GET",
        params: {
          page,
          paginate,
          orderBy,
          order,
        },
      }),
      transformResponse: (response: SimpananCategoryResponse) => ({
        data: response.data.data,
        last_page: response.data.last_page,
        current_page: response.data.current_page,
        total: response.data.total,
        per_page: response.data.per_page,
      }),
    }),

    // 🔍 Get Simpanan Category by ID
    getSimpananCategoryById: builder.query<SimpananCategory, number>({
      query: (id) => ({
        url: `/master/simpanan-categories/${id}`,
        method: "GET",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: SimpananCategory;
      }) => response.data,
    }),

    // ➕ Create Simpanan Category
    createSimpananCategory: builder.mutation<
      SimpananCategory,
      CreateSimpananCategoryRequest
    >({
      query: (payload) => ({
        url: `/master/simpanan-categories`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: SimpananCategory;
      }) => response.data,
    }),

    // ✏️ Update Simpanan Category by ID
    updateSimpananCategory: builder.mutation<
      SimpananCategory,
      { id: number; payload: UpdateSimpananCategoryRequest }
    >({
      query: ({ id, payload }) => ({
        url: `/master/simpanan-categories/${id}`,
        method: "PUT",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: SimpananCategory;
      }) => response.data,
    }),

    // ❌ Delete Simpanan Category by ID
    deleteSimpananCategory: builder.mutation<
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
  useGetSimpananCategoryListQuery,
  useGetSimpananCategoryByIdQuery,
  useCreateSimpananCategoryMutation,
  useUpdateSimpananCategoryMutation,
  useDeleteSimpananCategoryMutation,
} = simpananCategoryApi;
