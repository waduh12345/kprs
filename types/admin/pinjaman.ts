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
