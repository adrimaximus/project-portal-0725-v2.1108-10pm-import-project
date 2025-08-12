export type ProjectStatus = 'Requested' | 'In Progress' | 'In Review' | 'On Hold' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Proposed' | 'Pending' | 'Paid' | 'Overdue' | 'Cancelled';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  initials: string;
  role?: 'owner' | 'member';
  first_name?: string;
  last_name?: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
  originTicketId?: string;
  assignedTo: UserProfile[];
}

export interface ProjectComment {
  id: string;
  text: string;
  timestamp: string;
  isTicket: boolean;
  attachment_url?: string;
  attachment_name?: string;
  author: UserProfile;
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

export interface Project {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  startDate: string;
  dueDate: string;
  paymentStatus: PaymentStatus;
  paymentDueDate?: string;
  createdBy: UserProfile;
  assignedTo: UserProfile[];
  tasks: ProjectTask[];
  comments: ProjectComment[];
  services: string[];
  briefFiles: BriefFile[];
}