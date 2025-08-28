import { User, AssignedUser } from './user';
import { Tag } from './goal';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  assignedTo: User[];
  originTicketId?: string;
  createdBy?: User;
}

export interface Comment {
  id: string;
  author: User;
  timestamp: string;
  text: string;
  isTicket: boolean;
  attachment_url?: string;
  attachment_name?: string;
}

export interface ProjectFile {
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
  user: User;
  details: { description: string };
  timestamp: string;
}

export type ProjectStatus = 'Requested' | 'In Progress' | 'In Review' | 'On Hold' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Unpaid' | 'Paid' | 'Pending' | 'In Process' | 'Overdue' | 'Proposed' | 'Cancelled';

export interface Project {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  start_date: string;
  due_date: string;
  payment_status: PaymentStatus;
  payment_due_date?: string;
  created_by: User;
  assignedTo: AssignedUser[];
  tasks: Task[];
  comments: Comment[];
  services: string[];
  briefFiles: ProjectFile[];
  activities?: Activity[];
  venue?: string;
  kanban_order?: number;
  tags: Tag[];
  origin_event_id?: string;
}

export const PROJECT_STATUS_OPTIONS = [
  { value: 'Requested', label: 'Requested' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'In Review', label: 'In Review' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'Unpaid', label: 'Unpaid' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Pending', label: 'Pending' },
  { value: 'In Process', label: 'In Process' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Proposed', label: 'Proposed' },
  { value: 'Cancelled', label: 'Cancelled' },
];