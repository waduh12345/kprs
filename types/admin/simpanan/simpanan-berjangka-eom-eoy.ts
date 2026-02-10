/**
 * Types untuk Simpanan Berjangka - Bunga Harian, Akrual EOM (bulanan), dan EOY (tahunan).
 */

/** Request hitung bunga per hari (query params). */
export interface BungaHarianParams {
    nominal: number;
    rate: number;
  }
  
  /** Response hitung bunga per hari. */
  export interface BungaHarianResponse {
    nominal: number;
    rate: number;
    bunga_per_hari: number;
  }

  /** Satu record laporan bunga harian (hasil proses schedular, sudah di DB). */
  export interface BungaHarianRecord {
    id: number;
    simpanan_berjangka_id: number;
    date: string;
    nominal: number;
    rate: number;
    bunga_per_hari: number;
    created_at?: string;
    updated_at?: string;
    simpanan_berjangka?: {
      id: number;
      no_bilyet: string;
      user_id: number;
      user?: { id: number; name: string };
      masterBilyet?: { id: number; kode_bilyet: string; nama_produk: string };
    };
  }

  /** Filter list laporan bunga harian. */
  export interface BungaHarianListParams {
    page?: number;
    paginate?: number;
    date_from?: string;
    date_to?: string;
    search?: string;
    simpanan_berjangka_id?: number;
  }
  
  /** Satu record akrual bulanan (EOM). */
  export interface SimpananBerjangkaAkrualBulanan {
    id: number;
    simpanan_berjangka_id: number;
    period_year: number;
    period_month: number;
    nominal: number;
    rate: number;
    jumlah_hari: number;
    bunga_amount: number;
    created_at?: string;
    updated_at?: string;
    simpanan_berjangka?: {
      id: number;
      no_bilyet: string;
      user_id: number;
      user?: { id: number; name: string };
      masterBilyet?: { id: number; kode_bilyet: string; nama_produk: string };
    };
  }
  
  /** Filter list EOM. */
  export interface SimpananBerjangkaEomListParams {
    page?: number;
    simpanan_berjangka_id?: number;
    year?: number;
    month?: number;
    paginate?: number;
    search?: string;
  }
  
  /** Item hasil preview hitung EOM (calculate). */
  export interface EomCalculateItem {
    no_bilyet: string;
    simpanan_berjangka_id: number;
    period_year: number;
    period_month: number;
    nominal: number;
    rate: number;
    jumlah_hari: number;
    bunga_amount: number;
  }
  
  /** Response preview hitung EOM. */
  export interface CalculateEomResponse {
    period_year: number;
    period_month: number;
    items: EomCalculateItem[];
    summary_total_bunga: number;
  }
  
  /** Request proses EOM (simpan akrual). */
  export interface ProcessEomParams {
    year: number;
    month: number;
  }
  
  /** Response proses EOM. */
  export interface ProcessEomResponse {
    message: string;
    period_year: number;
    period_month: number;
    jumlah: number;
  }
  
  /** Satu record EOY (total bunga tahunan). */
  export interface SimpananBerjangkaEoy {
    id: number;
    simpanan_berjangka_id: number;
    tahun: number;
    total_bunga_tahunan: number;
    created_at?: string;
    updated_at?: string;
    simpanan_berjangka?: {
      id: number;
      no_bilyet: string;
      user_id: number;
      user?: { id: number; name: string };
      masterBilyet?: { id: number; kode_bilyet: string; nama_produk: string };
    };
  }
  
  /** Filter list EOY. */
  export interface SimpananBerjangkaEoyListParams {
    page?: number;
    simpanan_berjangka_id?: number;
    tahun?: number;
    paginate?: number;
    search?: string;
  }
  
  /** Item hasil preview hitung EOY (calculate). */
  export interface EoyCalculateItem {
    no_bilyet: string;
    simpanan_berjangka_id: number;
    tahun: number;
    total_bunga_tahunan: number;
  }
  
  /** Response preview hitung EOY. */
  export interface CalculateEoyResponse {
    tahun: number;
    items: EoyCalculateItem[];
    summary_total_bunga_tahunan: number;
  }
  
  /** Request proses EOY (simpan). */
  export interface ProcessEoyParams {
    tahun: number;
  }
  
  /** Response proses EOY. */
  export interface ProcessEoyResponse {
    message: string;
    tahun: number;
    jumlah: number;
  }
  
  /** Paginated response (Laravel). */
  export interface SimpananBerjangkaEomEoyPaginatedResponse<T> {
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
  