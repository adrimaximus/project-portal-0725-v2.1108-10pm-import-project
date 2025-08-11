import { User } from '@/types';
import { comments as dummyComments } from './comments';

export type ProjectStatus = 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | 'Canceled';
export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue' | 'Unpaid';

export interface AssignedUser extends User {
  role: 'owner' | 'member';
}

export interface Task {
  id: number;
  title: string;
  completed: boolean;
  assignedTo: User[];
}

export interface Comment {
  id: number;
  project_id: number;
  author: User;
  created_at: string;
  text: string;
  is_ticket: boolean;
  attachment_url?: string;
  attachment_name?: string;
}

export interface Project {
  id: number;
  name: string;
  category: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  startDate: string;
  dueDate: string;
  paymentStatus: PaymentStatus;
  createdBy: User;
  assignedTo: AssignedUser[];
  tasks: Task[];
  comments: Comment[];
}

export const dummyProjects: Project[] = [];