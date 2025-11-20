export interface SimpananBerjangka {
  id: number;
  code: string;
  name: string;
  interest_rate: number;
  description: string;
  nominal: number;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface SimpananBerjangkaResponse {
  code: number;
  message: string;
  data: {
    current_page: number;
    data: SimpananBerjangka[];
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

export interface CreateSimpananBerjangkaRequest {
  code: string;
  name: string;
  interest_rate: number;
  description: string;
  nominal: number;
  status: number;
}

export interface UpdateSimpananBerjangkaRequest {
  code?: string;
  name?: string;
  interest_rate?: number;
  description?: string;
  nominal?: number;
  status?: number;
}
