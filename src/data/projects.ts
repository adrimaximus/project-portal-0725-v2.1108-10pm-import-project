export interface User {
  id: string;
  name: string;
  avatar: string;
  initials: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  assignedTo?: User[];
}

export interface Comment {
  id: string;
  author: User;
  timestamp: string;
  content: string;
  isTicket?: boolean;
  ticketStatus?: 'Open' | 'Closed';
}

export interface Project {
  id: string;
  name: string;
  status: 'On Track' | 'Off Track' | 'At Risk' | 'On Hold' | 'Completed';
  paymentStatus: 'Paid' | 'Pending' | 'Overdue';
  progress: number;
  budget?: number;
  startDate?: string;
  dueDate?: string;
  assignedTo: User[];
  tasks?: Task[];
  comments?: Comment[];
}

export const dummyUsers: User[] = [
  { id: 'user-1', name: 'Alex Doe', avatar: 'https://i.pravatar.cc/150?u=alex', initials: 'AD' },
  { id: 'user-2', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?u=jane', initials: 'JS' },
  { id: 'user-3', name: 'Sam Wilson', avatar: 'https://i.pravatar.cc/150?u=sam', initials: 'SW' },
  { id: 'user-4', name: 'Emily Brown', avatar: 'https://i.pravatar.cc/150?u=emily', initials: 'EB' },
];

export const dummyProjects: Project[] = [
    // ... data proyek tiruan yang ada tetap di sini
];