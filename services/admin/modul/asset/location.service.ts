import { apiSlice } from "@/services/base-query";
import { Location } from "@/types/admin/modul/assset/location";

export const assetLocationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ✅ Get All Locations (with optional pagination)
    getLocationList: builder.query<
      {
        data: Location[];
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
        return `/asset/master/locations?page=${page}&paginate=${paginate}`;
      },
      providesTags: ["AssetLocation"], // Tag untuk auto-refresh
      transformResponse: (response: {
        code: number;
        message: string;
        data: {
          current_page: number;
          data: Location[];
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

    // ✅ Get Location by ID
    getLocationById: builder.query<Location, number>({
      query: (id) => `/asset/master/locations/${id}`,
      transformResponse: (response: {
        code: number;
        message: string;
        data: Location;
      }) => response.data,
    }),

    // ✅ Create Location
    // Omit id, dates, dan pic_name (biasanya pic_name dari join backend, yg dikirim pic_id)
    createLocation: builder.mutation<
      Location,
      Partial<Omit<Location, "id" | "created_at" | "updated_at" | "pic_name">>
    >({
      query: (payload) => ({
        url: `/asset/master/locations`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["AssetLocation"], // Refresh list setelah create
      transformResponse: (response: {
        code: number;
        message: string;
        data: Location;
      }) => response.data,
    }),

    // ✅ Update Location
    updateLocation: builder.mutation<
      Location,
      {
        id: number;
        payload: Partial<
          Omit<Location, "id" | "created_at" | "updated_at" | "pic_name">
        >;
      }
    >({
      query: ({ id, payload }) => ({
        url: `/asset/master/locations/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["AssetLocation"], // Refresh list setelah update
      transformResponse: (response: {
        code: number;
        message: string;
        data: Location;
      }) => response.data,
    }),

    // ✅ Delete Location
    deleteLocation: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/asset/master/locations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AssetLocation"], // Refresh list setelah delete
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
  useGetLocationListQuery,
  useGetLocationByIdQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
} = assetLocationApi;