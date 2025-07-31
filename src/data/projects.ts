import { User, dummyUsers } from './users';

export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'On Hold' | 'Completed' | 'Requested' | 'Done' | 'Billed' | 'Cancelled' | 'In Progress';
export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue' | 'Approved' | 'PoCreated' | 'OnProcess' | 'Cancelled' | 'Proposed';
export type TaskStatus = 'To Do' | 'In Progress' | 'Done';

export interface AssignedUser extends User {
  role: string;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: string;
  assignedTo: AssignedUser[];
  completed: boolean;
  text?: string;
}

export interface Comment {
  id: string;
  user: User;
  timestamp: string;
  text: string;
}

export interface Ticket {
  id: string;
  title: string;
  status: 'Open' | 'In Progress' | 'Closed';
  submittedBy: User;
  comments: Comment[];
}

export interface Activity {
  id: string;
  user: User;
  timestamp: string;
  description: string;
  action: string;
  target: string;
}

export interface Service {
  name: string;
  price: number;
}

export interface BriefFile {
  name: string;
  type: 'pdf' | 'doc' | 'img';
  size: string;
}

export type { User };

export interface Project {
  id: string;
  name: string;
  description: string;
  owner: User;
  category: string;
  progress: number;
  assignedTo: AssignedUser[];
  status: ProjectStatus;
  paymentStatus: PaymentStatus;
  budget: number;
  deadline: string;
  paymentDueDate?: string;
  startDate: string;
  createdBy: User;
  services: Service[];
  briefFiles: BriefFile[];
  tasks: Task[];
  tickets: Ticket[];
  activity: Activity[];
}

const assignedUsers: AssignedUser[] = [
  { ...dummyUsers[0], role: 'Project Manager' },
  { ...dummyUsers[1], role: 'Lead Developer' },
  { ...dummyUsers[2], role: 'UI/UX Designer' },
  { ...dummyUsers[3], role: 'Backend Developer' },
  { ...dummyUsers[4], role: 'QA Tester' },
];

export const dummyProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Website Redesign',
    description: 'Complete overhaul of the company website.',
    category: 'Marketing',
    owner: dummyUsers[0],
    progress: 75,
    assignedTo: [assignedUsers[0], assignedUsers[1], assignedUsers[2]],
    status: 'On Track',
    paymentStatus: 'Paid',
    budget: 50000,
    startDate: '2023-01-15',
    deadline: '2023-06-30',
    paymentDueDate: '2023-07-15',
    createdBy: dummyUsers[0],
    services: [
      { name: 'Web Design', price: 20000 },
      { name: 'Development', price: 25000 },
      { name: 'SEO', price: 5000 },
    ],
    briefFiles: [
      { name: 'Project Brief.pdf', type: 'pdf', size: '2.5 MB' },
      { name: 'Wireframes.doc', type: 'doc', size: '5.1 MB' },
    ],
    tasks: [
      { id: 'task-1', title: 'Design mockups', status: 'Done', dueDate: '2023-02-28', assignedTo: [assignedUsers[2]], completed: true },
      { id: 'task-2', title: 'Develop homepage', status: 'In Progress', dueDate: '2023-04-15', assignedTo: [assignedUsers[1], assignedUsers[3]], completed: false },
      { id: 'task-3', title: 'Setup CMS', status: 'To Do', dueDate: '2023-05-10', assignedTo: [assignedUsers[3]], completed: false },
    ],
    tickets: [
      { id: 'ticket-1', title: 'Login button not working on mobile', status: 'Open', submittedBy: dummyUsers[4], comments: [] },
    ],
    activity: [
      { id: 'act-1', user: dummyUsers[0], timestamp: '2023-05-01T10:00:00Z', description: 'created the project.', action: 'created', target: 'project' },
      { id: 'act-2', user: dummyUsers[2], timestamp: '2023-05-02T14:30:00Z', description: 'uploaded new wireframes.', action: 'uploaded', target: 'file' },
    ],
  },
  {
    id: 'proj-2',
    name: 'Mobile App Development',
    description: 'Create a new mobile app for iOS and Android.',
    category: 'Engineering',
    owner: dummyUsers[1],
    progress: 40,
    assignedTo: [assignedUsers[1], assignedUsers[3], assignedUsers[4]],
    status: 'At Risk',
    paymentStatus: 'Pending',
    budget: 120000,
    startDate: '2023-03-01',
    deadline: '2023-10-31',
    createdBy: dummyUsers[1],
    services: [
      { name: 'iOS Development', price: 50000 },
      { name: 'Android Development', price: 50000 },
      { name: 'Backend API', price: 20000 },
    ],
    briefFiles: [
      { name: 'App Spec.pdf', type: 'pdf', size: '4.0 MB' },
    ],
    tasks: [
      { id: 'task-4', title: 'API development', status: 'In Progress', dueDate: '2023-06-30', assignedTo: [assignedUsers[3]], completed: false },
      { id: 'task-5', title: 'iOS UI implementation', status: 'To Do', dueDate: '2023-07-31', assignedTo: [assignedUsers[1]], completed: false },
    ],
    tickets: [],
    activity: [
      { id: 'act-3', user: dummyUsers[1], timestamp: '2023-03-01T09:00:00Z', description: 'started the mobile app project.', action: 'started', target: 'project' },
    ],
  },
  {
    id: 'proj-3',
    name: 'Q3 Marketing Campaign',
    description: 'Plan and execute the marketing campaign for the third quarter.',
    category: 'Marketing',
    owner: dummyUsers[2],
    progress: 90,
    assignedTo: [assignedUsers[2], assignedUsers[0]],
    status: 'Completed',
    paymentStatus: 'Paid',
    budget: 75000,
    startDate: '2023-07-01',
    deadline: '2023-09-30',
    createdBy: dummyUsers[2],
    services: [{ name: 'Ad Spend', price: 60000 }, { name: 'Creative', price: 15000 }],
    briefFiles: [],
    tasks: [],
    tickets: [],
    activity: [],
  },
  {
    id: 'proj-4',
    name: 'API Integration',
    description: 'Integrate with third-party APIs for new features.',
    category: 'Engineering',
    owner: dummyUsers[3],
    progress: 20,
    assignedTo: [assignedUsers[3], assignedUsers[4], assignedUsers[1]],
    status: 'Off Track',
    paymentStatus: 'Overdue',
    budget: 30000,
    startDate: '2023-04-15',
    deadline: '2023-07-15',
    paymentDueDate: '2023-06-01',
    createdBy: dummyUsers[3],
    services: [{ name: 'Integration Work', price: 30000 }],
    briefFiles: [],
    tasks: [],
    tickets: [],
    activity: [],
  },
  {
    id: 'proj-5',
    name: 'Customer Support Portal',
    description: 'Build a new portal for customer support tickets.',
    category: 'Customer Success',
    owner: dummyUsers[4],
    progress: 60,
    assignedTo: [assignedUsers[4], assignedUsers[0]],
    status: 'On Hold',
    paymentStatus: 'Pending',
    budget: 45000,
    startDate: '2023-02-01',
    deadline: '2023-08-31',
    createdBy: dummyUsers[4],
    services: [],
    briefFiles: [],
    tasks: [],
    tickets: [],
    activity: [],
  },
];