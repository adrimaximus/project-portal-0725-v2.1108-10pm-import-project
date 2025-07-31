export type AssignedUser = {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
  email?: string;
  role?: string;
};

export type User = AssignedUser;

export type Task = {
  id: string;
  text: string;
  completed: boolean;
  assignedTo?: string[];
};

export type Activity = {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  action: string;
  target: string;
  timestamp: string;
};

export type ProjectFile = {
  name: string;
  size: number; // Changed to number for consistency
  url: string;
  type: string; // Added type for consistency
};

export type Project = {
  id:string;
  name: string;
  category: string;
  status: 'Completed' | 'In Progress' | 'On Hold' | 'Cancelled' | 'Requested' | 'On Track' | 'At Risk' | 'Done' | 'Billed' | 'Off Track';
  paymentStatus: 'Paid' | 'Pending' | 'Overdue' | 'proposed' | 'approved' | 'po_created' | 'on_process' | 'cancelled' | 'paid' | 'pending';
  progress: number;
  budget: number;
  deadline: string;
  startDate?: string;
  paymentDueDate?: string;
  assignedTo: AssignedUser[];
  createdBy: AssignedUser;
  description: string;
  tasks?: Task[];
  files?: ProjectFile[];
  briefFiles?: ProjectFile[];
  comments?: { id: string; userId: string; text: string; timestamp: string }[];
  services?: string[];
  tickets?: number; // Changed to number
  activity?: Activity[];
};

const users: AssignedUser[] = [
  { id: 'user-1', name: 'Alice Johnson', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', initials: 'AJ', email: 'alice@example.com', role: 'Project Manager' },
  { id: 'user-2', name: 'Bob Williams', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d', initials: 'BW', email: 'bob@example.com', role: 'Lead Developer' },
  { id: 'user-3', name: 'Charlie Brown', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026706d', initials: 'CB', email: 'charlie@example.com', role: 'UI/UX Designer' },
  { id: 'user-4', name: 'Diana Prince', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026707d', initials: 'DP', email: 'diana@example.com', role: 'QA Tester' },
];

export const dummyProjects: Project[] = [
  {
    id: 'proj-001',
    name: 'E-commerce Platform Development',
    category: 'Web Development',
    status: 'In Progress',
    paymentStatus: 'Paid',
    progress: 65,
    budget: 50000,
    startDate: '2024-03-01T00:00:00.000Z',
    deadline: '2024-08-15T23:59:59.999Z',
    paymentDueDate: '2024-04-01T23:59:59.999Z',
    assignedTo: [users[0], users[1], users[2]],
    createdBy: users[0],
    description: 'Full-stack development of a new e-commerce platform with modern features, including a custom CMS, payment gateway integration, and a responsive user interface. The goal is to increase sales by 30% in the first quarter after launch.',
    tasks: [
      { id: 't1', text: 'Setup project structure', completed: true, assignedTo: ['user-1'] },
      { id: 't2', text: 'Design database schema', completed: true, assignedTo: ['user-2'] },
      { id: 't3', text: 'Develop API endpoints for products', completed: false, assignedTo: ['user-2'] },
      { id: 't4', text: 'Create frontend components for homepage', completed: false, assignedTo: ['user-1', 'user-3'] },
    ],
    services: ['Web Development', 'UI/UX Design', 'API Integration'],
    briefFiles: [
        { name: 'project-brief.pdf', size: 2621440, url: '#', type: 'application/pdf' },
        { name: 'design-mockups.zip', size: 15938355, url: '#', type: 'application/zip' },
    ],
    activity: [
        { id: 'act-1', user: { name: 'Alice Johnson', avatar: users[0].avatar }, action: 'added a new task', target: 'Create frontend components', timestamp: '2024-05-20T10:00:00Z' },
        { id: 'act-2', user: { name: 'Bob Williams', avatar: users[1].avatar }, action: 'completed a task', target: 'Design database schema', timestamp: '2024-05-19T15:30:00Z' },
    ]
  },
  {
    id: 'proj-002',
    name: 'Mobile App for Task Management',
    category: 'Mobile Development',
    status: 'Completed',
    paymentStatus: 'Paid',
    progress: 100,
    budget: 35000,
    startDate: '2024-01-10T00:00:00.000Z',
    deadline: '2024-06-30T23:59:59.999Z',
    assignedTo: [users[1], users[3]],
    createdBy: users[3],
    description: 'A cross-platform mobile application for personal and team task management. Features include push notifications, offline access, and third-party integrations.',
    tasks: [
      { id: 't1', text: 'UI/UX Design', completed: true },
      { id: 't2', text: 'Frontend Development', completed: true },
      { id: 't3', text: 'Backend & Database', completed: true },
      { id: 't4', text: 'Testing & QA', completed: true },
    ],
    services: ['Mobile App Development', 'Firebase Integration'],
  },
  {
    id: 'proj-003',
    name: 'Cloud Migration for Legacy System',
    category: 'Infrastructure',
    status: 'On Hold',
    paymentStatus: 'Pending',
    progress: 20,
    budget: 75000,
    startDate: '2024-04-01T00:00:00.000Z',
    deadline: '2024-10-01T23:59:59.999Z',
    assignedTo: [users[0], users[3]],
    createdBy: users[0],
    description: 'Migrating a monolithic legacy application to a modern, cloud-native architecture on AWS. The project is currently on hold pending budget approval for Q3.',
    services: ['Cloud Architecture', 'DevOps', 'Database Migration'],
  },
  {
    id: 'proj-004',
    name: 'Marketing Website Redesign',
    category: 'Web Design',
    status: 'In Progress',
    paymentStatus: 'Overdue',
    progress: 85,
    budget: 15000,
    startDate: '2024-05-15T00:00:00.000Z',
    deadline: '2024-07-20T23:59:59.999Z',
    paymentDueDate: '2024-06-15T23:59:59.999Z',
    assignedTo: [users[2], users[3]],
    createdBy: users[2],
    description: 'Redesigning the company\'s public-facing marketing website for better user engagement and lead generation. The new design will be fully responsive and SEO-optimized.',
    tasks: [
      { id: 't1', text: 'Wireframing', completed: true },
      { id: 't2', text: 'Visual Design Mockups', completed: true },
      { id: 't3', text: 'Frontend Implementation', completed: true },
      { id: 't4', text: 'CMS Integration', completed: false },
    ],
    services: ['Web Design', 'SEO Optimization'],
  },
  {
    id: 'proj-005',
    name: 'Data Analytics Dashboard',
    category: 'Data Science',
    status: 'Cancelled',
    paymentStatus: 'Pending',
    progress: 10,
    budget: 40000,
    startDate: '2024-02-20T00:00:00.000Z',
    deadline: '2024-09-01T23:59:59.999Z',
    assignedTo: [users[1]],
    createdBy: users[1],
    description: 'A dashboard for visualizing key business metrics and KPIs. Project cancelled due to a shift in company priorities.',
    services: ['Data Visualization', 'Business Intelligence'],
  },
];