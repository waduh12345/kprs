export interface Kategori {
  id: number;
  code: string;
  name: string;
  description: string;
  status: boolean | number;
  created_at: string;
  updated_at: string;
}

export interface KategoriResponse {
  code: number;
  message: string;
  data: {
    current_page: number;
    data: Kategori[];
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

export interface CreateKategoriRequest {
  code: string;
  name: string;
  description: string;
  status: number;
}

export interface UpdateKategoriRequest {
  code?: string;
  name?: string;
  description?: string;
  status?: number;
}
