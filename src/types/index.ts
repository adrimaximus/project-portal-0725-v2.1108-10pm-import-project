export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  initials: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
  assignedTo: UserProfile[];
}

export interface ProjectComment {
  id: string;
  isTicket: boolean;
}

export interface ProjectMember extends UserProfile {
  role: 'owner' | 'member';
}

export interface Project {
  id: string;
  name: string;
  category: string;
  description: string;
  status: string;
  progress: number;
  budget: number;
  start_date: string;
  due_date: string;
  payment_status: string;
  created_by: UserProfile;
  assignedTo: ProjectMember[];
  tasks: ProjectTask[];
  comments: ProjectComment[];
}