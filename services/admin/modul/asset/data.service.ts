import { apiSlice } from "@/services/base-query"
import { DataAsset } from "@/types/admin/modul/assset/data";

export const dataAssetApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ✅ Get All Assets (with optional pagination)
    getAssetDataList: builder.query<
      {
        data: DataAsset[];
        total: number;
        pageTotal: number;
        currentPage: number;
      },
      { page?: number; paginate?: number } | void
    >({
      query: (params) => {
        // Default ke page 1 dan paginate 10 jika tidak ada params
        const page = params?.page || 1;
        const paginate = params?.paginate || 10;
        return `/asset/assets?page=${page}&paginate=${paginate}`;
      },
      transformResponse: (response: {
        code: number;
        message: string;
        data: {
          current_page: number;
          data: DataAsset[];
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

    // ✅ Get Asset by ID
    getAssetDataById: builder.query<DataAsset, number>({
      query: (id) => `/asset/assets/${id}`,
      transformResponse: (response: {
        code: number;
        message: string;
        data: DataAsset;
      }) => response.data,
    }),

    // ✅ Create Asset
    // Kita Omit field yang auto-generated atau field relasi (string name/code) yang tidak dikirim saat input
    createAssetData: builder.mutation<
      DataAsset,
      Partial<
        Omit<
          DataAsset,
          | "id"
          | "created_at"
          | "updated_at"
          | "pic_name"
          | "asset_category_code"
          | "asset_category_name"
          | "asset_location_code"
          | "asset_location_name"
          | "depreciation_total"
          | "current_value"
        >
      >
    >({
      query: (payload) => ({
        url: `/asset/assets`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: DataAsset;
      }) => response.data,
    }),

    // ✅ Update Asset
    updateAssetData: builder.mutation<
      DataAsset,
      {
        id: number;
        payload: Partial<
          Omit<
            DataAsset,
            | "id"
            | "created_at"
            | "updated_at"
            | "pic_name"
            | "asset_category_code"
            | "asset_category_name"
            | "asset_location_code"
            | "asset_location_name"
            | "depreciation_total"
            | "current_value"
          >
        >;
      }
    >({
      query: ({ id, payload }) => ({
        url: `/asset/assets/${id}`,
        method: "PUT",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: DataAsset;
      }) => response.data,
    }),

    // ✅ Delete Asset
    deleteAssetData: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/asset/assets/${id}`,
        method: "DELETE",
      }),
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
  useGetAssetDataListQuery,
  useGetAssetDataByIdQuery,
  useCreateAssetDataMutation,
  useUpdateAssetDataMutation,
  useDeleteAssetDataMutation,
} = dataAssetApi;