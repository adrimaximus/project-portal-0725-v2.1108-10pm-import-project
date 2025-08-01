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

export interface Service {
  id: string;
  name: string;
  description: string;
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
  { id: 'user-1', name: 'Alice', avatar: '/avatars/01.png', initials: 'A', email: 'alice@example.com', role: 'Project Manager' },
  { id: 'user-2', name: 'Bob', avatar: '/avatars/02.png', initials: 'B', email: 'bob@example.com', role: 'Developer' },
  { id: 'user-3', name: 'Charlie', avatar: '/avatars/03.png', initials: 'C', email: 'charlie@example.com', role: 'Designer' },
  { id: 'user-4', name: 'David', avatar: '/avatars/04.png', initials: 'D', email: 'david@example.com', role: 'Developer' },
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
    assignedTo: [users[0], users[1], users[2]],
    category: 'Web Development',
    tasks: [
      { id: 'task-1', text: 'Design homepage mockups', completed: true, assignedTo: ['user-3'], originTicketId: 'comment-3' },
      { id: 'task-2', text: 'Setup database schema', completed: true, assignedTo: ['user-2'] },
      { id: 'task-3', text: 'Develop authentication flow', completed: false, assignedTo: ['user-2', 'user-4'] },
    ],
    comments: [],
  },
  {
    id: 'proj-2',
    name: 'Mobile Banking App',
    status: 'At Risk',
    paymentStatus: 'Unpaid',
    progress: 30,
    deadline: '2024-12-20',
    paymentDueDate: '2024-09-15',
    startDate: '2024-07-01',
    budget: 75000,
    description: 'A secure and user-friendly mobile banking application for iOS and Android.',
    services: ['Mobile Development', 'API Integration'],
    createdBy: users[1],
    assignedTo: [users[1], users[3]],
    category: 'Mobile App',
    tasks: [
      { id: 'task-4', text: 'API integration for transactions', completed: false, assignedTo: ['user-4'] },
    ],
    comments: [],
  },
];