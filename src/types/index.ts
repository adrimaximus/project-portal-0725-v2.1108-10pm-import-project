interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  initials: string;
  role?: string;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  assignedTo: UserProfile[];
}

interface Comment {
    id: string;
    isTicket: boolean;
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
  assignedTo: UserProfile[];
  tasks: Task[];
  comments: Comment[];
}