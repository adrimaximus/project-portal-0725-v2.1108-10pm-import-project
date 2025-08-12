// Enums for status values
export enum ProjectStatus {
  OnHold = "On Hold",
  InProgress = "In Progress",
  Completed = "Completed",
  Canceled = "Canceled",
}

export enum PaymentStatus {
  Paid = "Paid",
  Pending = "Pending",
  Overdue = "Overdue",
  Draft = "Draft",
}

// User/Profile types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
}

export interface AssignedUser extends UserProfile {
  role?: string;
}

// File and Attachment types
export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  storage_path: string;
  created_at: string;
}

// Core data structures
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  assignedTo: UserProfile[];
  originTicketId?: string;
}

export interface Comment {
  id: string;
  author: UserProfile;
  text: string;
  timestamp: string; // ISO string
  isTicket: boolean;
  attachment_name?: string;
  attachment_url?: string;
}

export interface Activity {
  id: string;
  user: UserProfile;
  type: string;
  timestamp: string; // ISO string
  details?: {
    description: string;
  };
}

// The main Project interface
export interface Project {
  id: string;
  name: string;
  category: string;
  description: string;
  status: ProjectStatus | string;
  progress: number;
  budget: number;
  startDate: string; // ISO string
  dueDate: string; // ISO string
  paymentStatus: PaymentStatus | string;
  paymentDueDate?: string;
  createdBy: UserProfile;
  assignedTo: AssignedUser[];
  tasks: Task[];
  comments: Comment[];
  services?: string[];
  briefFiles?: ProjectFile[];
  activities?: Activity[];
}

// For components that need it
export type User = UserProfile;

// Dummy data for components that need it
export const dummyProjects: Project[] = [];