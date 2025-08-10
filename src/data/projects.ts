import { User } from '@/types';
import { comments as dummyComments } from './comments';
import { dummyActivities } from './activity';

export type { User };
export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'On Hold' | 'Completed' | 'In Progress' | 'Requested' | 'Done' | 'Cancelled' | 'Billed';
export type PaymentStatus = 'Proposed' | 'Approved' | 'PO Created' | 'On Process' | 'Pending' | 'Paid' | 'Cancelled' | 'Overdue';

export const dummyUsers: User[] = [
    { id: 'user-0', name: 'Adri Maximus', email: 'adri@example.com', avatar: 'https://i.pravatar.cc/150?u=adri', initials: 'AM', first_name: 'Adri', last_name: 'Maximus' },
    { id: 'user-1', name: 'Alice Johnson', email: 'alice@example.com', avatar: 'https://i.pravatar.cc/150?u=alice', initials: 'AJ', first_name: 'Alice', last_name: 'Johnson' },
    { id: 'user-2', name: 'Michael Chen', email: 'michael@example.com', avatar: 'https://i.pravatar.cc/150?u=michael', initials: 'MC', first_name: 'Michael', last_name: 'Chen' },
    { id: 'user-3', name: 'Samantha Bee', email: 'samantha@example.com', avatar: 'https://i.pravatar.cc/150?u=samantha', initials: 'SB', first_name: 'Samantha', last_name: 'Bee' },
    { id: 'user-4', name: 'David Kim', email: 'david@example.com', avatar: 'https://i.pravatar.cc/150?u=david', initials: 'DK', first_name: 'David', last_name: 'Kim' },
];

export type AssignedUser = User;

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  assignedTo?: AssignedUser[];
  originTicketId?: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string | null;
  url: string;
  storagePath: string;
  uploadedAt: string;
}

export interface Comment {
  id: string;
  author: AssignedUser;
  timestamp: string;
  text: string;
  isTicket?: boolean;
  attachment?: { name: string; url: string };
}

export type ActivityType =
  | 'PROJECT_CREATED'
  | 'COMMENT_ADDED'
  | 'TASK_CREATED'
  | 'TASK_COMPLETED'
  | 'TASK_DELETED'
  | 'TEAM_MEMBER_ADDED'
  | 'TEAM_MEMBER_REMOVED'
  | 'PAYMENT_STATUS_UPDATED'
  | 'PROJECT_STATUS_UPDATED'
  | 'PROJECT_DETAILS_UPDATED'
  | 'FILE_UPLOADED'
  | 'TICKET_CREATED'
  | 'TASK_REOPENED';

export interface Activity {
  id: string;
  user: AssignedUser;
  type: ActivityType;
  details: {
    description: string;
    [key: string]: any;
  };
  timestamp: string;
}

export interface Project {
  id: string;
  name: string;
  category: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  startDate: string;
  dueDate: string;
  paymentStatus: PaymentStatus;
  assignedTo: AssignedUser[];
  createdBy: AssignedUser | null;
  lastUpdated?: string;
  tasks?: Task[];
  comments?: Comment[];
  activities?: Activity[];
  briefFiles?: ProjectFile[];
  services?: string[];
  paymentDueDate?: string;
}

export const dummyProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'E-commerce Platform',
    category: 'Web Development',
    description: 'Build a new e-commerce platform from scratch.',
    status: 'In Progress',
    progress: 65,
    budget: 50000,
    startDate: '2024-05-01T00:00:00.000Z',
    dueDate: '2024-09-30T00:00:00.000Z',
    paymentStatus: 'Pending',
    paymentDueDate: '2024-10-14T00:00:00.000Z',
    createdBy: dummyUsers[0],
    assignedTo: [dummyUsers[0], dummyUsers[1], dummyUsers[2]],
    tasks: [
        { id: 'task-1', title: 'Setup project structure', completed: true, assignedTo: [dummyUsers[2]] },
        { id: 'task-2', title: 'Design homepage UI', completed: true, assignedTo: [dummyUsers[1]] },
        { id: 'task-3', title: 'Develop authentication module', completed: false, assignedTo: [dummyUsers[2]] },
    ],
    comments: dummyComments.map(c => ({...c, author: c.author as AssignedUser})),
    activities: dummyActivities.filter(a => a.projectId === 'PROJ-001').map(a => ({...a, user: a.user as AssignedUser, type: a.type as ActivityType, details: { description: a.title }})),
    briefFiles: [
        { id: 'file-1', name: 'Project Brief.pdf', size: 1200, type: 'application/pdf', url: '#', uploadedAt: '2024-05-01T00:00:00.000Z', storagePath: '' }
    ],
    services: ['Web Development', 'UI/UX Design']
  },
  {
    id: 'proj-2',
    name: 'Mobile App Redesign',
    category: 'Mobile Development',
    description: 'Redesign the existing mobile application for iOS and Android.',
    status: 'Completed',
    progress: 100,
    budget: 75000,
    startDate: '2024-03-15T00:00:00.000Z',
    dueDate: '2024-07-15T00:00:00.000Z',
    paymentStatus: 'Paid',
    createdBy: dummyUsers[3],
    assignedTo: [dummyUsers[1], dummyUsers[3], dummyUsers[4]],
    tasks: [],
    comments: [],
    activities: [],
    briefFiles: [],
    services: ['UI/UX Design', 'Mobile Development']
  },
  {
    id: 'proj-3',
    name: 'Q3 Marketing Campaign',
    category: 'Marketing',
    description: 'Plan and execute the marketing campaign for the third quarter.',
    status: 'On Hold',
    progress: 20,
    budget: 25000,
    startDate: '2024-07-01T00:00:00.000Z',
    dueDate: '2024-09-30T00:00:00.000Z',
    paymentStatus: 'Proposed',
    createdBy: dummyUsers[0],
    assignedTo: [dummyUsers[0], dummyUsers[4]],
    tasks: [],
    comments: [],
    activities: [],
    briefFiles: [],
    services: ['Digital Marketing']
  },
  {
    id: 'proj-4',
    name: 'Data Analytics Dashboard',
    category: 'Data Science',
    description: 'Develop a dashboard for visualizing key business metrics.',
    status: 'On Track',
    progress: 40,
    budget: 60000,
    startDate: '2024-06-10T00:00:00.000Z',
    dueDate: '2024-11-10T00:00:00.000Z',
    paymentStatus: 'Approved',
    createdBy: dummyUsers[1],
    assignedTo: [dummyUsers[1], dummyUsers[2]],
    tasks: [],
    comments: [],
    activities: [],
    briefFiles: [],
    services: ['Data Visualization']
  }
];