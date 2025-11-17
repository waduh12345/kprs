import { User } from "../user";

export interface Reference {
    id: number;
    code: string;
    name: string;
    interest_rate: number;
    description: string;
    nominal: number;
    status: number | boolean;
    created_at: string;
    updated_at: string;
}

export interface InputSimpanan {
  user_id: number;
  reference_id: number;
  reference_type: string; // App\\Models\\Master\\SimpananCategory
  name: string;
  account_number: string;
  description: string;
  updated_at: string;
  created_at: string;
  id: number;
  balance: 0;
  is_default: false;
  reference: Reference;
  user: User;
}

export interface CreateSimpananRequest {
  user_id: number;
  reference_type: string; // Contoh: "App\\Models\\Master\\SimpananCategory"
  reference_id: number;
}

export interface Transfer {
  from_wallet_id: number;
  to_wallet_id: number;
  amount: number;
  description: string | null;
}

export interface Balance {
  total: number;
  total_debit: number;
  total_credit: number;
}
