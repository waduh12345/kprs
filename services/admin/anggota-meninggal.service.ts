import { apiSlice } from "../base-query";
import type {
  MeninggalCreatePayload,
  MeninggalDetail,
  MeninggalItem,
  MeninggalListParams,
  MeninggalUpdatePayload,
  MeninggalValidatePayload,
  MeninggalValidateStatus,
} from "@/types/admin/anggota-meninggal";

export const meninggalApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /anggota/meninggals – list dengan filter & pagination
    getMeninggalList: builder.query<
      {
        data: MeninggalItem[];
        last_page: number;
        current_page: number;
        total: number;
        per_page: number;
      },
      MeninggalListParams
    >({
      query: (params) => {
        const {
          page = 1,
          paginate = 10,
          search,
          status,
          orderBy,
          order,
          searchBySpecific,
        } = params;
        return {
          url: `/anggota/meninggals`,
          method: "GET",
          params: {
            page,
            paginate,
            ...(search != null && search.trim() !== ""
              ? { search: search.trim() }
              : {}),
            ...(status !== undefined ? { status } : {}),
            ...(orderBy != null ? { orderBy } : {}),
            ...(order != null ? { order } : {}),
            ...(searchBySpecific != null ? { searchBySpecific } : {}),
          },
        };
      },
      transformResponse: (response: {
        code: number;
        message: string;
        data: {
          current_page: number;
          data: MeninggalItem[];
          last_page: number;
          total: number;
          per_page: number;
        };
      }) => ({
        data: response.data.data,
        last_page: response.data.last_page,
        current_page: response.data.current_page,
        total: response.data.total,
        per_page: response.data.per_page,
      }),
    }),

    // GET /anggota/meninggals/:id – detail (dengan media, anggota)
    getMeninggalById: builder.query<MeninggalDetail, number>({
      query: (id) => ({
        url: `/anggota/meninggals/${id}`,
        method: "GET",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: MeninggalDetail;
      }) => response.data,
    }),

    // POST /anggota/meninggals – pengajuan meninggal (status opsional, default Pending)
    createMeninggal: builder.mutation<MeninggalDetail, MeninggalCreatePayload>({
      query: (payload) => ({
        url: `/anggota/meninggals`,
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: MeninggalDetail;
      }) => response.data,
    }),

    // PUT /anggota/meninggals/:id – update
    updateMeninggal: builder.mutation<
      MeninggalDetail,
      { id: number; payload: MeninggalUpdatePayload }
    >({
      query: ({ id, payload }) => ({
        url: `/anggota/meninggals/${id}`,
        method: "PUT",
        body: payload,
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: MeninggalDetail;
      }) => response.data,
    }),

    // PUT /anggota/meninggals/:id/validate – approve (1) atau reject (2)
    validateMeninggalStatus: builder.mutation<
      MeninggalDetail,
      { id: number; status: MeninggalValidateStatus }
    >({
      query: ({ id, status }) => ({
        url: `/anggota/meninggals/${id}/validate`,
        method: "PUT",
        body: { status } as MeninggalValidatePayload,
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: MeninggalDetail;
      }) => response.data,
    }),

    // DELETE /anggota/meninggals/:id
    deleteMeninggal: builder.mutation<{ code: number; message: string }, number>(
      {
        query: (id) => ({
          url: `/anggota/meninggals/${id}`,
          method: "DELETE",
        }),
        transformResponse: (response: {
          code: number;
          message: string;
          data?: null;
        }) => ({ code: response.code, message: response.message }),
      }
    ),
  }),
  overrideExisting: false,
});

export const {
  useGetMeninggalListQuery,
  useGetMeninggalByIdQuery,
  useCreateMeninggalMutation,
  useUpdateMeninggalMutation,
  useValidateMeninggalStatusMutation,
  useDeleteMeninggalMutation,
} = meninggalApi;
