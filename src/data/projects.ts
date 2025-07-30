import { users } from './users';

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
  dueDate?: string;
}

export interface Activity {
  id: string;
  user: AssignedUser;
  action: string;
  target: string;
  timestamp: string;
}

export interface Project {
  id: string;
  name: string;
  assignedTo: AssignedUser[];
  status: "Completed" | "In Progress" | "On Hold" | "Cancelled" | "Done" | "Billed" | "Requested";
  progress: number;
  startDate: string;
  deadline: string;
  paymentStatus: "paid" | "approved" | "po_created" | "on_process" | "pending" | "cancelled" | "proposed";
  paymentDueDate?: string;
  tickets?: number;
  budget: number;
  invoiceAttachmentUrl?: string;
  createdBy: AssignedUser;
  description: string;
  briefFiles?: any[];
  rating?: number;
  tasks?: Task[];
  activityFeed?: Activity[];
  services?: string[];
}

export const dummyProjects: Project[] = [
  {
    id: "PROJ-001",
    name: "E-commerce Platform",
    assignedTo: [users[0], users[1], users[2]],
    status: "In Progress",
    progress: 75,
    startDate: "2023-01-15",
    deadline: "2024-08-30",
    paymentStatus: "pending",
    budget: 50000000,
    createdBy: users[0],
    description: "A full-featured e-commerce platform with a modern UI.",
    rating: 0,
    tasks: [
      { id: 'task-1', title: 'Setup database schema', status: 'Done', assignee: users[1] },
      { id: 'task-2', title: 'Design product page UI', status: 'In Progress', assignee: users[2] },
    ],
    activityFeed: [
      { id: 'act-1', user: users[0], action: 'created', target: 'the project', timestamp: '2023-01-15T09:00:00Z' }
    ],
    services: ['Web Development', 'UI/UX Design']
  },
  {
    id: "PROJ-002",
    name: "Mobile Banking App",
    assignedTo: [users[1], users[4]],
    status: "Completed",
    progress: 100,
    startDate: "2023-03-01",
    deadline: "2023-09-01",
    paymentStatus: "paid",
    paymentDueDate: "2023-09-15",
    budget: 75000000,
    createdBy: users[0],
    description: "A secure and user-friendly mobile banking application.",
    invoiceAttachmentUrl: "https://example.com/invoice.pdf",
    rating: 5,
    tasks: [],
    activityFeed: [],
    services: ['Mobile App Development']
  },
  {
    id: "PROJ-003",
    name: "CRM System",
    assignedTo: [users[0], users[3], users[4]],
    status: "On Hold",
    progress: 30,
    startDate: "2023-05-20",
    deadline: "2024-12-31",
    paymentStatus: "proposed",
    budget: 120000000,
    createdBy: users[0],
    description: "Customer Relationship Management system for sales team.",
    rating: 0,
    tasks: [],
    activityFeed: [],
    services: ['Backend Development', 'QA']
  },
  {
    id: "PROJ-004",
    name: "Website Redesign",
    assignedTo: [users[2]],
    status: "Completed",
    progress: 100,
    startDate: "2023-08-10",
    deadline: "2023-10-25",
    paymentStatus: "paid",
    paymentDueDate: "2023-11-01",
    budget: 25000000,
    createdBy: users[0],
    description: "A complete redesign of the company's public-facing website.",
    rating: 4,
    tasks: [],
    activityFeed: [],
    services: ['UI/UX Design']
  },
  {
    id: "PROJ-005",
    name: "Data Analytics Dashboard",
    assignedTo: [users[1], users[4]],
    status: "In Progress",
    progress: 50,
    startDate: "2023-09-01",
    deadline: "2024-07-15",
    paymentStatus: "on_process",
    budget: 60000000,
    createdBy: users[0],
    description: "A dashboard for visualizing key business metrics.",
    tickets: 3,
    rating: 0,
    tasks: [],
    activityFeed: [],
    services: ['Data Science', 'Backend Development']
  },
];