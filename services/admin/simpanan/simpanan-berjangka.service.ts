import { apiSlice } from "../../base-query";
import type {
  ApiResponse,
  SimpananBerjangka,
  SimpananBerjangkaCairAwalResponse,
  SimpananBerjangkaCairNormalResponse,
  SimpananBerjangkaImportMigrasiResponse,
  SimpananBerjangkaImportSampleResponse,
  SimpananBerjangkaListParams,
  SimpananBerjangkaPaginatedResponse,
  SimpananBerjangkaStoreRequest,
  SimpananBerjangkaUpdateRequest,
  SimpananBerjangkaValidateRequest,
} from "@/types/admin/simpanan/simpanan-berjangka";

function buildStoreFormData(payload: SimpananBerjangkaStoreRequest): FormData {
  const form = new FormData();
  form.append("anggota_id", String(payload.anggota_id));
  form.append("date", payload.date);
  form.append("nominal", String(payload.nominal));
  form.append("type", payload.type);
  if (payload.description != null) form.append("description", payload.description);
  if (payload.cashback_id != null) form.append("cashback_id", String(payload.cashback_id));

  if ("master_bilyet_berjangka_id" in payload) {
    form.append("master_bilyet_berjangka_id", String(payload.master_bilyet_berjangka_id));
  } else {
    form.append("simpanan_berjangka_category_id", String(payload.simpanan_berjangka_category_id));
    form.append("term_months", String(payload.term_months));
    form.append("no_bilyet", payload.no_bilyet);
    form.append("no_ao", payload.no_ao);
  }

  if (payload.type === "automatic") {
    if (payload.payment_method) form.append("payment_method", payload.payment_method);
    if (payload.payment_channel) form.append("payment_channel", payload.payment_channel);
  }
  if (payload.type === "manual" && payload.image) {
    form.append("image", payload.image);
  }

  return form;
}

const transformPaginated = (response: ApiResponse<SimpananBerjangkaPaginatedResponse>) => ({
  data: response.data.data,
  last_page: response.data.last_page,
  current_page: response.data.current_page,
  total: response.data.total,
  per_page: response.data.per_page,
});

