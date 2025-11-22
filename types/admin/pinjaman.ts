export interface Pinjaman {
  ref_number: number;
  reference: any;
  id: number;
  pinjaman_category_id: number;
  category_name?: string;
  user_name?: string;
  user_id: number;
  description: string;
  date: string;
  nominal: number;
  tenor: number;
  interest_rate: number;
  status: string;
  created_at: string;
  updated_at: string;
  realization_date: string | null;
  approval_date: string | null;
  admin_fee?: number;
  margin?: number;
  margin_fee?: number;
  total: number;
  monthly_principal?: number;
  monthly_interest?: number;
  monthly_installment?: number;
  details_count?: number;
  detail_outstandings_count?: number;
  detail_outstandings_sum_remaining?: string;
  // Relations
  pinjaman_category?: {
    id: number;
    name: string;
    code: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface PinjamanResponse {
  code: number;
  message: string;
  data: {
    current_page: number;
    data: Pinjaman[];
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

export interface CreatePinjamanRequest {
  pinjaman_category_id: number;
  user_id: number;
  description?: string;
  date: string;
  nominal: number;
  tenor: number;
  interest_rate: number;
}

export interface UpdatePinjamanRequest {
  pinjaman_category_id?: number;
  user_id?: number;
  description?: string;
  date?: string;
  nominal?: number;
  tenor?: number;
  interest_rate?: number;
}

export interface PinjamanFilter {
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
  type: 'manual' | 'automatic';
  image?: string;
  status: string;
  created_at: string;
  updated_at: string;
  // Relations
  pinjaman?: Pinjaman;
  pinjaman_detail?: {
    id: number;
    installment_number: number;
    due_date: string;
    amount: number;
  };
}

export interface Pelunasan {
  data: number[];
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
  type: 'manual' | 'automatic';
  image?: File;
}

export interface UpdatePaymentRequest {
  pinjaman_id?: number;
  pinjaman_detail_id?: number;
  amount?: number;
  type?: 'manual' | 'automatic';
  image?: File;
}

export interface PinjamanMutasi {
  id: number;
  pinjaman_id: number;
  pinjaman_detail_id: number | null;
  type: 'installment' | 'realization';
  amount: number;
  date: string;
  description: string;
  created_at: string;
  updated_at: string;
  pinjaman_reference: string;
  anggota_name: string;
}

export interface PinjamanMutasiResponse {
  code: number;
  message: string;
  data: {
    current_page: number;
    data: PinjamanMutasi[];
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

export interface PinjamanNominatif {
  id: number;
  pinjaman_category_id: number;
  user_id: number;
  reference: string;
  ref_number: number;
  description: string;
  date: string;
  approval_date: string;
  realization_date: string;
  nominal: number;
  admin_fee: number;
  margin: number;
  margin_fee: number;
  total: number;
  tenor: number;
  interest_rate: number;
  monthly_principal: number;
  monthly_interest: number;
  monthly_installment: number;
  status: number;
  created_at: string;
  updated_at: string;
  user_name: string;
  category_code: string;
  category_name: string;
  details_count: number;
  detail_outstandings_count: number;
  detail_outstandings_sum_remaining: string;
}

export interface PinjamanNominatifResponse {
  code: number;
  message: string;
  data: {
    current_page: number;
    data: PinjamanNominatif[];
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