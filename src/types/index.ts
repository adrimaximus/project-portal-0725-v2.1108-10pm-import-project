// General
export type ProjectStatus = 'Requested' | 'In Progress' | 'In Review' | 'On Hold' | 'Completed' | 'Cancelled' | 'On Track' | 'At Risk' | 'Off Track' | 'Archived' | 'Idea' | 'Done';
export type PaymentStatus = 'Paid' | 'Unpaid' | 'Pending' | 'Overdue' | 'Cancelled' | 'In Process' | 'Due' | 'Proposed';

export interface User {
  id: string;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  avatar_url: string | null;
  initials: string;
  role?: string;
  status?: string;
  people_kanban_settings?: any;
  updated_at?: string;
  permissions?: string[];
}

export type AssignedUser = User;

export type Member = {
  id: string;
  name: string;
  avatar_url: string | null;
  initials: string;
  email: string;
  role?: string; // Made optional to fix type conflict
};

export type Owner = {
  id: string;
  name: string;
  avatar_url: string | null;
  initials: string;
  email: string;
};

export interface InvoiceAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  storage_path: string;
  created_at: string;
  project_id: string;
  uploaded_by: string;
}

export type Invoice = {
  id: string;
  projectId: string; // slug
  projectName: string;
  amount: number;
  dueDate: Date; // Corrected type
  status: PaymentStatus;
  rawProjectId: string; // original uuid
  projectStartDate: Date | null; // Corrected type
  projectEndDate: Date | null; // Corrected type
  poNumber: string | null;
  paidDate: Date | null; // Corrected type
  emailSendingDate: Date | null; // Corrected type
  hardcopySendingDate: Date | null; // Corrected type
  channel: string | null;
  clientName: string | null;
  clientLogo: string | null;
  clientCompanyName: string | null;
  projectOwner: Owner | null;
  assignedMembers: Member[];
  invoiceAttachments: InvoiceAttachment[];
  clientCompanyCustomProperties?: { [key: string]: any } | null;
};

export interface ExtendedProject {
  id: string;
  slug: string;
  name: string;
  budget: number | null;
  payment_due_date: string | null;
  payment_status: PaymentStatus;
  invoice_number: string | null;
  start_date: string | null;
  due_date: string | null;
  po_number: string | null;
  paid_date: string | null;
  email_sending_date: string | null;
  hardcopy_sending_date: string | null;
  channel: string | null;
  client_name: string | null;
  client_company_logo_url: string | null;
  client_company_name: string | null;
  created_by: Owner | null;
  assignedTo: AssignedUser[];
  invoice_attachments: InvoiceAttachment[] | null;
  client_company_custom_properties: { [key: string]: any } | null;
}