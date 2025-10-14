export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  initials: string;
  role?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  // other task properties
}

export interface Activity {
  id: string;
  type: string;
  details: {
    description: string;
  };
  timestamp: string;
  user: User;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  // other project properties
  assignedTo: User[];
  tasks: Task[];
  activities: Activity[];
}