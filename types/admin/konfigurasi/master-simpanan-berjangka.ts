/**
 * Types untuk Master Simpanan Berjangka (Bilyet, Tarif Bunga, Kategori).
 */

// --- Master Tarif Bunga ---

export interface MasterTarifBunga {
  id: number;
  kode_bunga: string;
  tenor: string;
  tenor_bulan: number;
  rate: number;
  created_at: string;
  updated_at: string;
}

export interface MasterTarifBungaListParams {
  page?: number;
  paginate?: number;
  tenor_bulan?: 3 | 6 | 12;
  search?: string;
  searchBySpecific?: string;
  orderBy?: string;
  order?: "asc" | "desc";
}

export interface MasterTarifBungaCreateRequest {
  kode_bunga: string;
  tenor: string;
  tenor_bulan: 3 | 6 | 12;
  rate: number;
}

export interface MasterTarifBungaUpdateRequest extends MasterTarifBungaCreateRequest {}

/** Kolom untuk import migrasi tarif bunga (sample response) */
export interface MasterTarifBungaImportColumn {
  key: string;
  label: string;
  required: boolean;
  description: string;
}

/** Response GET tarif-bunga import/sample */
export interface MasterTarifBungaImportSampleResponse {
  columns: MasterTarifBungaImportColumn[];
  sample: Record<string, unknown>[];
  file_format: string;
  note: string;
}

/** Response POST tarif-bunga import/migrasi */
export interface MasterTarifBungaImportMigrasiResponse {
  message: string;
  processed: number;
  failed: number;
  errors: Record<number, string>;
}

// --- Master Bilyet Berjangka ---

export interface MasterBilyetBerjangka {
  id: number;
  kode_bilyet: string;
  nama_produk: string;
  tenor_bulan: number;
  hari_tenor: number;
  bunga_tahunan: number;
  metode_bunga: string;
  metode_pembayaran: string;
  penalti_cair_awal: number;
  minimal_simpanan: number;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface MasterBilyetBerjangkaListParams {
  page?: number;
  paginate?: number;
  status?: number;
  tenor_bulan?: 3 | 6 | 12;
  search?: string;
  searchBySpecific?: string;
  orderBy?: string;
  order?: "asc" | "desc";
}

export interface MasterBilyetBerjangkaCreateRequest {
  kode_bilyet: string;
  nama_produk: string;
  tenor_bulan: 3 | 6 | 12;
  hari_tenor: 90 | 180 | 360;
  bunga_tahunan: number;
  metode_bunga: string;
  metode_pembayaran: string;
  penalti_cair_awal?: number;
  minimal_simpanan: number;
  status: number;
}

export interface MasterBilyetBerjangkaUpdateRequest extends MasterBilyetBerjangkaCreateRequest {}

/** Kolom untuk import migrasi (sample response) */
export interface MasterBilyetBerjangkaImportColumn {
  key: string;
  label: string;
  required: boolean;
  description: string;
}

/** Response GET import/sample */
export interface MasterBilyetBerjangkaImportSampleResponse {
  columns: MasterBilyetBerjangkaImportColumn[];
  sample: Record<string, unknown>[];
  file_format: string;
  note: string;
}

/** Response POST import/migrasi */
export interface MasterBilyetBerjangkaImportMigrasiResponse {
  message: string;
  processed: number;
  failed: number;
  errors: Record<number, string>;
}

// --- Master Bilyet Berjangka Log ---

export interface MasterBilyetBerjangkaLog {
  id: number;
  master_bilyet_berjangka_id: number;
  simpanan_berjangka_id: number | null;
  event: string;
  old_status: number | null;
  new_status: number | null;
  meta: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  master_bilyet_berjangka?: MasterBilyetBerjangka;
  simpanan_berjangka?: {
    id: number;
    no_bilyet: string;
    user_id: number;
    user?: { id: number; name: string; anggota?: { reference: string } };
  };
}

export interface MasterBilyetBerjangkaLogListParams {
  master_bilyet_berjangka_id?: number;
  simpanan_berjangka_id?: number;
  event?: string;
  paginate?: number;
}

// --- Simpanan Berjangka Category ---

export interface SimpananBerjangkaCategory {
  id: number;
  code: string;
  name: string;
  interest_rate: number;
  description: string | null;
  nominal: number;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface SimpananBerjangkaCategoryListParams {
  page?: number;
  paginate?: number;
  status?: number;
  search?: string;
  searchBySpecific?: string;
  orderBy?: string;
  order?: "asc" | "desc";
}

export interface SimpananBerjangkaCategoryCreateRequest {
  code: string;
  name: string;
  interest_rate: number;
  description?: string;
  nominal: number;
  status: number;
}

export interface SimpananBerjangkaCategoryUpdateRequest extends SimpananBerjangkaCategoryCreateRequest {}

// --- Paginated response (shared shape from API) ---

export interface MasterPaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  first_page_url: string;
  last_page_url: string;
  next_page_url: string | null;
  prev_page_url: string | null;
  path: string;
  from: number | null;
  to: number | null;
  links: Array<{
    url: string | null;
    label: string;
    page: number | null;
    active: boolean;
  }>;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
