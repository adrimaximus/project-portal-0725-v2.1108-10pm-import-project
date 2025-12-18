import { Json } from './supabase';

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  sidebar_order: Json | null;
  notification_preferences: Json | null;
  people_kanban_settings: Json | null;
  google_calendar_settings: Json | null;
  theme: string | null;
  phone: string | null;
  project_filters: Json | null;
  soniox_settings: Json | null;
  last_active_at: string | null;
}

export interface Company {
  id: string;
  name: string;
  legal_name: string | null;
  address: string | Json | null;
  billing_address: string | null;
  logo_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string | null;
  custom_properties: Json | null;
  slug: string;
}

export interface Person {
  id: string;
  full_name: string;
  contact: Json | null;
  company: string | null;
  job_title: string | null;
  department: string | null;
  birthday: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  avatar_url: string | null;
  user_id: string | null;
  email: string | null;
  phone: string | null;
  custom_properties: Json | null;
  kanban_order: number | null;
  company_id: string | null;
  slug: string;
  address: Json | null;
  social_media: Json | null;
}

export interface Project {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  name: string;
  category: string | null;
  description: string | null;
  status: string | null;
  progress: number | null;
  budget: number | null;
  start_date: string | null;
  due_date: string | null;
  payment_status: string;
  created_by: string;
  origin_event_id: string | null;
  payment_due_date: string | null;
  slug: string;
  public: boolean | null;
  venue: string | null;
  kanban_order: number | null;
  position: number | null;
  payment_kanban_order: number | null;
  invoice_number: string | null;
  email_sending_date: string | null;
  hardcopy_sending_date: string | null;
  channel: string | null;
  po_number: string | null;
  paid_date: string | null;
  invoice_attachment_url: string | null;
  invoice_attachment_name: string | null;
  client_company_id: string | null;
  personal_for_user_id: string | null;
  payment_terms: Json | null;
  active_task_count: number;
  active_ticket_count: number;
  total_task_count: number;
}

export interface CustomProperty {
  id: string;
  name: string;
  label: string;
  type: string;
  options: Json | null;
  is_default: boolean | null;
  created_at: string | null;
  category: string;
}

export interface Expense {
  id: string;
  project_id: string;
  created_by: string | null;
  beneficiary: string;
  tf_amount: number;
  status_expense: string;
  due_date: string | null;
  account_bank: Json | null;
  remarks: string | null;
  created_at: string | null;
  updated_at: string | null;
  payment_terms: Json | null;
  bank_account_id: string | null;
  kanban_order: number | null;
  custom_properties: Json | null;
  purpose_payment: string | null;
  attachments_jsonb: Json | null;
  project_name: string;
  project_slug: string;
  project_owner: { id: string; name: string; avatar_url: string; initials: string } | null;
  pic: { id: string; name: string; avatar_url: string; initials: string; email: string } | null;
}

export interface BankAccount {
  id: string;
  owner_id: string;
  owner_type: 'person' | 'company';
  account_name: string;
  account_number: string;
  bank_name: string;
  swift_code: string | null;
  country: string | null;
  city: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
}