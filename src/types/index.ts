export type PaymentStatus = "Proposed" | "Invoiced" | "Paid" | "Cancelled" | "Overdue";

export const PAYMENT_STATUS_OPTIONS: { label: string; value: PaymentStatus }[] = [
  { label: "Proposed", value: "Proposed" },
  { label: "Invoiced", value: "Invoiced" },
  { label: "Paid", value: "Paid" },
  { label: "Cancelled", value: "Cancelled" },
];

export type ProjectStatus = 
  | "Requested"
  | "On Hold"
  | "Reschedule"
  | "In Progress"
  | "Billing Process"
  | "Completed"
  | "Cancelled"
  | "Bid Lost"
  | "Archived"
  | "On Track"
  | "Planning"
  | "Pending";

export const PROJECT_STATUS_OPTIONS: { label: string; value: ProjectStatus }[] = [
  { label: "Requested", value: "Requested" },
  { label: "On Hold", value: "On Hold" },
  { label: "Reschedule", value: "Reschedule" },
  { label: "In Progress", value: "In Progress" },
  { label: "Billing Process", value: "Billing Process" },
  { label: "Completed", value: "Completed" },
  { label: "Cancelled", value: "Cancelled" },
  { label: "Bid Lost", value: "Bid Lost" },
  { label: "Archived", value: "Archived" },
  { label: "On Track", value: "On Track" },
  { label: "Planning", value: "Planning" },
  { label: "Pending", value: "Pending" },
];

export type Invoice = {
  id: string;
  project_id: string;
  project_name: string;
  project_slug: string;
  amount: number;
  invoice_number: string | null;
  payment_status: PaymentStatus;
  payment_due_date: string | null;
  client_company_name: string | null;
  project_start_date: string | null;
  project_end_date: string | null;
  paid_date: string | null;
  email_sending_date: string | null;
  hardcopy_sending_date: string | null;
  channel: string | null;
  client_company_id: string | null;
  client_company_logo_url: string | null;
  project_owner: any;
  assigned_members: any[];
  invoice_attachments: any[];
  payment_terms: any;
};