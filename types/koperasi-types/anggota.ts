/** ValidationEnum: 0 = Pending, 1 = Approved, 2 = Rejected */
export type AnggotaStatus = 0 | 1 | 2;

/** Label status untuk tampilan (sesuai ValidationEnum) */
export const ANGGOTA_STATUS_LABELS: Record<AnggotaStatus, string> = {
  0: "Pending",
  1: "Approved",
  2: "Rejected",
};

/** Helper: ambil label status dari angka */
export function getAnggotaStatusLabel(status: number): string {
  return ANGGOTA_STATUS_LABELS[status as AnggotaStatus] ?? "Unknown";
}

export interface Media {
  id: number;
  model_type: string;
  model_id: number;
  uuid: string;
  collection_name: string;
  name: string;
  file_name: string;
  mime_type: string;
  disk: string;
  conversions_disk: string;
  size: number;
  order_column: number;
  created_at: string;
  updated_at: string;
  original_url: string;
  preview_url: string;
}

export interface DocumentsAnggota {
  id: number;
  anggota_id: number;
  key: string;
  created_at: string;
  updated_at: string;
  /** URL dari getFirstMediaUrl('document') */
  document: string | null;
  media: Media[];
}

/** User ringkasan (dari relation atau join) */
export interface AnggotaUser {
  id: number;
  name: string;
  email: string;
  phone: string;
}

/** Log perubahan status anggota (response API) */
export interface LogAnggotaStatus {
  id: number;
  anggota_id: number;
  from_status: number;
  to_status: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  user?: AnggotaUser;
}

/**
 * Satu baris log untuk ditampilkan di tabel/daftar.
 * Bisa dipakai dengan data API + label dari getAnggotaStatusLabel().
 */
export interface LogAnggotaStatusDisplay extends LogAnggotaStatus {
  /** Label status asal, e.g. "Pending" */
  from_status_label?: string;
  /** Label status tujuan, e.g. "Approved" */
  to_status_label?: string;
  /** Nama user yang mengubah (dari relation user) */
  changed_by_name?: string;
}

/** Detail individu (dari relation individu) */
export interface AnggotaIndividu {
  id: number;
  anggota_id: number;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  gender: string | null;
  birth_date: string | null;
  birth_place: string | null;
  nik: string | null;
  npwp: string | null;
  marital_status: string | null;
  education: string | null;
  occupation: string | null;
  company_name: string | null;
  company_address: string | null;
  occupation_started_at: string | null;
}

/** Detail perusahaan (dari relation perusahaan) */
export interface AnggotaPerusahaan {
  id: number;
  anggota_id: number;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  type: string | null;
  registration_number: string | null;
  established_at: string | null;
  npwp: string | null;
}

/**
 * Anggota – mengikuti response API index (list) dan show (detail).
 * Index: anggotas.* + user_* + individu_* + perusahaan_name/npwp.
 * Show: + documents, user, individu, perusahaan, status_logs.
 */
export interface AnggotaKoperasi {
  id: number;
  user_id: number | null;
  reference: string;
  ref_number: number;
  type: "individu" | "perusahaan";
  status: AnggotaStatus;
  joined_at: string;
  created_at: string;
  updated_at: string;

  /** Dari join / relation */
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  individu_name?: string | null;
  individu_birth_date?: string | null;
  individu_birth_place?: string | null;
  individu_nik?: string | null;
  individu_npwp?: string | null;
  perusahaan_name?: string | null;
  perusahaan_npwp?: string | null;

  /** Nama/email/phone tampilan (dari individu atau perusahaan) */
  name?: string;
  email?: string;
  phone?: string;
  address?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  birth_place?: string | null;
  nik?: string | null;
  npwp?: string | null;
  marital_status?: string | null;
  education?: string | null;
  occupation?: string | null;
  company_name?: string | null;
  company_address?: string | null;
  occupation_started_at?: string | null;
  company_type?: string | null;
  registration_number?: string | null;
  established_at?: string | null;

  /** Dari show(): relations */
  documents?: DocumentsAnggota[];
  user?: AnggotaUser;
  individu?: AnggotaIndividu | null;
  perusahaan?: AnggotaPerusahaan | null;
  /** Dari show(): relation statusLogs (log perubahan status) */
  status_logs?: LogAnggotaStatus[];
}

/** Query params untuk GET /anggota/anggotas (index) */
export interface AnggotaListParams {
  page?: number;
  paginate?: number;
  search?: string;
  status?: AnggotaStatus;
  type?: "individu" | "perusahaan";
  meninggal?: boolean;
  birth_year?: number;
  birth_month?: number;
  orderBy?: string;
  order?: "asc" | "desc";
  searchBySpecific?: string;
}

/** Response import Excel */
export interface AnggotaImportResponse {
  message: string;
  imported: number;
  failed: number;
  errors: Record<number, string>;
}

/** Response bulk status update */
export interface AnggotaBulkStatusResponse {
  code: number;
  message: string;
  data?: { updated: number };
}
