export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  dpi: string;
  nit?: string | null;
  marital_status?: string | null;
  profession?: string | null;
  nationality: string;
  birth_date?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ClientCreate {
  first_name: string;
  last_name: string;
  dpi: string;
  nit?: string;
  marital_status?: string;
  profession?: string;
  nationality?: string;
  birth_date?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface ClientUpdate {
  first_name?: string;
  last_name?: string;
  nit?: string;
  marital_status?: string;
  profession?: string;
  nationality?: string;
  birth_date?: string;
  address?: string;
  phone?: string;
  email?: string;
  status?: string;
}

export interface ClientListResponse {
  total: number;
  items: Client[];
}

export interface LegalEntity {
  id: string;
  business_name: string;
  trade_name?: string | null;
  nit: string;
  society_type: string;
  registry_number?: string | null;
  registry_folio?: string | null;
  registry_book?: string | null;
  legal_representative_id?: string | null;
  representative_position?: string | null;
  legal_representative?: Client | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LegalEntityCreate {
  business_name: string;
  trade_name?: string;
  nit: string;
  society_type?: string;
  registry_number?: string;
  registry_folio?: string;
  registry_book?: string;
  legal_representative_id?: string;
  representative_position?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface LegalEntityListResponse {
  total: number;
  items: LegalEntity[];
}
