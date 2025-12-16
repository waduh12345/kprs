export interface Media {
  id: number;
  model_type: string;
  model_id: number;
  uuid: string;
  collection_name: string;
  name: string;
  file_name: string;
  mime_type: string;
  disk: string;
  conversions_disk: string;
  size: number;
  order_column: number;
  created_at: string;
  updated_at: string;
  original_url: string;
  preview_url: string;
}

export interface DocumentsAnggota {
  id: number;
  anggota_id: number;
  key: string;
  created_at: string;
  updated_at: string;
  document: File | string | null;
  media: Media[];
}

export interface AnggotaKoperasi {
  id: number;
  user_id: number | null;
  reference: string;
  ref_number: 1;
  user_name?: string;
  user_email?: string;
  type: string;
  user_phone?: string;
  name?: string;
  email?: string;
  phone?: string;
  address: string;
  gender: string; // M or F
  birth_date: string;
  birth_place: string;
  nik: string;
  npwp: string | null;
  status: number; // case PENDING = 0; case APPROVED = 1; case REJECTED = 2;
  created_at: string;
  updated_at: string;
  nip: string | null;
  unit_kerja: string | null;
  jabatan: string | null;
  documents: DocumentsAnggota[];
  registration_number?: string;
}
