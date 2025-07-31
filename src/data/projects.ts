import { Comment, initialComments } from './comments';

// Tipe User kanonis
export interface User {
  id: string;
  name: string;
  avatar: string;
  initials?: string;
  email?: string;
  role?: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  assignedTo?: string[];
  isFromTicket?: boolean;
}

export interface ProjectFile {
  name:string;
  size: number;
  type: string;
  url: string;
}

export interface Activity {
  id: string;
  user: User;
  action: string;
  timestamp: string;
  target?: string;
}

export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'On Hold' | 'Completed' | 'Requested' | 'In Progress' | 'Cancelled' | 'Billed' | 'Done';
export type PaymentStatus = 'Paid' | 'Unpaid' | 'Overdue' | 'Pending' | 'Proposed' | 'Approved' | 'PO Created' | 'Cancelled' | 'On Process';


export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  deadline: string;
  startDate: string;
  budget: number;
  services: string[];
  paymentStatus: PaymentStatus;
  paymentDueDate: string;
  progress: number;
  description: string;
  files: ProjectFile[]; // Diganti nama dari briefFiles
  assignedTo: User[];
  createdBy: User;
  tasks?: Task[];
  comments?: Comment[];
  category?: string;
  tickets?: number;
  activity?: Activity[];
}

const userAlice: User = { id: 'user-1', name: 'Alice', avatar: 'https://i.pravatar.cc/150?u=alice', initials: 'A', email: 'alice@example.com', role: 'Designer' };
const userBob: User = { id: 'user-2', name: 'Bob', avatar: 'https://i.pravatar.cc/150?u=bob', initials: 'B', email: 'bob@example.com', role: 'Developer' };
const userCharlie: User = { id: 'user-3', name: 'Charlie', avatar: 'https://i.pravatar.cc/150?u=charlie', initials: 'C', email: 'charlie@example.com', role: 'Project Manager' };
const userDavid: User = { id: 'user-4', name: 'David', avatar: 'https://i.pravatar.cc/150?u=david', initials: 'D', email: 'david@example.com', role: 'UX Specialist' };

export const allUsers: User[] = [userAlice, userBob, userCharlie, userDavid];

