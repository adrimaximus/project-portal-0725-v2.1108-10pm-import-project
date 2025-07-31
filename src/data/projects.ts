import { allUsers, User } from './users';

export interface AssignedUser extends User {
  role: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'To Do' | 'In Progress' | 'Done';
  assignee?: User;
}

export interface BriefFile {
  id: string;
  name: string;
  url: string;
  size: string;
}

export interface Activity {
  id: string;
  user: User;
  action: string;
  timestamp: string;
  target?: string;
}

export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'Completed' | 'Done' | 'Billed' | 'In Progress' | 'On Hold' | 'Cancelled' | 'Requested';
export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue' | 'Draft';

export interface Project {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  progress: number;
  description: string;
  startDate: string;
  endDate: string;
  assigned: AssignedUser[];
  status: ProjectStatus;
  paymentStatus: PaymentStatus;
  budget: number;
  deadline: string;
  paymentDueDate?: string;
  rating: number;
  tickets: number;
  invoiceAttachmentUrl?: string;
  createdBy: User;
  briefFiles: BriefFile[];
  services: string[];
  tasks: Task[];
  activityFeed: Activity[];
}

export const dummyProjects: Project[] = [
    {
        id: 'proj-1',
        name: 'E-commerce Platform',
        imageUrl: '/placeholder.svg',
        category: 'Web Development',
        progress: 75,
        description: 'Developing a new e-commerce platform from scratch.',
        startDate: '2024-01-15',
        endDate: '2024-09-30',
        deadline: '2024-09-30',
        assigned: [
            { ...allUsers[0], role: 'Project Manager' },
            { ...allUsers[1], role: 'Lead Developer' },
            { ...allUsers[2], role: 'UI/UX Designer' },
        ],
        status: 'On Track',
        paymentStatus: 'Pending',
        budget: 50000,
        rating: 4,
        tickets: 5,
        createdBy: allUsers[0],
        briefFiles: [
            { id: 'f1', name: 'project-brief.pdf', url: '#', size: '2.5 MB' },
            { id: 'f2', name: 'wireframes.fig', url: '#', size: '10.1 MB' },
        ],
        services: ['UI/UX Design', 'Frontend Development', 'Backend Development'],
        tasks: [
            { id: 't1', title: 'Design landing page', status: 'Done', assignee: allUsers[2] },
            { id: 't2', title: 'Setup database schema', status: 'In Progress', assignee: allUsers[1] },
            { id: 't3', title: 'Develop authentication flow', status: 'To Do', assignee: allUsers[1] },
        ],
        activityFeed: [
            { id: 'a1', user: allUsers[1], action: 'completed task', target: 'Design landing page', timestamp: '2024-07-27T10:00:00Z' },
            { id: 'a2', user: allUsers[0], action: 'added a file', target: 'wireframes.fig', timestamp: '2024-07-26T15:30:00Z' },
        ]
    },
    {
        id: 'proj-2',
        name: 'Mobile App for iOS',
        imageUrl: '/placeholder.svg',
        category: 'Mobile Development',
        progress: 40,
        description: 'Creating a native iOS application for our new service.',
        startDate: '2024-03-01',
        endDate: '2024-11-20',
        deadline: '2024-11-20',
        assigned: [
            { ...allUsers[3], role: 'iOS Developer' },
            { ...allUsers[4], role: 'Backend Developer' },
        ],
        status: 'At Risk',
        paymentStatus: 'Paid',
        budget: 75000,
        rating: 3,
        tickets: 12,
        paymentDueDate: '2024-06-01',
        invoiceAttachmentUrl: '#',
        createdBy: allUsers[3],
        briefFiles: [],
        services: ['iOS Development', 'API Integration'],
        tasks: [
            { id: 't4', title: 'Implement push notifications', status: 'To Do', assignee: allUsers[3] },
        ],
        activityFeed: [
            { id: 'a3', user: allUsers[4], action: 'pushed new commits', timestamp: '2024-07-28T09:15:00Z' },
        ]
    },
    {
        id: 'proj-3',
        name: 'Data Analytics Dashboard',
        imageUrl: '/placeholder.svg',
        category: 'Data Science',
        progress: 90,
        description: 'Building a dashboard for visualizing key business metrics.',
        startDate: '2024-02-01',
        endDate: '2024-07-31',
        deadline: '2024-07-31',
        assigned: [
            { ...allUsers[1], role: 'Data Scientist' },
            { ...allUsers[4], role: 'Frontend Developer' },
        ],
        status: 'Completed',
        paymentStatus: 'Billed',
        budget: 30000,
        rating: 5,
        tickets: 2,
        createdBy: allUsers[1],
        briefFiles: [],
        services: ['Data Visualization', 'Dashboard Development'],
        tasks: [],
        activityFeed: []
    },
];