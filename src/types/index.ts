export type PaymentStatus = "Proposed" | "Invoiced" | "Paid" | "Cancelled" | "Overdue";

export const PAYMENT_STATUS_OPTIONS: { label: string; value: PaymentStatus }[] = [
  { label: "Proposed", value: "Proposed" },
  { label: "Invoiced", value: "Invoiced" },
  { label: "Paid", value: "Paid" },
  { label: "Cancelled", value: "Cancelled" },
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