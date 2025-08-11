export interface User {
  id: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  first_name?: string;
  last_name?: string;
  initials?: string;
}

export interface Service {
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  initials: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  assignedTo: UserProfile[];
}

export interface Comment {
  id: string;
  isTicket: boolean;
}

export interface Project {
  id: string;
  name: string;
  category: string;
  description:string;
  status: string;
  progress: number;
  budget: number;
  start_date: string;
  dueDate: string;
  paymentStatus: string;
  createdBy: UserProfile;
  assignedTo: UserProfile[];
  tasks: Task[];
  comments: Comment[];
}