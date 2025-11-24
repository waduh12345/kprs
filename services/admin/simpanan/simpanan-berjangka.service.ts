import { apiSlice } from "@/services/base-query";
import {
  SimpananBerjangka,
  Payment,
} from "@/types/admin/simpanan/simpanan-berjangka";

type UnknownRecord = Record<string, unknown>;

// Utility: hapus properti undefined/null
function compactBody<T extends UnknownRecord>(obj: T): T {
  const out = {} as T;
  (Object.keys(obj) as (keyof T)[]).forEach((k) => {
    const v = obj[k];
    if (v !== undefined && v !== null) {
      (out as UnknownRecord)[String(k)] = v;
    }
  });
  return out as T;
}

// typed Object.entries helper (menghindari `any`)
function entries<T extends UnknownRecord>(obj: T): [string, T[keyof T]][] {
  return Object.entries(obj) as [string, T[keyof T]][];
}

// type guard untuk File (aman di runtime browser)
function isFile(v: unknown): v is File {
  // guard in case of SSR where File is undefined
  return typeof File !== "undefined" && v instanceof File;
}

export const simpananBerjangkaApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get list (with filters)
    getSimpananBerjangkaList: builder.query<
      {
        data: SimpananBerjangka[];
        last_page: number;
        current_page: number;
        total: number;
        per_page: number;
      },
      {
        paginate?: number;
        page?: number;
        search?: string;
        status?: number | string;
        from_date?: string;
        to_date?: string;
        user_id?: number | string;
        simpanan_berjangka_category_id?: number | string;
      }
    >({
      query: ({
        paginate = 10,
        page = 1,
        search = "",
        status = undefined,
        from_date = "",
        to_date = "",
        user_id = undefined,
        simpanan_berjangka_category_id = undefined,
      }) => {
        const params = new URLSearchParams();
        params.set("paginate", String(paginate));
        params.set("page", String(page));
        if (search !== undefined && search !== null)
          params.set("search", String(search));
        if (status !== undefined && status !== null && String(status) !== "")
          params.set("status", String(status));
        if (from_date) params.set("from_date", from_date);
        if (to_date) params.set("to_date", to_date);
        if (user_id !== undefined && user_id !== null && String(user_id) !== "")
          params.set("user_id", String(user_id));
        if (
          simpanan_berjangka_category_id !== undefined &&
          simpanan_berjangka_category_id !== null &&
          String(simpanan_berjangka_category_id) !== ""
        )
          params.set(
            "simpanan_berjangka_category_id",
            String(simpanan_berjangka_category_id)
          );

        return {
          url: `simpanan/berjangka?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: (result) =>
        result && Array.isArray(result.data)
          ? [
              ...result.data.map((r) => ({
                type: "SimpananBerjangka" as const,
                id: r.id,
              })),
              { type: "SimpananBerjangka" as const, id: "LIST" },
            ]
          : [{ type: "SimpananBerjangka" as const, id: "LIST" }],
    }),

    // Get by id
    getSimpananBerjangkaById: builder.query<
      {
        code: number;
        message: string;
        data: SimpananBerjangka & { payments?: Payment[] };
      },
      number
    >({
      query: (id) => ({
        url: `simpanan/berjangka/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [
        { type: "SimpananBerjangka" as const, id },
      ],
    }),

    // Create
    createSimpananBerjangka: builder.mutation<
      { code: number; message: string; data: SimpananBerjangka },
      Partial<SimpananBerjangka>
    >({
      query: (raw) => {
        // jika ada file image -> gunakan FormData
        const hasFile = raw.image && typeof raw.image !== "string";
        if (hasFile) {
          const fd = new FormData();
          const dataObj = compactBody(
            raw as Partial<SimpananBerjangka> as UnknownRecord
          );
          entries(dataObj).forEach(([k, v]) => {
            if (k === "image" && isFile(v)) {
              fd.append(k, v);
            } else if (typeof v === "object" && v !== null) {
              // array atau object -> JSON
              try {
                fd.append(k, JSON.stringify(v));
              } catch {
                // fallback
                fd.append(k, String(v));
              }
            } else {
              fd.append(k, String(v ?? ""));
            }
          });

          return {
            url: "simpanan/berjangka",
            method: "POST",
            body: fd,
          };
        }

        return {
          url: "simpanan/berjangka",
          method: "POST",
          body: compactBody(raw as Partial<SimpananBerjangka> as UnknownRecord),
        };
      },
      invalidatesTags: [{ type: "SimpananBerjangka" as const, id: "LIST" }],
    }),

    // Update
    updateSimpananBerjangka: builder.mutation<
      { code: number; message: string; data: SimpananBerjangka },
      { id: number; data: Partial<SimpananBerjangka> }
    >({
      query: ({ id, data }) => {
        const hasFile = data.image && typeof data.image !== "string";
        if (hasFile) {
          const fd = new FormData();
          const dataObj = compactBody(
            data as Partial<SimpananBerjangka> as UnknownRecord
          );
          entries(dataObj).forEach(([k, v]) => {
            if (k === "image" && isFile(v)) {
              fd.append(k, v);
            } else if (typeof v === "object" && v !== null) {
              try {
                fd.append(k, JSON.stringify(v));
              } catch {
                fd.append(k, String(v));
              }
            } else {
              fd.append(k, String(v ?? ""));
            }
          });

          // method override if backend expects PUT with form-data
          fd.append("_method", "PUT");

          return {
            url: `simpanan/berjangka/${id}`,
            method: "POST",
            body: fd,
          };
        }

        return {
          url: `simpanan/berjangka/${id}`,
          method: "PUT",
          body: compactBody(
            data as Partial<SimpananBerjangka> as UnknownRecord
          ),
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "SimpananBerjangka" as const, id },
        { type: "SimpananBerjangka" as const, id: "LIST" },
      ],
    }),

    // Delete
    deleteSimpananBerjangka: builder.mutation<
      { code: number; message: string },
      number
    >({
      query: (id) => ({
        url: `simpanan/berjangka/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "SimpananBerjangka" as const, id },
        { type: "SimpananBerjangka" as const, id: "LIST" },
      ],
    }),

    // Validate (PUT /simpanan/berjangka/:id/validate)
    validateSimpananBerjangka: builder.mutation<
      { code: number; message: string; data?: unknown },
      { id: number; data?: Record<string, unknown> }
    >({
      query: ({ id, data = {} }) => {
        const body = compactBody(data);
        // jika body kosong, tetap kirim PUT tanpa body
        return {
          url: `simpanan/berjangka/${id}/validate`,
          method: "PUT",
          body: Object.keys(body).length ? body : undefined,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "SimpananBerjangka" as const, id },
        { type: "SimpananBerjangka" as const, id: "LIST" },
      ],
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
} = simpananBerjangkaApi;