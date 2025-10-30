export const PROJECT_STATUS_OPTIONS = [
  { value: 'Not Started', label: 'Not Started' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'On Track', label: 'On Track' },
  { value: 'At Risk', label: 'At Risk' },
  { value: 'Off Track', label: 'Off Track' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export type PaymentStatus = 'Paid' | 'Unpaid' | 'Pending' | 'In Process' | 'Overdue' | 'Cancelled';

export interface Reaction {
  id: string;
  emoji: string;
  user_id: string;
  user_name: string;
}

export interface BriefFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  storage_path: string;
  created_at: string;
}

export interface Activity {
  id: string;
  type: string;
  details: {
    description: string;
  };
  timestamp: string;
  user: {
    id: string;
    name: string;
    avatar_url: string;
    initials: string;
  };
}

export interface Member {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  initials: string;
  role: string;
}

export interface Owner {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  initials: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  originTicketId?: string;
  assignedTo: Member[];
}

export interface Comment {
  id: string;
  text: string;
  timestamp: string;
  isTicket: boolean;
  author: {
    id: string;
    name: string;
    avatar_url: string;
    initials: string;
  };
  reactions: Reaction[];
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: string;
  category: string;
  budget: number;
  start_date: string | null;
  due_date: string | null;
  payment_status: string;
  payment_due_date: string | null;
  created_by: Owner;
  assignedTo: Member[];
  tasks: Task[];
  comments: Comment[];
  services: string[];
  briefFiles: BriefFile[];
  activities: Activity[];
  tags: { id: string; name: string; color: string }[];
  reactions: Reaction[];
  client_name?: string;
  client_avatar_url?: string;
  client_company_logo_url?: string;
  client_company_name?: string;
  invoice_number?: string;
  po_number?: string;
  paid_date?: string;
  email_sending_date?: string;
  hardcopy_sending_date?: string;
  channel?: string;
  invoice_attachments?: any[];
  payment_terms?: any[];
}

export interface Invoice {
  id: string;
  projectId: string;
  projectName: string;
  amount: number;
  dueDate: Date;
  status: PaymentStatus;
  rawProjectId: string;
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
  invoiceAttachments: any[];
  payment_terms: any[];
}