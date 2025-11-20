export interface Pembiayaan {
  id: number;
  type: string;
  code: string;
  name: string;
  interest_rate: number;
  description: string;
  margin: number;
  admin_fee: number;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface PembiayaanResponse {
  code: number;
  message: string;
  data: {
    current_page: number;
    data: Pembiayaan[];
    first_page_url: string;
    from: number;
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
    to: number;
    total: number;
  };
}

export interface CreatePembiayaanRequest {
  type: string;
  code: string;
  name: string;
  interest_rate: number;
  description: string;
  margin: number;
  admin_fee: number;
  status: number;
}

export interface UpdatePembiayaanRequest {
  type?: string;
  code?: string;
  name?: string;
  interest_rate?: number;
  description?: string;
  margin?: number;
  admin_fee?: number;
  status?: number;
}
