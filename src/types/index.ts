export type PaymentStatus = 'Paid' | 'Unpaid' | 'Pending' | 'Overdue' | 'Cancelled' | 'In Process' | 'Due';

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  initials: string;
  role?: string;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
};

export type Project = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  description: string | null;
  status: string | null;
  progress: number | null;
  budget: number | null;
  start_date: string | null;
  due_date: string | null;
  payment_status: PaymentStatus | null;
  payment_due_date: string | null;
  origin_event_id: string | null;
  venue: string | null;
  created_by: UserProfile;
  assignedTo: UserProfile[];
  services: string[];
  tags: Tag[];
  kanban_order: number | null;
  payment_kanban_order: number | null;
  invoice_number: string | null;
  po_number: string | null;
  paid_date: string | null;
  email_sending_date: string | null;
  hardcopy_sending_date: string | null;
  channel: string | null;
};