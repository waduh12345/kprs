import { apiSlice } from "@/services/base-query";
import { KategoriAsset } from "@/types/admin/modul/assset/kategori";

export const assetCategoryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ✅ Get All Asset Categories (with optional pagination)
    getAssetCategoryList: builder.query<
      {
        data: KategoriAsset[];
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
        return `/asset/master/categories?page=${page}&paginate=${paginate}`;
      },
      providesTags: ["AssetCategory"], // Menambahkan tag agar auto-refresh saat create/update/delete
      transformResponse: (response: {
        code: number;
        message: string;
        data: {
          current_page: number;
          data: KategoriAsset[];
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

    // ✅ Get Asset Category by ID
    getAssetCategoryById: builder.query<KategoriAsset, number>({
      query: (id) => `/asset/master/categories/${id}`,
      transformResponse: (response: {
        code: number;
        message: string;
        data: KategoriAsset;
      }) => response.data,
    }),

    // ✅ Create Asset Category
    createAssetCategory: builder.mutation<
      KategoriAsset,
      Partial<Omit<KategoriAsset, "id" | "created_at" | "updated_at">>
    >({
      query: (payload) => ({
        url: `/asset/master/categories`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["AssetCategory"], // Refresh list setelah create
      transformResponse: (response: {
        code: number;
        message: string;
        data: KategoriAsset;
      }) => response.data,
    }),

    // ✅ Update Asset Category
    updateAssetCategory: builder.mutation<
      KategoriAsset,
      {
        id: number;
        payload: Partial<
          Omit<KategoriAsset, "id" | "created_at" | "updated_at">
        >;
      }
    >({
      query: ({ id, payload }) => ({
        url: `/asset/master/categories/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["AssetCategory"], // Refresh list setelah update
      transformResponse: (response: {
        code: number;
        message: string;
        data: KategoriAsset;
      }) => response.data,
    }),

    // ✅ Delete Asset Category
    deleteAssetCategory: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/asset/master/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AssetCategory"], // Refresh list setelah delete
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
  useGetAssetCategoryListQuery,
  useGetAssetCategoryByIdQuery,
  useCreateAssetCategoryMutation,
  useUpdateAssetCategoryMutation,
  useDeleteAssetCategoryMutation,
} = assetCategoryApi;