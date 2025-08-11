export type ProjectStatus =
  | "Requested"
  | "In Progress"
  | "Pending Review"
  | "Completed"
  | "On Hold"
  | "Cancelled";

export type PaymentStatus =
  | "Proposed"
  | "Pending"
  | "Paid"
  | "Overdue"
  | "Contested";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  initials: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  assignedTo: UserProfile[];
}

export interface Comment {
  id: string;
  is_ticket: boolean;
}

export interface Project {
  id: string;
  name: string;
  category: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  startDate: string;
  dueDate: string;
  paymentStatus: PaymentStatus;
  createdBy: UserProfile;
  assignedTo: UserProfile[];
  tasks: Task[];
  comments: Comment[];
  origin_event_id?: string;
}