export interface AssignedUser {
  id: string;
  name: string;
  avatar: string;
  role?: string;
  email?: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'To Do' | 'In Progress' | 'Done';
  assignee?: AssignedUser;
}

export interface Project {
  id: string;
  name: string;
  status: 'Requested' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled' | 'Done' | 'Billed';
  startDate: string;
  deadline: string;
  budget: number;
  description: string;
  tags: string[];
  createdBy: AssignedUser;
  assignedTo: AssignedUser[];
  paymentStatus: 'Paid' | 'Unpaid' | 'Overdue' | 'paid' | 'approved' | 'po_created' | 'on_process' | 'pending' | 'cancelled' | 'proposed';
  paymentDueDate: string;
  briefFiles?: File[];
  rating?: number;
  tickets?: number;
  invoiceAttachmentUrl?: string;
  services?: string[];
  tasks?: Task[];
  progress?: number;
}

export const dummyProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'E-commerce Platform Development',
    status: 'In Progress',
    startDate: '2024-08-01',
    deadline: '2024-12-20',
    budget: 50000,
    description: 'Developing a full-stack e-commerce solution with a custom CMS. The platform will feature product management, order processing, and a customer review system.',
    tags: ['React', 'Node.js', 'E-commerce'],
    createdBy: { id: 'user-5', name: 'Jane Doe', avatar: 'https://i.pravatar.cc/150?u=jane', role: 'Project Manager' },
    assignedTo: [
      { id: 'user-1', name: 'John Smith', avatar: 'https://i.pravatar.cc/150?u=john', role: 'Lead Developer' },
      { id: 'user-2', name: 'Alice Johnson', avatar: 'https://i.pravatar.cc/150?u=alice', role: 'UX/UI Designer' },
    ],
    paymentStatus: 'Unpaid',
    paymentDueDate: '2024-12-30',
    tickets: 1,
  },
  {
    id: 'proj-2',
    name: 'Mobile App for Fitness Tracking',
    status: 'Completed',
    startDate: '2024-06-15',
    deadline: '2024-10-01',
    budget: 35000,
    description: 'A native mobile application for iOS and Android that tracks user fitness activities, sets goals, and provides workout plans.',
    tags: ['iOS', 'Android', 'Fitness'],
    createdBy: { id: 'user-6', name: 'Mike Ross', avatar: 'https://i.pravatar.cc/150?u=mike', role: 'Product Owner' },
    assignedTo: [
      { id: 'user-3', name: 'Emily White', avatar: 'https://i.pravatar.cc/150?u=emily', role: 'Mobile Developer' },
      { id: 'user-4', name: 'Chris Green', avatar: 'https://i.pravatar.cc/150?u=chris', role: 'QA Tester' },
    ],
    paymentStatus: 'Paid',
    paymentDueDate: '2024-10-15',
    rating: 5,
    tickets: 0,
  },
  {
    id: 'proj-3',
    name: 'Corporate Website Redesign',
    status: 'Done',
    startDate: '2024-09-01',
    deadline: '2024-11-01',
    budget: 15000,
    description: 'A complete redesign of the corporate website to improve user experience and modernize the brand identity. Focus on responsive design and SEO optimization.',
    tags: ['Web Design', 'SEO', 'Branding'],
    createdBy: { id: 'user-5', name: 'Jane Doe', avatar: 'https://i.pravatar.cc/150?u=jane', role: 'Project Manager' },
    assignedTo: [
      { id: 'user-2', name: 'Alice Johnson', avatar: 'https://i.pravatar.cc/150?u=alice', role: 'UX/UI Designer' },
    ],
    paymentStatus: 'Unpaid',
    paymentDueDate: '2024-11-15',
    tickets: 0,
  },
];