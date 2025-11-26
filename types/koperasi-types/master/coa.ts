export interface CoaKoperasi {
  coa_id?: string | null;
  code: string;
  name: string;
  description: string;
  level: number;
  type: string; //  General / Detail
  updated_at: string;
  created_at: string;
  id: number;
}