import { apiSlice } from "@/services/base-query";

// Interface sesuai request
export interface AssetDepresiasi {
  id: number;
  asset_category_id: number;
  asset_location_id: number;
  pic_id: number;
  code: string;
  name: string;
  description: string;
  acquired_at: string;
  acquired_value: number;
  depreciation_method: string;
  useful_life_years: number;
  salvage_value: number;
  depreciation_total: number;
  current_value: number;
  condition: string;
  status: boolean | number;
  created_at: string;
  updated_at: string;
  pic_name: string;
  asset_category_code: string;
  asset_category_name: string;
  asset_location_code: string;
  asset_location_name: string;
}

export const assetDepreciationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ✅ Get All Asset Depreciations (with optional pagination & asset_id filter)
    getAssetDepreciationList: builder.query<
      {
        data: AssetDepresiasi[];
        total: number;
        pageTotal: number;
        currentPage: number;
      },
      { page?: number; paginate?: number; asset_id?: number } | void
    >({
      query: (params) => {
        // Default values
        const page = params?.page || 1;
        const paginate = params?.paginate || 10;

        // Base URL
        let url = `/asset/depreciations?page=${page}&paginate=${paginate}`;

        // Append asset_id filter if exists
        if (params?.asset_id) {
          url += `&asset_id=${params.asset_id}`;
        }

        return url;
      },
      providesTags: ["AssetDepreciation"], // Tag agar bisa di-invalidate jika perlu
      transformResponse: (response: {
        code: number;
        message: string;
        data: {
          current_page: number;
          data: AssetDepresiasi[];
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

    // ✅ Get Asset Depreciation by ID
    getAssetDepreciationById: builder.query<AssetDepresiasi, number>({
      query: (id) => `/asset/depreciations/${id}`,
      transformResponse: (response: {
        code: number;
        message: string;
        data: AssetDepresiasi;
      }) => response.data,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAssetDepreciationListQuery,
  useGetAssetDepreciationByIdQuery,
} = assetDepreciationApi;