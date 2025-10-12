export type PaymentStatus = 'Proposed' | 'Unpaid' | 'Pending' | 'In Process' | 'Paid' | 'Overdue' | 'Cancelled';
export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'On Hold' | 'Completed' | 'Archived';

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
    { value: 'Proposed', label: 'Proposed' },
    { value: 'Unpaid', label: 'Unpaid' },
    { value: 'Pending', label: 'Pending' },
    { value: 'In Process', label: 'In Process' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Overdue', label: 'Overdue' },
    { value: 'Cancelled', label: 'Cancelled' },
];

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
    { value: 'On Track', label: 'On Track' },
    { value: 'At Risk', label: 'At Risk' },
    { value: 'Off Track', label: 'Off Track' },
    { value: 'On Hold', label: 'On Hold' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Archived', label: 'Archived' },
];

export interface Person {
    id: string;
    full_name: string;
    email?: string;
    company?: string;
    company_id?: string | null;
    avatar_url?: string;
}

export interface Task {
    id: string;
    title: string;
    completed: boolean;
}

export interface InvoiceAttachment {
  id: string;
  project_id: string;
  file_name: string;
  file_url: string;
  storage_path: string;
  created_at: string;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    start_date?: string;
    due_date?: string;
    status: ProjectStatus;
    payment_status: PaymentStatus;
    budget?: number;
    venue?: string;
    services?: string[];
    people?: Person[];
    person_ids?: string[];
    tasks?: Task[];
    payment_due_date?: string;
    invoice_number?: string;
    po_number?: string;
    paid_date?: string;
    email_sending_date?: string;
    hardcopy_sending_date?: string;
    channel?: string;
    invoice_attachments?: InvoiceAttachment[];
}