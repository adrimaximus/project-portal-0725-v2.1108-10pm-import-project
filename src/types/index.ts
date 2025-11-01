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
  { value: 'In Process', label: 'In Process' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Partially Paid', label: 'Partially Paid' },
  { value: 'Paid', label: 'Paid' },
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