export const simpananBerjangkaApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSimpananBerjangkaList: builder.query<
      {
        data: SimpananBerjangka[];
        last_page: number;
        current_page: number;
        total: number;
        per_page: number;
      },
      SimpananBerjangkaListParams | void
    >({
      query: (params) => {
        const p = (params ?? {}) as Partial<SimpananBerjangkaListParams>;
        return {
          url: `/simpanan/berjangka`,
          method: "GET",
          params: {
            page: p.page ?? 1,
            paginate: p.paginate ?? 10,
            ...(p.user_id != null && { user_id: p.user_id }),
            ...(p.from_date && { from_date: p.from_date }),
            ...(p.to_date && { to_date: p.to_date }),
            ...(p.from_maturity_date && { from_maturity_date: p.from_maturity_date }),
            ...(p.to_maturity_date && { to_maturity_date: p.to_maturity_date }),
            ...(p.due_day != null && { due_day: p.due_day }),
            ...(p.status != null && {
              status: Array.isArray(p.status) ? p.status : p.status,
            }),
            ...(p.simpanan_berjangka_category_id != null && {
              simpanan_berjangka_category_id: p.simpanan_berjangka_category_id,
            }),
            ...(p.master_bilyet_berjangka_id != null && {
              master_bilyet_berjangka_id: p.master_bilyet_berjangka_id,
            }),
            ...(p.status_bilyet && { status_bilyet: p.status_bilyet }),
            ...(p.type && { type: p.type }),
            ...(p.search && { search: p.search }),
            ...(p.searchBySpecific && { searchBySpecific: p.searchBySpecific }),
            ...(p.orderBy && { orderBy: p.orderBy }),
            ...(p.order && { order: p.order }),
          },
        };
      },
      transformResponse: (response: ApiResponse<SimpananBerjangkaPaginatedResponse>) =>
        transformPaginated(response),
    }),

    getSimpananBerjangkaById: builder.query<SimpananBerjangka, number>({
      query: (id) => ({
        url: `/simpanan/berjangka/${id}`,
        method: "GET",
      }),
      transformResponse: (response: ApiResponse<SimpananBerjangka>) => response.data,
    }),

    createSimpananBerjangka: builder.mutation<SimpananBerjangka, SimpananBerjangkaStoreRequest>({
      query: (payload) => ({
        url: `/simpanan/berjangka`,
        method: "POST",
        body: buildStoreFormData(payload),
      }),
      transformResponse: (response: ApiResponse<SimpananBerjangka>) => response.data,
    }),

    updateSimpananBerjangka: builder.mutation<
      SimpananBerjangka,
      { id: number; payload: Partial<SimpananBerjangkaUpdateRequest> }
    >({
      query: ({ id, payload }) => {
        const form = new FormData();
        if (payload.description != null) form.append("description", payload.description);
        if (payload.term_months != null) form.append("term_months", String(payload.term_months));
        if (payload.status_bilyet != null) form.append("status_bilyet", payload.status_bilyet);
        if (payload.image) form.append("image", payload.image);
        return {
          url: `/simpanan/berjangka/${id}?_method=PUT`,
          method: "POST",
          body: form,
        };
      },
      transformResponse: (response: ApiResponse<SimpananBerjangka>) => response.data,
    }),

    deleteSimpananBerjangka: builder.mutation<{ code: number; message: string }, number>({
      query: (id) => ({
        url: `/simpanan/berjangka/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiResponse<unknown>) => ({
        code: response.code,
        message: response.message,
      }),
    }),

    validateSimpananBerjangka: builder.mutation<
      SimpananBerjangka,
      { id: number; payload: SimpananBerjangkaValidateRequest }
    >({
      query: ({ id, payload }) => ({
        url: `/simpanan/berjangka/${id}/validate`,
        method: "PUT",
        body: payload,
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (response: ApiResponse<SimpananBerjangka>) => response.data,
    }),

    cairNormalSimpananBerjangka: builder.mutation<SimpananBerjangkaCairNormalResponse, number>({
      query: (id) => ({
        url: `/simpanan/berjangka/${id}/cair`,
        method: "POST",
      }),
      transformResponse: (response: ApiResponse<SimpananBerjangkaCairNormalResponse>) =>
        response.data,
    }),

    cairAwalSimpananBerjangka: builder.mutation<SimpananBerjangkaCairAwalResponse, number>({
      query: (id) => ({
        url: `/simpanan/berjangka/${id}/cair-awal`,
        method: "POST",
      }),
      transformResponse: (response: ApiResponse<SimpananBerjangkaCairAwalResponse>) =>
        response.data,
    }),

    getSimpananBerjangkaImportSample: builder.query<
      SimpananBerjangkaImportSampleResponse,
      void
    >({
      query: () => ({
        url: `/simpanan/berjangka/import/sample`,
        method: "GET",
      }),
      transformResponse: (response: ApiResponse<SimpananBerjangkaImportSampleResponse>) =>
        response.data,
    }),

    getSimpananBerjangkaImportTemplate: builder.query<Blob, void>({
      query: () => ({
        url: `/simpanan/berjangka/import/template`,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),

    importSimpananBerjangkaMigrasi: builder.mutation<
      SimpananBerjangkaImportMigrasiResponse,
      File
    >({
      query: (file) => {
        const form = new FormData();
        form.append("file", file);
        return {
          url: `/simpanan/berjangka/import/migrasi`,
          method: "POST",
          body: form,
        };
      },
      transformResponse: (response: ApiResponse<SimpananBerjangkaImportMigrasiResponse>) =>
        response.data,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSimpananBerjangkaListQuery,
  useGetSimpananBerjangkaByIdQuery,
  useCreateSimpananBerjangkaMutation,
  useUpdateSimpananBerjangkaMutation,
  useDeleteSimpananBerjangkaMutation,
  useValidateSimpananBerjangkaMutation,
  useCairNormalSimpananBerjangkaMutation,
  useCairAwalSimpananBerjangkaMutation,
  useGetSimpananBerjangkaImportSampleQuery,
  useLazyGetSimpananBerjangkaImportTemplateQuery,
  useImportSimpananBerjangkaMigrasiMutation,
} = simpananBerjangkaApi;
