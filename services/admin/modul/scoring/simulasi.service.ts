import { apiSlice } from "@/services/base-query";

// --- Interfaces ---

export interface ScoringSimulation {
  // Primary Key & Timestamps
  id: number;
  created_at: string;
  updated_at: string;

  // Foreign Keys & Inputs
  user_id: number;
  pinjaman_category_id: number;

  // Data Input Simulasi
  tenor: number;
  nominal: number;
  gaji: number;

  // Data Hasil Kalkulasi
  joinning_duration: number; // Lama Keanggotaan (tahun)
  debt_to_income_ratio: number; // DTI (%)
  telat_bayar_simpanan: number; // Default 0
  status_karyawan: string;
  usia: number; // Umur saat simulasi
  score: number; // Hasil akhir skor

  // Join Data
  pinjaman_category_name?: string;
  anggota_reference?: string;
  anggota_name?: string;
}

export interface ScoringSimulationPayload {
  pinjaman_category_id: number;
  user_id: number;
  tenor: number; // integer, min:1
  nominal: number; // numeric, min:0
  gaji: number; // numeric, min:0
}

// Params bersifat opsional dengan tanda tanya (?)
export interface ScoringSimulationQueryParams {
  page?: number;
  paginate?: number;
  search?: string; // Mapped to 's' in backend
  searchBySpecific?: string;
  orderBy?: string;
  order?: "asc" | "desc";
}

// --- Service Implementation ---

export const scoringSimulationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ✅ Get All Simulations (Index)
    // URL: /scoring/simulate?paginate=10&page=1
    getScoringSimulationList: builder.query<
      {
        data: ScoringSimulation[];
        total: number;
        pageTotal: number;
        currentPage: number;
      },
      ScoringSimulationQueryParams | void // Parameter opsional (bisa void/undefined)
    >({
      query: (params) => {
        // Construct Query Params
        const queryParams = new URLSearchParams();

        // Cek jika params ada sebelum append
        if (params) {
          if (params.page) queryParams.append("page", params.page.toString());
          if (params.paginate)
            queryParams.append("paginate", params.paginate.toString());
          if (params.search) queryParams.append("s", params.search); // Backend 's'
          if (params.searchBySpecific)
            queryParams.append("searchBySpecific", params.searchBySpecific);
          if (params.orderBy) queryParams.append("orderBy", params.orderBy);
          if (params.order) queryParams.append("order", params.order);
        }

        // Return URL sesuai request
        return {
          url: `/scoring/simulate`,
          params: queryParams, // RTK Query akan otomatis menyusun ?key=value
        };
      },
      providesTags: ["ScoringSimulation"],
      transformResponse: (response: {
        code: number;
        message: string;
        data: {
          current_page: number;
          data: ScoringSimulation[];
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

    // ✅ Get Simulation by ID (Show)
    // URL: /scoring/rules/:id
    getScoringSimulationById: builder.query<ScoringSimulation, number>({
      query: (id) => `/scoring/rules/${id}`, // URL diubah sesuai request
      transformResponse: (response: {
        code: number;
        message: string;
        data: ScoringSimulation;
      }) => response.data,
    }),

    // ✅ Create Simulation (Simulate Function)
    // URL: /scoring/simulate
    createScoringSimulation: builder.mutation<
      ScoringSimulation,
      ScoringSimulationPayload
    >({
      query: (payload) => ({
        url: `/scoring/simulate`, // URL diubah sesuai request
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["ScoringSimulation"], // Refresh list setelah create
      transformResponse: (response: {
        code: number;
        message: string;
        data: ScoringSimulation;
      }) => response.data,
    }),

    // ✅ Delete Simulation (Destroy)
    // URL: /scoring/rules/:id
    deleteScoringSimulation: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/scoring/rules/${id}`, // URL diubah sesuai request
        method: "DELETE",
      }),
      invalidatesTags: ["ScoringSimulation"], // Refresh list setelah delete
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
  useGetScoringSimulationListQuery,
  useGetScoringSimulationByIdQuery,
  useCreateScoringSimulationMutation,
  useDeleteScoringSimulationMutation,
} = scoringSimulationApi;