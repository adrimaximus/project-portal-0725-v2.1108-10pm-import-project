import { ProjectRole } from "@/types";
import { User, allUsers } from "./users";

export interface AssignedUser {
  id: string;
  name: string;
  avatar?: string;
  initials?: string;
  email?: string;
  role?: string;
}

export interface ProjectCollaborator {
  userId: string;
  role: ProjectRole;
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
  collaborators: ProjectCollaborator[];
  briefFiles?: ProjectFile[];
  tasks?: Task[];
  comments?: Comment[];
  category?: string;
}

const users: AssignedUser[] = allUsers.map(u => ({...u}));

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
    collaborators: [
      { userId: 'user-1', role: 'Project Owner' },
      { userId: 'user-2', role: 'Assignee' },
      { userId: 'user-3', role: 'Client' },
    ],
    category: 'Web Development',
    tasks: [
        { id: 'task-1', text: 'Design homepage mockups', completed: true, assignedTo: ['user-3'], originTicketId: 'comment-3' },
        { id: 'task-2', text: 'Setup database schema', completed: true, assignedTo: ['user-2'] },
        { id: 'task-3', text: 'Develop authentication flow', completed: false, assignedTo: ['user-2'] },
    ],
    comments: [],
  },
];