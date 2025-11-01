import { Database } from './supabase';

export type Project = Database['public']['Functions']['get_dashboard_projects']['Returns'][0];

export type ProjectStatus = "On Track" | "At Risk" | "Off Track" | "On Hold" | "Completed" | "Cancelled" | "Bid Lost";

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
    { value: 'On Track', label: 'On Track' },
    { value: 'At Risk', label: 'At Risk' },
    { value: 'Off Track', label: 'Off Track' },
    { value: 'On Hold', label: 'On Hold' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'Bid Lost', label: 'Bid Lost' },
];

export type PaymentStatus =
  | 'Requested'
  | 'Proposed'
  | 'Quo Approved'
  | 'Inv Approved'
  | 'In Process'
  | 'Pending'
  | 'Overdue'
  | 'Partially Paid'
  | 'Paid'
  | 'Cancelled'
  | 'Bid Lost';

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'Requested', label: 'Requested' },
  { value: 'Proposed', label: 'Proposed' },
  { value: 'Quo Approved', label: 'Quo Approved' },
  { value: 'Inv Approved', label: 'Inv Approved' },
  { value: 'Pending', label: 'Pending' },
  { value: 'In Process', label: 'In Process' },
  { value: 'Partially Paid', label: 'Partially Paid' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export type TaskStatus = 'To do' | 'In Progress' | 'Done' | 'Blocked';

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
    { value: 'To do', label: 'To do' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Done', label: 'Done' },
    { value: 'Blocked', label: 'Blocked' },
];

export type TaskPriority = 'Urgent' | 'High' | 'Medium' | 'Normal' | 'Low';

export const TASK_PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
    { value: 'Urgent', label: 'Urgent' },
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Normal', label: 'Normal' },
    { value: 'Low', label: 'Low' },
];

export type Invoice = {
  id: string;
  projectId: string;
  rawProjectId: string;
  projectName: string;
  amount: number;
  dueDate: Date;
  status: PaymentStatus;
  projectStartDate: Date | null;
  projectEndDate: Date | null;
  poNumber: string | null;
  paidDate: Date | null;
  emailSendingDate: Date | null;
  hardcopySendingDate: Date | null;
  channel: string | null;
  clientName: string | null;
  clientAvatarUrl: string | null;
  clientLogo: string | null;
  clientCompanyName: string | null;
  projectOwner: Owner | null;
  assignedMembers: Member[];
  invoiceAttachments: Attachment[];
  payment_terms: any[];
};

export type Member = {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  initials: string;
  role: string;
};

export type Owner = {
  id: string;
  name: string;
  avatar_url: string;
  initials: string;
};

export type Attachment = {
  id: string;
  file_name: string;
  file_url: string;
  storage_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
};

export const CONTACT_PROPERTY_TYPES = [
  'text', 'textarea', 'number', 'date', 'email', 'phone', 'url', 'image', 'multi-image', 'select', 'multi-select', 'checkbox'
] as const;

export type ContactProperty = {
  id: string;
  name: string;
  label: string;
  type: (typeof CONTACT_PROPERTY_TYPES)[number];
  options?: string[] | null;
  is_default?: boolean;
};

export const COMPANY_PROPERTY_TYPES = [
  'text', 'textarea', 'number', 'date', 'email', 'phone', 'url', 'image', 'select'
] as const;

export type CompanyProperty = {
  id: string;
  name: string;
  label: string;
  type: (typeof COMPANY_PROPERTY_TYPES)[number];
  options?: string[] | null;
  is_default?: boolean;
};

export type Company = {
  id: string;
  name: string;
  legal_name?: string | null;
  address?: string | null;
  billing_address?: string | null;
  logo_url?: string | null;
  created_at?: string;
  updated_at?: string;
  user_id?: string | null;
  custom_properties?: Record<string, any> | null;
};

export type Person = {
  id: string;
  full_name: string;
  contact?: {
    emails?: string[];
    phones?: string[];
  } | null;
  company?: string | null;
  job_title?: string | null;
  department?: string | null;
  social_media?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  } | null;
  birthday?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  projects?: { id: string; name: string; slug: string }[] | null;
  tags?: Tag[] | null;
  avatar_url?: string | null;
  user_id?: string | null;
  address?: any;
  email?: string | null;
  phone?: string | null;
  company_id?: string | null;
  slug?: string;
  kanban_order?: number;
  custom_properties?: Record<string, any> | null;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
  user_id?: string | null;
  isNew?: boolean;
  type?: string;
  lead_time?: number | null;
};