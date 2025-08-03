import { User as AssignedUser, allUsers } from './users';

export type { AssignedUser };

export interface Task {
  id: string;
  name: string;
  text?: string;
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
  user: AssignedUser;
  timestamp: string;
  text: string;
  attachment?: {
    name: string;
    url: string;
  };
  isTicket?: boolean;
}

export type ActivityType = 
  | 'comment'
  | 'ticket_created'
  | 'ticket_resolved'
  | 'status_change'
  | 'payment_status_change'
  | 'progress_update'
  | 'budget_change'
  | 'deadline_change'
  | 'start_date_change'
  | 'file_upload'
  | 'member_add'
  | 'task_assign'
  | 'commit';

export interface Activity {
  id: string;
  type: ActivityType;
  user: AssignedUser;
  timestamp: string;
  details: string;
  target?: string;
}

export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'Completed' | 'Requested' | 'In Progress' | 'On Hold' | 'Cancelled' | 'Done' | 'Billed';

export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue' | 'Proposed' | 'Approved' | 'PO Created' | 'On Process' | 'Cancelled';

export interface Project {
  id: string;
  name: string;
  category: string;
  description: string;
  startDate: string;
  deadline:string;
  budget: number;
  status: ProjectStatus;
  paymentStatus: PaymentStatus;
  progress: number;
  assignedTo: AssignedUser[];
  createdBy: AssignedUser;
  tasks: Task[];
  comments: Comment[];
  briefFiles: ProjectFile[];
  services: string[];
  activities: Activity[];
}

