import { User } from '@/contexts/UserContext';

export type ProjectStatus = 
  | 'On Track' 
  | 'At Risk' 
  | 'Off Track' 
  | 'On Hold' 
  | 'Completed'
  | 'Done'
  | 'Billed'
  | 'Cancelled'
  | 'In Progress'
  | 'Requested';

export type PaymentStatus = 
  | 'Unpaid' 
  | 'Partially Paid' 
  | 'Paid' 
  | 'Overdue'
  | 'Pending'
  | 'Approved'
  | 'PO Created'
  | 'On Process'
  | 'Cancelled'
  | 'Proposed';

export interface AssignedUser {
  id: string;
  name: string;
  avatar?: string; // Made optional to match User type
  initials?: string;
  role?: string;
  email?: string; // Added optional email to fix property access error
}

export interface Task {
  id: string;
  name: string;
  completed: boolean;
  assignedTo: string[];
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
  author: User;
  text: string;
  timestamp: string;
  isTicket: boolean;
  attachment?: { name: string; url: string; };
}

export type ActivityType = 
  | 'PROJECT_CREATED'
  | 'PROJECT_STATUS_UPDATED'
  | 'PAYMENT_STATUS_UPDATED'
  | 'PROJECT_DETAILS_UPDATED'
  | 'TEAM_MEMBER_ADDED'
  | 'TEAM_MEMBER_REMOVED'
  | 'FILE_UPLOADED'
  | 'TASK_CREATED'
  | 'TASK_COMPLETED'
  | 'TASK_DELETED'
  | 'COMMENT_ADDED'
  | 'TICKET_CREATED';

export interface Activity {
  id: string;
  type: ActivityType;
  timestamp: string; // ISO string
  user: {
    id: string;
    name: string;
  };
  details: {
    description: string;
  };
}

export interface Project {
  id:string;
  name: string;
  client: string;
  startDate: string;
  deadline: string;
  status: ProjectStatus;
  paymentStatus: PaymentStatus;
  progress: number;
  budget: number;
  description: string;
  assignedTo: AssignedUser[];
  briefFiles?: ProjectFile[];
  services: string[];
  tasks?: Task[];
  comments?: Comment[];
  activities?: Activity[];
  category: string;
  createdBy: AssignedUser;
}

export const dummyUsers: AssignedUser[] = [
  { id: 'user-1', name: 'Alice Johnson', email: 'alice.j@example.com', avatar: 'https://i.pravatar.cc/150?u=alice', initials: 'AJ', role: 'Project Manager' },
  { id: 'user-2', name: 'Michael Chen', email: 'michael.c@example.com', avatar: 'https://i.pravatar.cc/150?u=michael', initials: 'MC', role: 'Lead Developer' },
  { id: 'user-3', name: 'Samantha Bee', email: 'samantha.b@example.com', avatar: 'https://i.pravatar.cc/150?u=samantha', initials: 'SB', role: 'UI/UX Designer' },
  { id: 'user-4', name: 'David Wilson', email: 'david.w@example.com', avatar: 'https://i.pravatar.cc/150?u=david', initials: 'DW', role: 'Developer' },
];

export const dummyProjects: Project[] = [
  {
    id: 'proj-001',
    name: 'Website Redesign for Innovate Inc.',
    client: 'Innovate Inc.',
    startDate: '2024-05-01',
    deadline: '2024-08-30',
    status: 'On Track',
    paymentStatus: 'Partially Paid',
    progress: 75,
    budget: 50000,
    description: 'Complete overhaul of the corporate website to improve user experience and modernize the design. The project includes a new CMS, e-commerce integration, and a responsive layout for all devices.',
    assignedTo: [dummyUsers[0], dummyUsers[1]],
    briefFiles: [
      { name: 'Initial_Brief_v1.pdf', size: 1200000, type: 'application/pdf', url: '#' },
      { name: 'Brand_Guidelines.pdf', size: 850000, type: 'application/pdf', url: '#' },
    ],
    services: ['Web Design', 'Development', 'SEO'],
    tasks: [
      { id: 'task-1', name: 'Finalize design mockups', completed: true, assignedTo: ['user-1'] },
      { id: 'task-2', name: 'Develop front-end components', completed: true, assignedTo: ['user-2'] },
      { id: 'task-3', name: 'Integrate payment gateway', completed: false, assignedTo: ['user-2'] },
      { id: 'task-4', name: 'Setup staging server', completed: true, assignedTo: ['user-1', 'user-2'] },
    ],
    comments: [
      { id: 'comment-1', author: { id: 'user-1', name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin' }, text: 'Great progress on the API. Let\'s sync up about the payment gateway options tomorrow.', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), isTicket: true },
      { id: 'comment-2', author: { id: 'user-2', name: 'Michael Chen', email: 'michael@example.com', role: 'Member' }, text: 'Sounds good. I\'ve prepared a comparison of Stripe vs. Braintree.', timestamp: new Date(Date.now() - 86400000).toISOString(), isTicket: false },
    ],
    activities: [],
    category: 'Web Development',
    createdBy: dummyUsers[0],
  },
  {
    id: 'proj-002',
    name: 'Mobile App for "FitLife"',
    client: 'FitLife Tracker',
    startDate: '2024-06-15',
    deadline: '2024-12-01',
    status: 'At Risk',
    paymentStatus: 'Unpaid',
    progress: 20,
    budget: 75000,
    description: 'A new mobile application for iOS and Android that tracks fitness activities, diet, and provides personalized workout plans.',
    assignedTo: [dummyUsers[2], dummyUsers[3]],
    services: ['Mobile App Development', 'UI/UX Design'],
    tasks: [
      { id: 'task-5', name: 'User flow diagrams', completed: true, assignedTo: ['user-3'] },
      { id: 'task-6', name: 'Setup React Native environment', completed: false, assignedTo: ['user-4'] },
    ],
    comments: [],
    activities: [],
    category: 'Mobile Development',
    createdBy: dummyUsers[2],
  },
  {
    id: 'proj-003',
    name: 'SEO & Content Marketing Campaign',
    client: 'Global Exports Ltd.',
    startDate: '2024-07-01',
    deadline: '2024-10-31',
    status: 'On Hold',
    paymentStatus: 'Paid',
    progress: 10,
    budget: 25000,
    description: 'A comprehensive SEO and content marketing strategy to increase organic traffic and improve search engine rankings for key terms.',
    assignedTo: [dummyUsers[0], dummyUsers[2]],
    services: ['SEO', 'Content Marketing'],
    tasks: [],
    comments: [],
    activities: [],
    category: 'Marketing',
    createdBy: dummyUsers[0],
  },
];