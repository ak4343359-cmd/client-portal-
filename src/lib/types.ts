export type Role = "client" | "agent" | "admin";
export type Status = "open" | "in_progress" | "on_hold" | "resolved" | "closed";
export type Priority = "low" | "medium" | "high" | "urgent";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: Role;
  company_id: string | null;
  phone: string | null;
};

export type Ticket = {
  id: number;
  reference: string | null;
  subject: string;
  description: string | null;
  category: string | null;
  priority: Priority;
  status: Status;
  created_by: string;
  company_id: string | null;
  assigned_to: string | null;
  sla_response_due: string | null;
  sla_resolve_due: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: number;
  ticket_id: number;
  author_id: string | null;
  body: string;
  is_internal: boolean;
  via_email: boolean;
  created_at: string;
};

export type Csat = {
  id: number;
  ticket_id: number;
  score: number | null;
  comment: string | null;
  token: string;
  submitted_at: string | null;
};
