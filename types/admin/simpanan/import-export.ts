/**
 * Types untuk fitur Import Simpanan (setoran & tagihan) dan Export.
 * Mengikuti response API: ImportSimpananController, ExportSimpananController.
 *
 * Template import (xlsx) – gunakan dengan base URL API:
 * - Setoran (tambah simpanan): GET /simpanan/import/template
 * - Migrasi (generate rekening + saldo per anggota): GET /simpanan/import/migrasi/template
 * - Tagihan: GET /simpanan/import/tagihan/template
 */

/** Path API template import setoran (tambah simpanan), format xlsx */
export const SIMPANAN_IMPORT_TEMPLATE_PATH = "/simpanan/import/template";

/** Path API template import migrasi (rekening + saldo per anggota), format xlsx */
export const SIMPANAN_MIGRASI_IMPORT_TEMPLATE_PATH =
  "/simpanan/import/migrasi/template";

/** Path API template import tagihan, format xlsx */
export const SIMPANAN_TAGIHAN_IMPORT_TEMPLATE_PATH =
  "/simpanan/import/tagihan/template";

/** Status proses import (ProcessTypeEnum): queue | processed | finished | failed */
export type SimpananImportStatus = string;

/** Satu baris dari GET /simpanan/import (list riwayat import) */
export interface SimpananImportItem {
  id: number;
  reference: string;
  ref_number: number;
  date: string;
  total: number;
  excel_path: string | null;
  status: SimpananImportStatus;
  created_at: string;
  updated_at: string;
}

/** Wallet ringkasan (dari relation) */
export interface SimpananImportWalletRef {
  id: number;
  user_id: number;
  name: string;
  account_number: string | null;
  balance: number;
}

/** Simpanan ringkasan (dari relation detail.simpanan) */
export interface SimpananImportSimpananRef {
  id: number;
  reference: string;
  nominal: number;
  date: string;
  description: string | null;
}

/** Satu baris detail import (detail per rekening/simpanan) */
export interface SimpananImportDetailItem {
  id: number;
  simpanan_import_id: number;
  wallet_id: number;
  simpanan_id: number;
  amount: number;
  created_at: string;
  updated_at: string;
  wallet?: SimpananImportWalletRef;
  simpanan?: SimpananImportSimpananRef;
}

/** Response GET /simpanan/import/:id (detail satu import + details) */
export interface SimpananImportDetail {
  id: number;
  reference: string;
  ref_number: number;
  date: string;
  total: number;
  excel_path: string | null;
  status: SimpananImportStatus;
  created_at: string;
  updated_at: string;
  details?: SimpananImportDetailItem[];
}

/** Query params GET /simpanan/import (index) – sesuai getDataWithFilter */
export interface SimpananImportListParams {
  page?: number;
  paginate?: number;
  search?: string;
  orderBy?: string;
  order?: "asc" | "desc";
  searchBySpecific?: string;
}

/** Response POST /simpanan/import – import setoran (langsung ke database) */
export interface SimpananImportResponse {
  message: string;
  reference: string;
  processed: number;
  failed: number;
  errors: Record<number, string>;
}

/** Response POST /simpanan/import/tagihan – import tagihan (potong saldo) */
export interface SimpananTagihanImportResponse {
  message: string;
  reference: string;
  processed: number;
  failed: number;
  errors: Record<number, string>;
}

/** Response POST /simpanan/import/migrasi – import migrasi (generate rekening + saldo per anggota) */
export interface SimpananMigrasiImportResponse {
  message: string;
  reference: string;
  processed: number;
  failed: number;
  errors: Record<number, string>;
}

/** Body POST /simpanan/export – export simpanan (queue, notifikasi saat selesai) */
export interface SimpananExportParams {
  from_date: string;
  to_date: string;
}