export const dummyProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Website Redesign',
    status: 'On Track',
    deadline: '2024-09-15',
    startDate: '2024-06-01',
    budget: 25000,
    services: ['Web Design', 'Web Development', 'SEO'],
    paymentStatus: 'Paid',
    paymentDueDate: '2024-07-01',
    progress: 75,
    description: 'Complete redesign of the corporate website to improve user experience and mobile responsiveness. The project includes a new visual identity, migration to a new CMS, and initial SEO setup.',
    files: [
      { name: 'Creative-Brief.pdf', size: 2400000, type: 'application/pdf', url: '#' },
      { name: 'Brand-Guidelines.pdf', size: 1200000, type: 'application/pdf', url: '#' },
      { name: 'Wireframes-v1.fig', size: 5600000, type: 'application/figma', url: '#' },
    ],
    assignedTo: [userAlice, userBob],
    createdBy: userCharlie,
    tasks: [
      { id: 'task-1-1', text: 'Finalize wireframes and mockups', completed: true, assignedTo: ['user-1'] },
      { id: 'task-1-2', text: 'Develop front-end components', completed: true, assignedTo: ['user-2'] },
      { id: 'task-1-3', text: 'Set up CMS and backend integration', completed: true, assignedTo: ['user-2'] },
      { id: 'task-1-4', text: 'Perform initial SEO audit and keyword research', completed: false, assignedTo: ['user-1'] },
      { id: 'task-1-5', text: 'User acceptance testing', completed: false, assignedTo: ['user-1', 'user-3'] },
    ],
    comments: initialComments.filter(c => c.projectId === 'proj-1'),
    category: 'Web Development',
    tickets: 1,
    activity: [
        { id: 'act-1', user: userAlice, action: 'commented on', target: 'Wireframes', timestamp: '2024-08-15T10:30:00Z' },
        { id: 'act-2', user: userCharlie, action: 'created a ticket', target: 'Brand Guidelines', timestamp: '2024-08-15T11:00:00Z' },
    ]
  },
  {
    id: 'proj-2',
    name: 'Mobile App Development',
    status: 'At Risk',
    deadline: '2024-11-30',
    startDate: '2024-07-10',
    budget: 45000,
    services: ['Mobile App Development', 'UI/UX Design'],
    paymentStatus: 'Unpaid',
    paymentDueDate: '2024-08-10',
    progress: 30,
    description: 'Development of a new cross-platform mobile application for iOS and Android. The main feature is real-time data synchronization and offline capabilities. The project is currently facing delays due to unforeseen technical challenges with the database synchronization.',
    files: [
      { name: 'Project-Specification.docx', size: 850000, type: 'application/msword', url: '#' },
      { name: 'User-Flows.pdf', size: 3200000, type: 'application/pdf', url: '#' },
    ],
    assignedTo: [userBob, userDavid],
    createdBy: userAlice,
    tasks: [
      { id: 'task-2-1', text: 'Design UI/UX for all screens', completed: true, assignedTo: ['user-4'] },
      { id: 'task-2-2', text: 'Set up development environment', completed: true, assignedTo: ['user-2'] },
      { id: 'task-2-3', text: 'Implement user authentication', completed: false, assignedTo: ['user-2'] },
      { id: 'task-2-4', text: 'Develop core real-time sync feature', completed: false, assignedTo: ['user-2', 'user-4'] },
    ],
    comments: initialComments.filter(c => c.projectId === 'proj-2'),
    category: 'Mobile Development',
    tickets: 1,
  },
  {
    id: 'proj-3',
    name: 'Marketing Campaign',
    status: 'Completed',
    deadline: '2024-05-31',
    startDate: '2024-03-01',
    budget: 15000,
    services: ['Social Media', 'Content Creation'],
    paymentStatus: 'Paid',
    paymentDueDate: '2024-04-01',
    progress: 100,
    description: 'A 3-month digital marketing campaign to promote the new product launch. The campaign involved content creation for blog and social media, influencer outreach, and paid advertising on major platforms.',
    files: [
      { name: 'Campaign-Strategy.pdf', size: 1500000, type: 'application/pdf', url: '#' },
    ],
    assignedTo: [userAlice, userCharlie],
    createdBy: userDavid,
    tasks: [
      { id: 'task-3-1', text: 'Create content calendar', completed: true, assignedTo: ['user-1'] },
      { id: 'task-3-2', text: 'Launch social media ads', completed: true, assignedTo: ['user-3'] },
      { id: 'task-3-3', text: 'Publish weekly blog posts', completed: true, assignedTo: ['user-1'] },
      { id: 'task-3-4', text: 'Final campaign report', completed: true, assignedTo: ['user-3'] },
    ],
    comments: initialComments.filter(c => c.projectId === 'proj-3'),
    category: 'Marketing',
    tickets: 0,
  },
  {
    id: 'proj-4',
    name: 'E-commerce Platform',
    status: 'On Hold',
    deadline: '2025-01-20',
    startDate: '2024-08-01',
    budget: 70000,
    services: ['Web Development', 'Payment Integration'],
    paymentStatus: 'Pending',
    paymentDueDate: '2024-09-01',
    progress: 15,
    description: 'Building a full-featured e-commerce platform from scratch. The project is currently on hold pending client-side decisions on payment gateway providers.',
    files: [],
    assignedTo: [userDavid, userBob],
    createdBy: userAlice,
    tasks: [
      { id: 'task-4-1', text: 'Initial project setup and architecture', completed: true, assignedTo: ['user-2', 'user-4'] },
      { id: 'task-4-2', text: 'Database schema design', completed: false, assignedTo: ['user-4'] },
    ],
    comments: initialComments.filter(c => c.projectId === 'proj-4'),
    category: 'Web Development',
    tickets: 0,
  },
  {
    id: 'proj-5',
    name: 'Data Analytics Dashboard',
    status: 'Off Track',
    deadline: '2024-10-10',
    startDate: '2024-07-15',
    budget: 35000,
    services: ['Data Visualization', 'BI'],
    paymentStatus: 'Overdue',
    paymentDueDate: '2024-08-15',
    progress: 40,
    description: 'Creating a business intelligence dashboard to visualize sales data. The project is off track due to issues with data source integration and data cleaning processes.',
    files: [
      { name: 'Data-Sources.xlsx', size: 500000, type: 'application/vnd.ms-excel', url: '#' },
    ],
    assignedTo: [userCharlie, userDavid],
    createdBy: userBob,
    tasks: [
      { id: 'task-5-1', text: 'Connect to sales database', completed: true, assignedTo: ['user-3'] },
      { id: 'task-5-2', text: 'Develop data cleaning scripts', completed: false, assignedTo: ['user-3'] },
      { id: 'task-5-3', text: 'Design dashboard layout', completed: true, assignedTo: ['user-4'] },
      { id: 'task-5-4', text: 'Build interactive charts', completed: false, assignedTo: ['user-4'] },
    ],
    comments: initialComments.filter(c => c.projectId === 'proj-5'),
    category: 'Data Science',
    tickets: 0,
  },
];