export interface Payment {
  id: number;
  driver: string;
  payable_type: string; // App\\Models\\Simpanan\\SimpananBerjangka
  payable_id: number;
  order_id: string;
  transaction_id: string;
  payment_type: string;
  account_number: string;
  account_code: string | null;
  redirect_url: string | null;
  channel: string;
  expired_at: string;
  paid_at: string | null;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface SimpananBerjangka {
  id: number;
  simpanan_berjangka_category_id: number;
  user_id: number;
  reference: string;
  ref_number: number;
  description: string;
  date: string;
  nominal: number;
  term_months: number;
  maturity_date: string;
  type: string;
  status: number | boolean;
  created_at: string;
  updated_at: string;
  user_name: string;
  category_code: string;
  category_name: string;
  payment_method: string;
  payment_channel: string;
  image: File | string | null;
  no_bilyet: string | null;
  category_interest_rate: number | null;
}