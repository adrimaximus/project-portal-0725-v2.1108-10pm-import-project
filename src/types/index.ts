// This file contains various type definitions used throughout the application.
// We are removing the hardcoded PAYMENT_STATUS_OPTIONS and making PaymentStatus a generic string.

export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'On Hold' | 'Completed' | 'Cancelled' | 'Bid Lost' | 'In Development' | 'Proposed';

export const PROJECT_STATUS_OPTIONS = [
  { value: 'Proposed', label: 'Proposed' },
  { value: 'In Development', label: 'In Development' },
  { value: 'On Track', label: 'On Track' },
  { value: 'At Risk', label: 'At Risk' },
  { value: 'Off Track', label: 'Off Track' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Bid Lost', label: 'Bid Lost' },
];

export type PaymentStatus = string;

export interface PaymentStatusDefinition {
  id: string;
  name: string;
  color: string;
  position: number;
}

export interface Person {
  id: string;
  full_name: string;
  company?: string | null;
  [key: string]: any;
}

export interface Company {
  id: string;
  name: string;
  [key: string]: any;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  payment_status: PaymentStatus;
  budget?: number | null;
  start_date?: string | null;
  due_date?: string | null;
  payment_due_date?: string | null;
  venue?: string | null;
  services?: string[] | null;
  client_name?: string | null;
  client_company_name?: string | null;
  client_avatar_url?: string | null;
  client_company_logo_url?: string | null;
  person_ids?: string[] | null;
  client_company_id?: string | null;
  [key: string]: any;
}