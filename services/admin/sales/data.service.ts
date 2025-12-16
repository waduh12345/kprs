import { apiSlice } from "../../base-query";
import {
  Data,
  DataResponse,
  CreateDataRequest,
  UpdateDataRequest,
} from "@/types/admin/sales/data";

export const kategoriApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 🔍 Get All Data (with pagination)
    getDataList: builder.query<
      {
        data: Data[];
        last_page: number;
        current_page: number;
        total: number;
        per_page: number;
      },
      { page: number; paginate: number; orderBy?: string; order?: "asc" | "desc" }
    >({
      query: ({ page, paginate, orderBy, order }) => ({
        url: `/sales/sales`,
        method: "GET",
        params: {
          page,
          paginate,
          orderBy,
          order,
        },
      }),
      transformResponse: (response: DataResponse) => ({
        data: response.data.data,
        last_page: response.data.last_page,
        current_page: response.data.current_page,
        total: response.data.total,
        per_page: response.data.per_page,
      }),
    }),

    // 🔍 Get Simpanan Category by ID
    getDataById: builder.query<Data, number>({
      query: (id) => ({
        url: `/sales/sales/${id}`,
        method: "GET",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Data;
      }) => response.data,
    }),

    // ➕ Create Simpanan Category
    createData: builder.mutation<
      Data,
      CreateDataRequest
    >({
      query: (payload) => ({
        url: `/sales/sales`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Data;
      }) => response.data,
    }),

    // ✏️ Update Simpanan Category by ID
    updateData: builder.mutation<
      Data,
      { id: number; payload: UpdateDataRequest }
    >({
      query: ({ id, payload }) => ({
        url: `/sales/sales/${id}`,
        method: "PUT",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Data;
      }) => response.data,
    }),

    // ❌ Delete Simpanan Category by ID
    deleteData: builder.mutation<
      { code: number; message: string },
      number
    >({
      query: (id) => ({
        url: `/sales/sales/${id}`,
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
  useGetDataListQuery,
  useGetDataByIdQuery,
  useCreateDataMutation,
  useUpdateDataMutation,
  useDeleteDataMutation,
} = kategoriApi;
