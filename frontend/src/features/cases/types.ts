import type { Client } from "../clients/types";
import type { CaseType } from "../../shared/types";

export type CaseStatus =
  | "ABIERTO"
  | "EN_REVISION"
  | "PENDIENTE"
  | "FINALIZADO"
  | "CANCELADO";

export type PartyRole =
  | "COMPRADOR"
  | "VENDEDOR"
  | "DONANTE"
  | "DONATARIO"
  | "ARRENDADOR"
  | "ARRENDATARIO"
  | "CONTRAYENTE"
  | "SOCIO"
  | "REPRESENTANTE_LEGAL"
  | "TESTIGO"
  | "INTERPRETE"
  | "OTRO";

export interface CaseParty {
  id: string;
  case_id: string;
  client_id: string;
  party_role: PartyRole;
  notes?: string | null;
  order_index: number;
  client?: Client | null;
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: string;
  case_number: string;
  case_type: CaseType;
  status: CaseStatus;
  title: string;
  description?: string | null;
  internal_notes?: string | null;
  instrument_number?: string | null;
  protocol_folio?: string | null;
  protocol_book?: string | null;
  opened_at?: string | null;
  closed_at?: string | null;
  assigned_user_id?: string | null;
  parties: CaseParty[];
  created_at: string;
  updated_at: string;
}

export interface CaseCreate {
  title: string;
  case_type: CaseType;
  description?: string;
  internal_notes?: string;
  instrument_number?: string;
  protocol_folio?: string;
  protocol_book?: string;
  assigned_user_id?: string;
  parties?: { client_id: string; party_role: PartyRole; notes?: string; order_index?: number }[];
}

export interface CaseUpdate {
  title?: string;
  description?: string;
  internal_notes?: string;
  status?: CaseStatus;
  instrument_number?: string;
  protocol_folio?: string;
  protocol_book?: string;
  assigned_user_id?: string;
}

export interface CaseListResponse {
  total: number;
  items: Case[];
}

export interface AddPartyRequest {
  client_id: string;
  party_role: PartyRole;
  notes?: string;
  order_index?: number;
}
