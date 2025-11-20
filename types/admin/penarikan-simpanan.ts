export interface PenarikanSimpanan {
  id: number;
  user_id: number;
  wallet_id: number;
  reference: string;
  ref_number: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  amount: number;
  description: string;
  status: number;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_email: string;
}

export interface PenarikanSimpananResponse {
  code: number;
  message: string;
  data: {
    current_page: number;
    data: PenarikanSimpanan[];
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

export interface CreatePenarikanSimpananRequest {
  wallet_id?: number | null;
  user_id: number | null;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  amount: string;
  description?: string | null;
}

export interface UpdatePenarikanSimpananRequest {
  wallet_id: number | null;
  bank_name?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  amount?: string;
  description?: string;
}

export type Wallet = {
  id: number;
  user_id: number;
  name: string;
  description: string;
  balance: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  reference_type: string;
  reference_id: number;
  reference: {
    id: number;
    code: string;
    name: string;
    description: string;
    status: number;
    created_at: string;
    updated_at: string;
  };
  user: {
    id: number;
    name: string;
    phone: string;
    email: string;
    email_verified_at: string;
    created_at: string;
    updated_at: string;
  };
};

export interface WalletResponse {
  code: number;
  message: string;
  data: {
    current_page: number;
    data: Wallet[];
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
