/**
 * Status pengajuan meninggal: 0 = Pending, 1 = Approved, 2 = Rejected
 * (ValidationEnum, sama seperti status umum)
 */
export type MeninggalStatus = 0 | 1 | 2;

/** Label status pengajuan meninggal */
export const MENINGGAL_STATUS_LABELS: Record<MeninggalStatus, string> = {
  0: "Pending",
  1: "Approved",
  2: "Rejected",
};

export function getMeninggalStatusLabel(status: number): string {
  return MENINGGAL_STATUS_LABELS[status as MeninggalStatus] ?? "Unknown";
}

/** Status untuk validasi: hanya Approved (1) atau Rejected (2) */
export type MeninggalValidateStatus = 1 | 2;

/** Satu baris dari GET /anggota/meninggals (index) */
export interface MeninggalItem {
  id: number;
  anggota_id: number;
  deceased_at: string;
  description: string | null;
  status: MeninggalStatus;
  created_at: string;
  updated_at: string;
  /** Dari join anggotas (jika API mengembalikan) */
  anggota_name?: string | null;
  anggota_email?: string | null;
  anggota_phone?: string | null;
  anggota_nik?: string | null;
}

/** Anggota ringkasan (dari relation show) */
export interface MeninggalAnggotaRef {
  id: number;
  user_id: number | null;
  reference: string;
  type: string;
  status: number;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

/** Media item (sama struktur seperti di anggota) */
export interface MeninggalMedia {
  id: number;
  model_type: string;
  model_id: number;
  uuid: string;
  collection_name: string;
  name: string;
  file_name: string;
  mime_type: string;
  disk: string;
  size: number;
  created_at: string;
  updated_at: string;
  original_url?: string;
  preview_url?: string;
}

/** Response GET /anggota/meninggals/:id (show) – dengan media & anggota */
export interface MeninggalDetail extends MeninggalItem {
  media?: MeninggalMedia[];
  anggota?: MeninggalAnggotaRef | null;
}

/** Query params untuk GET /anggota/meninggals (index) */
export interface MeninggalListParams {
  page?: number;
  paginate?: number;
  search?: string;
  status?: MeninggalStatus;
  orderBy?: string;
  order?: "asc" | "desc";
  searchBySpecific?: string;
}

/** Body POST /anggota/meninggals (pengajuan) – status opsional, default Pending */
export interface MeninggalCreatePayload {
  anggota_id: number;
  deceased_at: string;
  description?: string | null;
  status?: MeninggalStatus;
}

/** Body PUT /anggota/meninggals/:id (update) */
export interface MeninggalUpdatePayload {
  anggota_id: number;
  deceased_at: string;
  description?: string | null;
  status: MeninggalStatus;
}

/** Body PUT /anggota/meninggals/:id/validate (approve/reject) */
export interface MeninggalValidatePayload {
  status: MeninggalValidateStatus;
}
