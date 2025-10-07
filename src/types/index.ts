export type PaymentStatus = 'Paid' | 'Unpaid' | 'Pending' | 'Overdue' | 'Cancelled' | 'In Process' | 'Due';

export type User = {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  initials: string;
  role?: 'admin' | 'member' | 'owner' | 'editor';
};

export type Tag = {
  id: string;
  name: string;
  color: string;
  isNew?: boolean;
};

export type Service = string;

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  originTicketId: string | null;
  assignedTo: User[];
  createdBy: User;
};

export type Comment = {
  id: string;
  text: string;
  timestamp: string;
  isTicket: boolean;
  attachment_url: string | null;
  attachment_name: string | null;
  author: User;
};

export type BriefFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  storage_path: string;
  created_at: string;
};

export type Activity = {
  id: string;
  type: string;
  details: {
    description: string;
  };
  timestamp: string;
  user: User;
};

export type Project = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  description: string | null;
  status: string;
  progress: number;
  budget: number | null;
  start_date: string | null;
  due_date: string | null;
  payment_status: PaymentStatus;
  payment_due_date: string | null;
  origin_event_id: string | null;
  venue: string | null;
  created_by: User;
  assignedTo: User[];
  tasks: Task[];
  comments: Comment[];
  services: Service[];
  briefFiles: BriefFile[];
  activities: Activity[];
  tags: Tag[];
  person_ids?: string[]; // Used for mutation
  invoice_number?: string | null;
  po_number?: string | null;
  paid_date?: string | null;
  email_sending_date?: string | null;
  hardcopy_sending_date?: string | null;
  channel?: string | null;
  invoice_attachment_url?: string | null;
  invoice_attachment_name?: string | null;
};

export type Invoice = {
  id: string;
  projectName: string;
  clientName: string;
  clientCompany: string;
  amount: number;
  status: PaymentStatus;
  dueDate: Date;
  rawProjectId: string;
  assignedMembers: User[];
};