export interface AssignedUser {
  id: string;
  name: string;
  avatar?: string;
  initials?: string;
  email?: string;
  role?: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  assignedTo?: string[];
  originTicketId?: string;
}

export interface ProjectFile {
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface Comment {
  id: string;
  projectId: string;
  user: AssignedUser;
  text: string;
  timestamp: string;
  isTicket: boolean;
  attachment?: {
    name: string;
    url: string;
  };
}

export interface Activity {
  id: string;
  user: AssignedUser;
  action: string;
  target: string;
  timestamp: string;
}

export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'On Hold' | 'Completed' | 'Requested' | 'Done' | 'Billed' | 'In Progress' | 'Cancelled';
export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Unpaid' | 'Overdue' | 'proposed' | 'approved' | 'po_created' | 'on_process' | 'pending' | 'cancelled' | 'paid';

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  paymentStatus: PaymentStatus;
  progress: number;
  deadline: string;
  paymentDueDate: string;
  startDate: string;
  budget: number;
  description: string;
  services: string[];
  createdBy: AssignedUser;
  assignedTo: AssignedUser[];
  briefFiles?: ProjectFile[];
  tasks?: Task[];
  comments?: Comment[];
  category?: string;
}

const users: AssignedUser[] = [
    { id: 'user-1', name: 'Alice', avatar: 'https://i.pravatar.cc/150?u=alice', initials: 'A', email: 'alice@example.com', role: 'Project Manager' },
    { id: 'user-2', name: 'Bob', avatar: 'https://i.pravatar.cc/150?u=bob', initials: 'B', email: 'bob@example.com', role: 'Developer' },
    { id: 'user-3', name: 'Charlie', avatar: 'https://i.pravatar.cc/150?u=charlie', initials: 'C', email: 'charlie@example.com', role: 'Designer' },
];

export const dummyProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'E-commerce Platform',
    status: 'On Track',
    paymentStatus: 'Partially Paid',
    progress: 65,
    deadline: '2024-10-15',
    paymentDueDate: '2024-08-30',
    startDate: '2024-05-01',
    budget: 50000,
    description: 'A full-featured e-commerce platform with a modern tech stack.',
    services: ['Web Development', 'UI/UX Design'],
    createdBy: users[0],
    assignedTo: users,
    category: 'Web Development',
    tasks: [
        { id: 'task-1', text: 'Design homepage mockups', completed: true, assignedTo: ['user-3'], originTicketId: 'comment-3' },
        { id: 'task-2', text: 'Setup database schema', completed: true, assignedTo: ['user-2'] },
        { id: 'task-3', text: 'Develop authentication flow', completed: false, assignedTo: ['user-2'] },
    ],
    comments: [],
  },
];