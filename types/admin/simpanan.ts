export interface Payment {
  id: number;
  driver: string;
  payable_type: string;
  payable_id: number;
  order_id: string;
  transaction_id: string;
  payment_type: string;
  account_number: string;
  account_code: string |null;
  channel: string;
  expired_at: string;
  paid_at: string;
  amount: number;
  created_at: string;
  updated_at: string;
}
export interface Simpanan {
  id: number;
  simpanan_category_id: number;
  user_id: number;
  reference: string;
  excel_path: string;
  ref_number: 1;
  order_id: string;
  description: string;
  date: string;
  nominal: number;
  payment_link: string;
  expires_at: string;
  paid_at: string | null;
  type: "automatic" | "manual";
  status: number;
  created_at: string;
  updated_at: string;
  user_name: string;
  category_code: string;
  category_name: string;
  image: File | string | null;
  media: string[];
  payment_method: string; // Diisi kalau automatic bank_transfer,qris
  payment_channel: string; // Diisi kalau automatic bca,bni,bri,cimb,qris
  payment: Payment;
}

export interface SimpananResponse {
  code: number;
  message: string;
  data: {
    current_page: number;
    data: Simpanan[];
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: Array<{
      url: string | null;
      label: string;
      page: number | null;
      active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
  };
}

export interface CreateSimpananRequest {
  simpanan_category_id: number;
  reference_id: number;
  reference_type: string;
  user_id: number;
  description?: string;
  date: string;
  nominal: number;
  type: "automatic" | "manual";
  image?: File;
  payment_method?: string;
  payment_channel?: string;
}

export interface UpdateSimpananRequest {
  pinjaman_category_id?: number;
  user_id?: number;
  description?: string;
  date?: string;
  nominal?: number;
  tenor?: number;
  interest_rate?: number;
}

export interface SimpananFilter {
  category_id?: number;
  status?: string;
  user_id?: number;
  date_from?: string;
  date_to?: string;
}

// Payment History Types
export interface PaymentHistory {
  id: number;
  pinjaman_id: number;
  pinjaman_detail_id: number;
  amount: number;
  type: "manual" | "automatic";
  image?: string;
  status: string;
  created_at: string;
  updated_at: string;
  // Relations
  pinjaman?: Simpanan;
  pinjaman_detail?: {
    id: number;
    installment_number: number;
    due_date: string;
    amount: number;
  };
}

export interface PaymentHistoryResponse {
  code: number;
  message: string;
  data: {
    current_page: number;
    data: PaymentHistory[];
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: Array<{
      url: string | null;
      label: string;
      page: number | null;
      active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
  };
}

export interface CreatePaymentRequest {
  pinjaman_id: number;
  pinjaman_detail_id: number;
  amount: number;
  type: "manual" | "automatic";
  image?: File;
}

export interface UpdatePaymentRequest {
  pinjaman_id?: number;
  pinjaman_detail_id?: number;
  amount?: number;
  type?: "manual" | "automatic";
  image?: File;
}
