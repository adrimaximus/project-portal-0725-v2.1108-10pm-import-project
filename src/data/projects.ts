export interface AssignedUser {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
  src?: string;
  fallback?: string;
}

export interface Project {
  id: string;
  name:string;
  description: string;
  status: 'Requested' | 'In Progress' | 'Completed' | 'Billed' | 'On Hold' | 'Cancelled' | 'Done';
  progress: number;
  startDate: string;
  deadline: string;
  paymentDueDate?: string;
  budget: number;
  paymentStatus: 'Paid' | 'Pending' | 'Overdue';
  assignedTo: AssignedUser[];
  services: string[];
  tickets?: number;
  invoiceAttachmentUrl?: string;
}

export const dummyProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'E-commerce Platform Development',
    description: 'Building a full-featured e-commerce website from scratch.',
    status: 'In Progress',
    progress: 60,
    startDate: '2025-06-01',
    deadline: '2025-12-15',
    paymentDueDate: '2025-08-30',
    budget: 150000000,
    paymentStatus: 'Pending',
    assignedTo: [
      { id: 'user-1', name: 'Ethan Carter', avatar: 'https://i.pravatar.cc/150?u=ethan', status: 'online' },
      { id: 'user-2', name: 'Olivia Chen', avatar: 'https://i.pravatar.cc/150?u=olivia', status: 'offline' },
    ],
    services: ['Web Development', 'UI/UX Design', 'SEO Optimization'],
    tickets: 5,
    invoiceAttachmentUrl: '/attachments/invoice-proj-1.pdf',
  },
  {
    id: 'proj-2',
    name: 'Mobile Banking App',
    description: 'Developing a secure and user-friendly mobile banking application for iOS and Android.',
    status: 'Completed',
    progress: 100,
    startDate: '2025-01-10',
    deadline: '2025-07-20',
    paymentDueDate: '2025-07-25',
    budget: 250000000,
    paymentStatus: 'Paid',
    assignedTo: [
      { id: 'user-3', name: 'Liam Goldberg', avatar: 'https://i.pravatar.cc/150?u=liam', status: 'online' },
      { id: 'user-4', name: 'Sophia Rodriguez', avatar: 'https://i.pravatar.cc/150?u=sophia', status: 'online' },
    ],
    services: ['Mobile App Development', 'UI/UX Design', 'API Integration'],
    tickets: 2,
    invoiceAttachmentUrl: '/attachments/invoice-proj-2.pdf',
  },
  {
    id: 'proj-3',
    name: 'Cloud Migration Strategy',
    description: 'Consulting services to plan and execute a full-scale migration to a cloud-based infrastructure.',
    status: 'On Hold',
    progress: 20,
    startDate: '2025-08-01',
    deadline: '2025-11-30',
    budget: 80000000,
    paymentStatus: 'Pending',
    assignedTo: [
      { id: 'user-1', name: 'Ethan Carter', avatar: 'https://i.pravatar.cc/150?u=ethan', status: 'online' },
    ],
    services: ['Cloud Services', 'IT Consulting'],
    tickets: 0,
  },
  {
    id: 'proj-4',
    name: 'Brand Identity Redesign',
    description: 'A complete overhaul of the company\'s brand identity, including logo, color palette, and typography.',
    status: 'Requested',
    progress: 0,
    startDate: '2025-09-15',
    deadline: '2025-12-01',
    budget: 50000000,
    paymentStatus: 'Pending',
    assignedTo: [
      { id: 'user-2', name: 'Olivia Chen', avatar: 'https://i.pravatar.cc/150?u=olivia', status: 'offline' },
    ],
    services: ['Branding', 'Graphic Design'],
    tickets: 1,
  },
];