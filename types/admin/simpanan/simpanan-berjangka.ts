/**
 * Types untuk Simpanan Berjangka (transaksi bilyet anggota).
 */

export type PaymentTypeSimpananBerjangka = "manual" | "automatic" | "import" | "saldo";

export type StatusBilyet = "aktif" | "cair" | "cair_awal";

/** Status validasi: 0 Pending, 1 Approved, 2 Rejected, 3 Inactive */
export type ValidationStatus = 0 | 1 | 2 | 3;

export interface SimpananBerjangka {
  id: number;
  simpanan_berjangka_category_id: number | null;
  master_bilyet_berjangka_id: number | null;
  user_id: number;
  cashback_id: number | null;
  no_bilyet: string;
  no_ao: string;
  reference: string;
  ref_number: number;
  description: string | null;
  date: string;
  nominal: number;
  rate: number | null;
  bunga_bruto: number;
  bunga_bruto_pajak: number;
  add_bunga_bruto: number;
  add_bunga_bruto_pajak: number;
  term_months: number;
  maturity_date: string;
  type: PaymentTypeSimpananBerjangka | null;
  status: ValidationStatus;
  status_bilyet: StatusBilyet;
  created_at: string;
  updated_at: string;
  /** Dari join/append */
  user_name?: string;
  category_code?: string;
  category_name?: string;
  category_interest_rate?: number;
  cashback_nominal?: number;
  cashback_type?: string;
  cashback_description?: string;
  image?: string;
  kode_bilyet_master?: string;
  no_anggota?: string;
  user?: {
    id: number;
    name: string;
    email?: string;
    anggota?: { reference: string };
  };
  category?: {
    id: number;
    code: string;
    name: string;
    interest_rate: number;
    nominal: number;
  };
  masterBilyet?: {
    id: number;
    kode_bilyet: string;
    nama_produk: string;
    tenor_bulan: number;
    hari_tenor: number;
    bunga_tahunan: number;
    minimal_simpanan: number;
    penalti_cair_awal: number;
  };
  payment?: {
    id: number;
    order_id: string;
    account_number: string;
    amount: number;
    payment_type: string;
    channel: string;
    status: number;
  };
}

export interface SimpananBerjangkaListParams {
  page?: number;
  paginate?: number;
  user_id?: number;
  from_date?: string;
  to_date?: string;
  from_maturity_date?: string;
  to_maturity_date?: string;
  due_day?: number;
  status?: ValidationStatus | ValidationStatus[];
  simpanan_berjangka_category_id?: number;
  master_bilyet_berjangka_id?: number;
  status_bilyet?: StatusBilyet;
  type?: PaymentTypeSimpananBerjangka;
  search?: string;
  searchBySpecific?: string;
  orderBy?: string;
  order?: "asc" | "desc";
}

/** Request daftar dengan Master Bilyet (sistem isi tenor, rate, no_bilyet otomatis). Frontend kirim anggota_id, API resolve user_id. */
export interface SimpananBerjangkaStoreWithMasterRequest {
  master_bilyet_berjangka_id: number;
  anggota_id: number;
  date: string;
  nominal: number;
  type: PaymentTypeSimpananBerjangka;
  description?: string;
  cashback_id?: number;
  /** Wajib jika type === 'automatic' */
  payment_method?: "bank_transfer" | "qris";
  payment_channel?: "bca" | "bni" | "bri" | "cimb" | "qris";
  /** Wajib jika type === 'manual' */
  image?: File;
}

/** Request daftar tanpa Master Bilyet (legacy: pakai kategori + no_bilyet, no_ao, term_months). Frontend kirim anggota_id, API resolve user_id. */
export interface SimpananBerjangkaStoreWithCategoryRequest {
  simpanan_berjangka_category_id: number;
  anggota_id: number;
  date: string;
  nominal: number;
  term_months: number;
  no_bilyet: string;
  no_ao: string;
  type: PaymentTypeSimpananBerjangka;
  description?: string;
  cashback_id?: number;
  payment_method?: "bank_transfer" | "qris";
  payment_channel?: "bca" | "bni" | "bri" | "cimb" | "qris";
  image?: File;
}

export type SimpananBerjangkaStoreRequest =
  | SimpananBerjangkaStoreWithMasterRequest
  | SimpananBerjangkaStoreWithCategoryRequest;

export interface SimpananBerjangkaUpdateRequest {
  description?: string;
  image?: File;
  term_months?: number;
  status_bilyet?: StatusBilyet;
}

export interface SimpananBerjangkaValidateRequest {
  status: ValidationStatus;
}

export interface SimpananBerjangkaCairNormalResponse {
  message: string;
  no_bilyet: string;
  nominal_bayar: number;
  bunga_bayar: number;
  total: number;
  status_bilyet: string;
}

export interface SimpananBerjangkaCairAwalResponse {
  message: string;
  no_bilyet: string;
  nominal_bayar: number;
  bunga_bruto: number;
  bunga_hangus: number;
  bunga_diberikan: number;
  penalti_persen: number;
  total: number;
  status_bilyet: string;
}

export interface SimpananBerjangkaPaginatedResponse {
  data: SimpananBerjangka[];
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

/** Kolom untuk import migrasi simpanan berjangka (sample response) */
export interface SimpananBerjangkaImportColumn {
  key: string;
  label: string;
  required: boolean;
  description: string;
}

/** Response GET simpanan/berjangka/import/sample */
export interface SimpananBerjangkaImportSampleResponse {
  columns: SimpananBerjangkaImportColumn[];
  sample: Record<string, unknown>[];
  file_format: string;
  note: string;
}

/** Response POST simpanan/berjangka/import/migrasi */
export interface SimpananBerjangkaImportMigrasiResponse {
  message: string;
  processed: number;
  failed: number;
  errors: Record<number, string>;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
