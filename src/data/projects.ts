export interface AssignedUser {
  id: string;
  name: string;
  avatar: string;
  initials: string;
  email?: string;
  role?: string;
}

export interface ProjectFile {
  name: string;
  size: string;
  url: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  assignedTo?: string[];
  originTicketId?: string;
}

export interface Comment {
  id: string;
  user: AssignedUser;
  date: string;
  text: string;
  isTicket?: boolean;
  ticketStatus?: 'open' | 'closed';
  ticketId?: string;
  assignee?: AssignedUser;
  priority?: 'low' | 'medium' | 'high';
  projectId?: string;
  attachment?: {
    name: string;
    url: string;
  };
  timestamp?: string;
}

export interface Activity {
  id: string;
  user: AssignedUser;
  timestamp: string;
  action: string;
  details: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  progress: number;
  status: "On Track" | "At Risk" | "Off Track" | "On Hold" | "Completed" | "Requested" | "In Progress" | "Done" | "Billed" | "Cancelled";
  createdBy: AssignedUser;
  assignedTo: AssignedUser[];
  startDate: string;
  endDate: string;
  tasks?: Task[];
  comments?: Comment[];
  services?: string[];
  files?: File[];
  budget?: number;
  deadline?: string;
  paymentStatus?: 'Paid' | 'Pending' | 'Overdue';
  category?: string;
  briefFiles?: ProjectFile[];
}

const users: AssignedUser[] = [
  { id: 'user-1', name: 'Alice Johnson', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', initials: 'AJ', email: 'alice@example.com', role: 'Project Manager' },
  { id: 'user-2', name: 'Bob Williams', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704e', initials: 'BW', email: 'bob@example.com', role: 'Developer' },
  { id: 'user-3', name: 'Charlie Brown', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704f', initials: 'CB', email: 'charlie@example.com', role: 'Designer' },
  { id: 'user-4', name: 'Diana Prince', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704a', initials: 'DP', email: 'diana@example.com', role: 'Developer' },
];

const projects: Project[] = [
  {
    id: "proj-1",
    name: "E-commerce Platform",
    description: "Developing a new e-commerce platform with a modern tech stack.",
    progress: 75,
    status: "On Track",
    createdBy: users[0],
    assignedTo: [users[0], users[1], users[2]],
    startDate: "2024-01-15",
    endDate: "2024-09-30",
    tasks: [
      { id: 'task-1-1', text: 'Design homepage UI', completed: true, assignedTo: ['user-1'] },
      { id: 'task-1-2', text: 'Develop authentication module', completed: true, assignedTo: ['user-2'] },
      { id: 'task-1-3', text: 'Set up product database', completed: true, assignedTo: ['user-2', 'user-3'] },
      { id: 'task-1-4', text: 'Implement shopping cart feature', completed: false, assignedTo: ['user-1'] },
      { id: 'task-1-5', text: 'Integrate payment gateway', completed: false },
    ],
    comments: [
      { id: 'comment-1-1', user: users[1], date: '2024-07-20T10:30:00Z', text: 'The authentication module is complete and ready for review.', timestamp: '2024-07-20T10:30:00Z' },
      { id: 'comment-1-2', user: users[0], date: '2024-07-21T14:00:00Z', text: 'Great work, Bob! I\'ll take a look this afternoon.', timestamp: '2024-07-21T14:00:00Z' },
      { id: 'comment-1-3', user: users[2], date: '2024-07-22T09:00:00Z', text: 'I\'m having some trouble with the database schema for product variants.', isTicket: true, ticketStatus: 'open', ticketId: 'T-123', assignee: users[1], priority: 'high', timestamp: '2024-07-22T09:00:00Z' },
    ],
    services: ["Web Development", "UI/UX Design"],
    files: [],
    budget: 50000,
    deadline: "2024-09-30",
    paymentStatus: 'Pending',
    category: 'Web Development',
    briefFiles: [],
  },
  {
    id: "proj-2",
    name: "Mobile Banking App",
    description: "Creating a secure and user-friendly mobile banking application for iOS and Android.",
    progress: 40,
    status: "At Risk",
    createdBy: users[3],
    assignedTo: [users[3], users[1]],
    startDate: "2024-03-01",
    endDate: "2024-12-31",
    tasks: [
      { id: 'task-2-1', text: 'Finalize app features and requirements', completed: true, assignedTo: ['user-3'] },
      { id: 'task-2-2', text: 'Create wireframes and mockups', completed: true, assignedTo: ['user-3'] },
      { id: 'task-2-3', text: 'Develop user login and security', completed: false, assignedTo: ['user-1'] },
      { id: 'task-2-4', text: 'Implement fund transfer functionality', completed: false, assignedTo: ['user-1'] },
    ],
    comments: [
       { id: 'comment-2-1', user: users[1], date: '2024-07-19T11:00:00Z', text: 'The login screen design needs to be updated to include biometric authentication.', timestamp: '2024-07-19T11:00:00Z' },
    ],
    services: ["Mobile Development", "Security"],
    files: [],
    budget: 75000,
    deadline: "2024-12-31",
    paymentStatus: 'Paid',
    category: 'Mobile App',
    briefFiles: [],
  },
  {
    id: "proj-3",
    name: "Data Analytics Dashboard",
    description: "A comprehensive dashboard for visualizing sales and marketing data.",
    progress: 95,
    status: "Completed",
    createdBy: users[0],
    assignedTo: [users[0], users[2]],
    startDate: "2023-11-01",
    endDate: "2024-05-30",
    tasks: [],
    comments: [],
    services: ["Data Science", "BI"],
    files: [],
    budget: 40000,
    deadline: "2024-05-30",
    paymentStatus: 'Paid',
    category: 'Data Science',
    briefFiles: [],
  },
  {
    id: "proj-4",
    name: "Cloud Migration",
    description: "Migrating a monolithic legacy application to a modern, cloud-native architecture on AWS. The project is currently on hold pending budget approval for Q3.",
    progress: 20,
    status: "On Hold",
    createdBy: users[0],
    assignedTo: [users[0], users[1]],
    startDate: "2024-06-01",
    endDate: "2025-03-31",
    tasks: [],
    comments: [],
    services: [],
    files: [],
    budget: 120000,
    deadline: "2025-03-31",
    paymentStatus: 'Pending',
    category: 'Infrastructure',
    briefFiles: [],
  },
];

export const getProjects = () => projects;
export const getProjectById = (id: string) => projects.find(p => p.id === id);
export const getAssignableUsers = () => users;