export const dummyProjects: Project[] = [
  {
    id: 'proj-001',
    name: 'E-commerce Platform',
    category: 'Web Development',
    description: 'A full-featured e-commerce platform with a custom CMS and payment integration. The project aims to deliver a seamless shopping experience for customers and an intuitive management interface for administrators.',
    startDate: '2024-05-01',
    deadline: '2024-10-31',
    budget: 75000,
    status: 'On Track',
    paymentStatus: 'Pending',
    progress: 65,
    createdBy: allUsers[0],
    assignedTo: [allUsers[0], allUsers[2], allUsers[4]],
    tasks: [
      { id: 't1-1', name: 'Setup project structure', completed: true, assignedTo: [allUsers[2].id] },
      { id: 't1-2', name: 'Design product pages', completed: true, assignedTo: [allUsers[1].id] },
      { id: 't1-3', name: 'Develop API for products', completed: false, assignedTo: [allUsers[2].id] },
      { id: 't1-4', name: 'Implement payment gateway', completed: false, assignedTo: [] },
    ],
    comments: [
      { id: 'c1-1', user: allUsers[0], timestamp: '2024-07-28T10:30:00Z', text: 'Great progress on the API. Let\'s sync up about the payment gateway options tomorrow.', isTicket: true },
      { id: 'c1-2', user: allUsers[2], timestamp: '2024-07-28T11:00:00Z', text: 'Sounds good. I\'ve prepared a comparison of Stripe vs. Braintree.', attachment: { name: 'Payment-Gateways.pdf', url: '#' } },
    ],
    briefFiles: [
      { name: 'Project-Brief.pdf', size: 1.2 * 1024 * 1024, type: 'application/pdf', url: '#' },
      { name: 'Wireframes.zip', size: 15.7 * 1024 * 1024, type: 'application/zip', url: '#' },
    ],
    services: ['Web Development', 'UI/UX Design', 'API Integration'],
    activities: [
        { id: 'a1-1', type: 'commit', user: allUsers[2], timestamp: '2024-07-29T14:00:00Z', details: 'to `feature/product-api`', target: 'Git Repository' },
        { id: 'a1-2', type: 'file_upload', user: allUsers[1], timestamp: '2024-07-29T11:20:00Z', details: '`Homepage_Mockup_v3.png`', target: 'Project Files' },
        { id: 'a1-3', type: 'status_change', user: allUsers[0], timestamp: '2024-07-28T16:45:00Z', details: "from 'At Risk' to 'On Track'", target: 'Project Status' },
        { id: 'a1-4', type: 'ticket_created', user: allUsers[0], timestamp: '2024-07-28T10:30:00Z', details: 'Great progress on the API. Let\'s sync up about the payment gateway options tomorrow.', target: 'Ticket C1-1' },
        { id: 'a1-5', type: 'comment', user: allUsers[2], timestamp: '2024-07-28T11:00:00Z', details: 'Sounds good. I\'ve prepared a comparison of Stripe vs. Braintree.', target: 'Ticket C1-1' },
        { id: 'a1-6', type: 'member_add', user: allUsers[0], timestamp: '2024-07-27T09:00:00Z', details: 'Added David Wilson to the project.', target: 'Team' },
    ]
  },
  {
    id: 'proj-002',
    name: 'Mobile App Redesign',
    category: 'Mobile Design',
    description: 'Redesign of the existing native mobile app to improve user experience and modernize the interface. Focus on user research and A/B testing.',
    startDate: '2024-06-15',
    deadline: '2024-11-20',
    budget: 45000,
    status: 'At Risk',
    paymentStatus: 'Paid',
    progress: 30,
    createdBy: allUsers[1],
    assignedTo: [allUsers[1], allUsers[3]],
    tasks: [
      { id: 't2-1', name: 'Conduct user interviews', completed: true, assignedTo: [allUsers[3].id] },
      { id: 't2-2', name: 'Create low-fidelity wireframes', completed: false, assignedTo: [allUsers[1].id] },
    ],
    comments: [],
    briefFiles: [
      { name: 'User-Research-Summary.docx', size: 450 * 1024, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', url: '#' },
    ],
    services: ['UI/UX Design', 'User Research'],
    activities: [
        { id: 'a2-1', type: 'comment', user: allUsers[3], timestamp: '2024-07-25T09:00:00Z', details: 'The user interviews are complete, summary attached.', target: 'Task T2-1' },
        { id: 'a2-2', type: 'deadline_change', user: allUsers[1], timestamp: '2024-07-24T10:00:00Z', details: 'extended to 2024-11-30', target: 'Project Deadline' },
    ]
  },
  {
    id: 'proj-003',
    name: 'Q3 Marketing Campaign',
    category: 'Marketing',
    description: 'A multi-channel marketing campaign for the new product launch. Includes social media, email marketing, and content creation.',
    startDate: '2024-07-01',
    deadline: '2024-09-30',
    budget: 25000,
    status: 'Completed',
    paymentStatus: 'Paid',
    progress: 100,
    createdBy: allUsers[0],
    assignedTo: [allUsers[0]],
    tasks: [],
    comments: [],
    briefFiles: [],
    services: ['Social Media', 'Email Marketing'],
    activities: [
        { id: 'a3-1', type: 'payment_status_change', user: allUsers[0], timestamp: '2024-07-20T14:00:00Z', details: "from 'Pending' to 'Paid'", target: 'Payment' },
        { id: 'a3-2', type: 'progress_update', user: allUsers[0], timestamp: '2024-07-19T18:00:00Z', details: 'to 100%', target: 'Project Progress' },
    ]
  },
  {
    id: 'proj-004',
    name: 'Data Analytics Dashboard',
    category: 'Data Science',
    description: 'Development of an internal dashboard to visualize key business metrics and KPIs. Will connect to multiple data sources.',
    startDate: '2024-08-01',
    deadline: '2024-12-31',
    budget: 60000,
    status: 'On Track',
    paymentStatus: 'Pending',
    progress: 15,
    createdBy: allUsers[2],
    assignedTo: [allUsers[2], allUsers[4]],
    tasks: [],
    comments: [],
    briefFiles: [],
    services: ['Data Visualization', 'Backend Development'],
    activities: []
  },
  {
    id: 'proj-005',
    name: 'Brand Identity Refresh',
    category: 'Branding',
    description: 'A complete refresh of the company\'s brand identity, including logo, color palette, and typography.',
    startDate: '2024-05-20',
    deadline: '2024-08-30',
    budget: 30000,
    status: 'Off Track',
    paymentStatus: 'Overdue',
    progress: 80,
    createdBy: allUsers[1],
    assignedTo: [allUsers[1]],
    tasks: [],
    comments: [],
    briefFiles: [],
    services: ['Logo Design', 'Brand Guidelines'],
    activities: []
  },
];