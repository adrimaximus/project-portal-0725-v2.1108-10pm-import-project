export type ProjectStatus = 'Requested' | 'In Progress' | 'On Track' | 'Off Track' | 'At Risk' | 'On Hold' | 'Completed' | 'Billed' | 'Done' | 'Cancelled';
export type PaymentStatus = 'Proposed' | 'Approved' | 'PO Created' | 'On Process' | 'Pending' | 'Paid' | 'Overdue' | 'Cancelled';

export interface User {
  id: string;
  name: string;
  avatar: string;
  initials: string;
  email?: string;
  role?: string;
}

export type AssignedUser = User;

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  assignedTo?: User[];
  originTicketId?: string;
}

export interface Comment {
  id: string;
  author: User;
  timestamp: string;
  text: string;
  isTicket?: boolean;
  ticketStatus?: 'Open' | 'Closed';
  attachment?: { name: string; url: string };
}

export interface ProjectFile {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    uploadedAt: string;
}

export type ActivityType = 
  | 'PROJECT_CREATED' | 'COMMENT_ADDED' | 'TASK_CREATED' | 'TASK_COMPLETED' 
  | 'TASK_DELETED' | 'TEAM_MEMBER_ADDED' | 'TEAM_MEMBER_REMOVED' 
  | 'PAYMENT_STATUS_UPDATED' | 'PROJECT_STATUS_UPDATED' | 'PROJECT_DETAILS_UPDATED' 
  | 'FILE_UPLOADED' | 'TICKET_CREATED' | 'TASK_REOPENED';

export interface Activity {
    id: string;
    user: User;
    type: ActivityType;
    details: {
        description: string;
        [key: string]: any;
    };
    timestamp: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category: string;
  status: ProjectStatus;
  paymentStatus: PaymentStatus;
  progress: number;
  budget?: number;
  startDate?: string;
  dueDate: string;
  assignedTo: User[];
  createdBy: User;
  tasks?: Task[];
  comments?: Comment[];
  briefFiles?: ProjectFile[];
  services?: string[];
  activities?: Activity[];
}

export const dummyUsers: User[] = [
  { id: 'user-1', name: 'Alex Doe', avatar: 'https://i.pravatar.cc/150?u=alex', initials: 'AD' },
  { id: 'user-2', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?u=jane', initials: 'JS' },
  { id: 'user-3', name: 'Sam Wilson', avatar: 'https://i.pravatar.cc/150?u=sam', initials: 'SW' },
  { id: 'user-4', name: 'Emily Brown', avatar: 'https://i.pravatar.cc/150?u=emily', initials: 'EB' },
];

export const dummyProjects: Project[] = [
    // ... existing dummy project data would be here, updated to match the new structure
];