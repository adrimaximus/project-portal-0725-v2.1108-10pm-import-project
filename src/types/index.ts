export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Task {
  id: string;
  name: string;
  status: "To Do" | "In Progress" | "Done";
  assignedTo: User[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  assignedTo: User[];
  tasks: Task[];
}

export interface Activity {
  id: string;
  text: string;
  timestamp: string;
  user: User;
}