import { User, dummyUsers } from './users';
import { Tag } from './tags';
import { dummyComments } from './comments';

export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'Completed' | 'Done' | 'Billed' | 'On Hold' | 'Cancelled' | 'In Progress' | 'Requested';
export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue' | 'Draft' | 'Proposed' | 'Approved' | 'PO Created' | 'On Process' | 'Cancelled';
export type ActivityType = 
  | 'comment' 
  | 'status_change' 
  | 'file_upload' 
  | 'assignment' 
  | 'ticket_created' 
  | 'ticket_resolved' 
  | 'payment_status_change' 
  | 'progress_update' 
  | 'budget_change' 
  | 'deadline_change' 
  | 'start_date_change' 
  | 'member_add' 
  | 'task_assign' 
  | 'commit';

export type AssignedUser = User;

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  assignedTo?: string[];
}

export interface Comment {
  id: string;
  user: User;
  text: string;
  timestamp: string;
  isTicket?: boolean;
}

export interface ProjectFile {
  name: string;
  size: number;
  url: string;
  type: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  user: User;
  timestamp: string;
  details: string;
  target?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  tags: Tag[];
  owner: User;
  team: User[];
  startDate: string;
  dueDate: string;
  status: ProjectStatus;
  category?: string;
  progress?: number;
  assignedTo?: AssignedUser[];
  budget?: number;
  paymentStatus?: PaymentStatus;
  deadline?: string;
  comments?: Comment[];
  tasks?: Task[];
  briefFiles?: ProjectFile[];
  services?: string[];
  activities?: Activity[];
  createdBy?: User;
}

export const dummyProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Website Redesign',
    description: 'A complete overhaul of the company website, focusing on improved UX and a modern tech stack.',
    tags: [{id: '1', name: 'Web', color: '#3B82F6'}],
    owner: dummyUsers[2],
    team: dummyUsers.slice(0, 3),
    startDate: '2024-01-15',
    dueDate: '2024-08-30',
    status: 'On Track',
    category: 'Marketing',
    progress: 75,
    assignedTo: dummyUsers.slice(0, 3),
    budget: 50000,
    paymentStatus: 'Pending',
    deadline: '2024-08-30',
    comments: dummyComments,
    tasks: [
      { id: 'task-1', title: 'Design mockups', completed: true, assignedTo: [dummyUsers[0].id] },
      { id: 'task-2', title: 'Develop homepage', completed: true, assignedTo: [dummyUsers[1].id] },
      { id: 'task-3', title: 'Develop product pages', completed: false, assignedTo: [dummyUsers[1].id] },
    ],
    briefFiles: [{ name: 'brief.pdf', size: 2500000, url: '#', type: 'application/pdf' }],
    services: ['Web Design', 'Development'],
    activities: [
      { id: 'act-1', type: 'comment', user: dummyUsers[0], timestamp: '2024-07-24T10:00:00Z', details: 'Posted a new comment.' },
      { id: 'act-2', type: 'status_change', user: dummyUsers[2], timestamp: '2024-07-23T15:30:00Z', details: 'Changed status to On Track.' },
    ],
    createdBy: dummyUsers[2],
  },
  {
    id: 'proj-2',
    name: 'Mobile App Development',
    description: 'A new cross-platform mobile app for iOS and Android to accompany our main service.',
    tags: [{id: '2', name: 'Mobile', color: '#10B981'}],
    owner: dummyUsers[1],
    team: [dummyUsers[1], dummyUsers[3]],
    startDate: '2024-03-01',
    dueDate: '2024-12-01',
    status: 'At Risk',
    category: 'Engineering',
    progress: 40,
    assignedTo: [dummyUsers[1], dummyUsers[3]],
    budget: 120000,
    paymentStatus: 'Paid',
    deadline: '2024-12-01',
    comments: [],
    tasks: [
      { id: 'task-4', title: 'Setup CI/CD pipeline', completed: true, assignedTo: [dummyUsers[1].id] },
      { id: 'task-5', title: 'Implement authentication', completed: false, assignedTo: [dummyUsers[1].id] },
    ],
    briefFiles: [],
    services: ['Mobile Development'],
    activities: [],
    createdBy: dummyUsers[1],
  }
];