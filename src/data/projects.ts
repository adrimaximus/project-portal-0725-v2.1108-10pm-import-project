export interface User {
  id: string;
  name: string;
  avatar?: string;
  initials?: string;
  email?: string;
  role?: string;
}

export type AssignedUser = User;

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

export type ProjectStatus = "On Track" | "At Risk" | "Off Track" | "On Hold" | "Completed" | "Done" | "Billed" | "Cancelled" | "In Progress" | "Requested";
export type PaymentStatus = "Paid" | "Unpaid" | "Overdue" | "Pending" | "Approved" | "PO Created" | "On Process" | "Cancelled" | "Proposed";
export type ActivityType = 'PROJECT_CREATED' | 'COMMENT_ADDED' | 'TASK_CREATED' | 'TASK_COMPLETED' | 'TASK_DELETED' | 'TEAM_MEMBER_ADDED' | 'TEAM_MEMBER_REMOVED' | 'PAYMENT_STATUS_UPDATED' | 'PROJECT_STATUS_UPDATED' | 'PROJECT_DETAILS_UPDATED' | 'FILE_UPLOADED' | 'TICKET_CREATED' | 'TASK_REOPENED';

export interface Comment {
  id: string;
  author: User;
  text: string;
  timestamp: string;
  isTicket?: boolean;
  attachment?: { name: string; url: string };
  originTicketId?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  originTicketId?: string;
  assignedTo?: User[];
}

export interface Activity {
  id: string;
  user: User;
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
  description: string;
  status: ProjectStatus;
  paymentStatus: PaymentStatus;
  dueDate: string;
  assignedTo: User[];
  tasks?: Task[];
  comments?: Comment[];
  activities?: Activity[];
  progress: number;
  startDate?: string;
  budget?: number;
  category?: string;
  createdBy?: User;
  services?: string[];
  briefFiles?: ProjectFile[];
  files?: ProjectFile[];
}

const alice: User = { id: 'user-1', name: 'Alice Johnson', initials: 'AJ', avatar: 'https://i.pravatar.cc/150?u=alice', email: 'alice@example.com', role: 'Admin' };
const bob: User = { id: 'user-2', name: 'Bob Williams', initials: 'BW', avatar: 'https://i.pravatar.cc/150?u=bob', email: 'bob@example.com', role: 'Member' };
const charlie: User = { id: 'user-3', name: 'Charlie Brown', initials: 'CB', avatar: 'https://i.pravatar.cc/150?u=charlie', email: 'charlie@example.com', role: 'Member' };
const diana: User = { id: 'user-4', name: 'Diana Prince', initials: 'DP', avatar: 'https://i.pravatar.cc/150?u=diana', email: 'diana@example.com', role: 'Admin' };
const eva: User = { id: 'user-5', name: 'Eva Green', initials: 'EG', avatar: 'https://i.pravatar.cc/150?u=eva', email: 'eva@example.com', role: 'Member' };

export const dummyProjects: Project[] = [
  {
    id: "proj-1",
    name: "E-commerce Platform",
    description: "Developing a new online shopping platform with modern features.",
    status: "On Track",
    paymentStatus: "Paid",
    startDate: "2024-07-01",
    dueDate: "2024-10-15",
    budget: 50000,
    category: "Web Development",
    createdBy: alice,
    assignedTo: [alice, bob, charlie],
    progress: 75,
    tasks: [
      { id: 'task-1', title: 'Design homepage UI', completed: true, originTicketId: 'item-1722720191011', assignedTo: [alice] },
      { id: 'task-2', title: 'Develop authentication module', completed: true, assignedTo: [bob] },
      { id: 'task-3', title: 'Set up product database', completed: false, assignedTo: [charlie] },
    ],
    comments: [
      { id: 'comment-1', author: alice, text: 'Hey team, I\'ve pushed the latest designs for the homepage. Let me know your thoughts! @[Bob Williams](user-2)', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      { id: 'item-1722720191011', author: bob, text: 'The login page is not responsive on mobile devices. Needs urgent fix.', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), isTicket: true },
      { id: 'comment-2', author: charlie, text: 'I\'ll start working on the database schema. Will share the ERD by EOD.', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
    ],
    activities: [
        { id: 'act-1', user: alice, type: 'PROJECT_CREATED', details: { description: 'created the project.' }, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'act-2', user: bob, type: 'TASK_COMPLETED', details: { description: 'completed task "Develop authentication module".' }, timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString() },
        { id: 'act-3', user: charlie, type: 'COMMENT_ADDED', details: { description: 'commented on the project.' }, timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
        { id: 'act-4', user: bob, type: 'TICKET_CREATED', details: { description: 'created a ticket: "The login page is not responsive on mobile devices. Needs urgent fix."' }, timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
        { id: 'act-5', user: alice, type: 'TASK_COMPLETED', details: { description: 'completed task "Design homepage UI".' }, timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
    ]
  },
  {
    id: "proj-2",
    name: "Mobile Banking App",
    description: "A native mobile application for iOS and Android for seamless banking.",
    status: "At Risk",
    paymentStatus: "Overdue",
    startDate: "2024-08-01",
    dueDate: "2024-09-20",
    budget: 75000,
    category: "Mobile Development",
    createdBy: diana,
    assignedTo: [diana, eva],
    progress: 40,
    tasks: [
        { id: 'task-4', title: 'Setup CI/CD pipeline', completed: true, assignedTo: [eva] },
        { id: 'task-5', title: 'Implement fund transfer feature', completed: false, assignedTo: [diana] },
    ],
    comments: [
        { id: 'comment-3', author: diana, text: 'The payment gateway integration is causing some issues. Need help from @[Alice Johnson](user-1).', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
    ],
    activities: [
        { id: 'act-6', user: diana, type: 'TEAM_MEMBER_ADDED', details: { description: 'added Eva Green to the project.' }, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    ]
  },
  {
    id: "proj-3",
    name: "Data Analytics Dashboard",
    description: "A web-based dashboard for visualizing company metrics.",
    status: "Off Track",
    paymentStatus: "Unpaid",
    startDate: "2024-09-10",
    dueDate: "2024-11-01",
    budget: 30000,
    category: "Data Science",
    createdBy: bob,
    assignedTo: [bob, diana, alice],
    progress: 20,
    activities: [],
    comments: [],
    tasks: []
  },
];