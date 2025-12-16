export interface Data {
  id: number;
  sales_category_id: number;
  sales_category_code?: string;
  sales_category_name?: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  status: boolean | number;
  created_at: string;
  updated_at: string;
}

export interface DataResponse {
  code: number;
  message: string;
  data: {
    current_page: number;
    data: Data[];
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

export interface CreateDataRequest {
  sales_category_id: number;
  code: string;
  name: string;
  address: string;
  phone: string;
  status: number;
}

export interface UpdateDataRequest {
  sales_category_id: number;
  code?: string;
  name?: string;
  address?: string;
  phone?: string;
  status?: number;
}
