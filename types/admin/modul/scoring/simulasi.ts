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

  // Data Hasil Kalkulasi (Calculated Fields dari Controller)
  joinning_duration: number; // Lama Keanggotaan (tahun)
  debt_to_income_ratio: number; // DTI (%)
  telat_bayar_simpanan: number; // Default 0 di controller
  status_karyawan: string; // Default empty string di controller
  usia: number; // Umur saat simulasi
  score: number; // Hasil akhir skor

  pinjaman_category_name?: string;
  // Join: anggotas
  anggota_reference?: string;
  // Join: users
  anggota_name?: string;
}
export interface ScoringSimulationPayload {
  pinjaman_category_id: number;
  user_id: number;
  tenor: number; // integer, min:1
  nominal: number; // numeric, min:0
  gaji: number; // numeric, min:0
}
export interface ScoringSimulationQueryParams {
  page?: number;
  paginate?: number;
  search?: string; // s: $request->search
  searchBySpecific?: string; // format: "column:value"
  orderBy?: string; // default: scoring_simulations.updated_at
  order?: "asc" | "desc"; // default: desc
}