export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  initials: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  assignedTo?: string[];
}

export interface Comment {
  id: string;
  user: User;
  date: string;
  text: string;
  isTicket?: boolean;
  ticketStatus?: 'open' | 'in_progress' | 'closed';
  mentionedUsers?: string[];
  linkedProject?: string;
}

export interface Attachment {
    name: string;
    url: string;
}

export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'On Hold' | 'Completed' | 'Requested' | 'In Progress' | 'Done' | 'Billed' | 'Cancelled';

export interface Project {
  id:string;
  name: string;
  category: string;
  progress: number;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  createdBy: User;
  assignedTo: User[];
  description: string;
  tasks?: Task[];
  services: string[];
  attachments?: Attachment[];
  comments?: Comment[];
  budget?: number;
  deadline?: string;
  paymentStatus?: 'Paid' | 'Pending' | 'Overdue';
}

const alice: User = { id: 'user-1', name: 'Alice Johnson', email: 'alice@example.com', avatar: 'https://i.pravatar.cc/150?u=alice', initials: 'AJ' };
const bob: User = { id: 'user-2', name: 'Bob Williams', email: 'bob@example.com', avatar: 'https://i.pravatar.cc/150?u=bob', initials: 'BW' };
const charlie: User = { id: 'user-3', name: 'Charlie Brown', email: 'charlie@example.com', avatar: 'https://i.pravatar.cc/150?u=charlie', initials: 'CB' };
const david: User = { id: 'user-4', name: 'David Miller', email: 'david@example.com', avatar: 'https://i.pravatar.cc/150?u=david', initials: 'DM' };
const eva: User = { id: 'user-5', name: 'Eva Green', email: 'eva@example.com', avatar: 'https://i.pravatar.cc/150?u=eva', initials: 'EG' };


export const users: User[] = [
    alice,
    bob,
    charlie,
    david,
    eva
];

export const projects: Project[] = [
  {
    id: 'proj-1',
    name: 'E-commerce Platform',
    category: 'Web Development',
    progress: 75,
    status: 'On Track',
    startDate: '2023-01-15',
    endDate: '2023-09-30',
    budget: 50000,
    deadline: '2023-09-30',
    paymentStatus: 'Paid',
    createdBy: alice,
    assignedTo: [alice, bob],
    description: 'Developing a new e-commerce platform with modern features, including a seamless checkout process, product recommendation engine, and a comprehensive admin dashboard for managing inventory and orders.',
    services: ['React', 'Node.js', 'AWS'],
    attachments: [
        { name: 'project-brief.pdf', url: '#' },
        { name: 'design-mockups.zip', url: '#' }
    ],
    tasks: [
        { id: 'task-1', text: 'Setup project structure and CI/CD pipeline', completed: true, assignedTo: ['user-1'] },
        { id: 'task-2', text: 'Design database schema and set up database on RDS', completed: true, assignedTo: ['user-2'] },
        { id: 'task-3', text: 'Implement user authentication and authorization flow using JWT', completed: false, assignedTo: ['user-1', 'user-2'] },
        { id: 'task-4', text: 'Develop product catalog and search functionality', completed: false, assignedTo: ['user-2'] },
        { id: 'task-5', text: 'Build shopping cart and checkout process', completed: false, assignedTo: ['user-1'] },
    ],
    comments: [
        { id: 'comment-1', user: alice, date: '2023-08-10T10:00:00Z', text: 'Great progress on the auth flow!' },
        { id: 'comment-2', user: bob, date: '2023-08-11T14:20:00Z', text: 'Database schema is finalized and deployed.' }
    ]
  },
  {
    id: 'proj-2',
    name: 'Mobile Banking App',
    category: 'Mobile App',
    progress: 40,
    status: 'At Risk',
    startDate: '2023-03-01',
    endDate: '2023-11-30',
    budget: 75000,
    deadline: '2023-11-30',
    paymentStatus: 'Pending',
    createdBy: charlie,
    assignedTo: [charlie, david, eva],
    description: 'A native mobile application for iOS and Android that provides users with a secure and intuitive banking experience. Features include fund transfers, bill payments, and transaction history.',
    services: ['Swift', 'Kotlin', 'Firebase'],
    attachments: [],
    tasks: [
        { id: 'task-6', text: 'Finalize UI/UX designs for both platforms', completed: true, assignedTo: ['user-5'] },
        { id: 'task-7', text: 'Setup Firebase backend and authentication', completed: false, assignedTo: ['user-3'] },
        { id: 'task-8', text: 'Develop fund transfer module for iOS', completed: false, assignedTo: ['user-4'] },
    ],
    comments: [
        { id: 'comment-3', user: charlie, date: '2023-08-12T11:00:00Z', text: 'We need to accelerate the backend development to stay on track.', isTicket: true, ticketStatus: 'open' }
    ]
  },
  {
    id: 'proj-3',
    name: 'Cloud Migration',
    category: 'Infrastructure',
    progress: 95,
    status: 'Completed',
    startDate: '2023-02-01',
    endDate: '2023-07-31',
    budget: 30000,
    deadline: '2023-07-31',
    paymentStatus: 'Paid',
    createdBy: alice,
    assignedTo: [alice, david],
    description: 'Migrating a monolithic legacy application to a modern, cloud-native architecture on AWS. The project is currently on hold pending budget approval for Q3.',
    services: ['AWS', 'Docker', 'Kubernetes'],
    attachments: [
        { name: 'migration-plan.docx', url: '#' }
    ],
    tasks: [],
    comments: []
  }
];