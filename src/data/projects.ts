import { id } from 'date-fns/locale';

export interface AssignedUser {
  id: string;
  name: string;
  avatar?: string;
  initials?: string;
  role?: string;
  email?: string;
}

export interface Task {
  id: string;
  name: string;
  completed: boolean;
  assignedTo?: string[];
  originTicketId?: string;
}

export interface Comment {
  id: string;
  author: AssignedUser;
  text: string;
  timestamp: string;
  isTicket?: boolean;
  attachment?: {
    name: string;
    url: string;
    type: string;
    size: number;
  };
}

export type ProjectStatus = 'Active' | 'On Hold' | 'Completed' | 'On Track' | 'Done' | 'Billed' | 'At Risk' | 'Off Track' | 'Cancelled' | 'In Progress' | 'Requested';
export type PaymentStatus = 'Paid' | 'Unpaid' | 'Overdue' | 'Pending' | 'Approved' | 'PO Created' | 'On Process' | 'Cancelled' | 'Proposed';


export type ActivityType =
  | 'PROJECT_CREATED'
  | 'COMMENT_ADDED'
  | 'TASK_CREATED'
  | 'TASK_COMPLETED'
  | 'TASK_DELETED'
  | 'TASK_REOPENED'
  | 'TEAM_MEMBER_ADDED'
  | 'TEAM_MEMBER_REMOVED'
  | 'PAYMENT_STATUS_UPDATED'
  | 'PROJECT_STATUS_UPDATED'
  | 'PROJECT_DETAILS_UPDATED'
  | 'FILE_UPLOADED'
  | 'TICKET_CREATED';

export interface Activity {
  id: string;
  type: ActivityType;
  timestamp: string;
  user: {
    id: string;
    name: string;
  };
  details: {
    description: string;
    [key: string]: any;
  };
}

export interface ProjectFile {
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  client: string;
  startDate: string;
  deadline: string;
  progress: number;
  assignedTo: AssignedUser[];
  budget: number;
  paymentStatus: PaymentStatus;
  description: string;
  services: string[];
  briefFiles?: ProjectFile[];
  tasks?: Task[];
  comments?: Comment[];
  activities?: Activity[];
  category?: string;
  createdBy?: AssignedUser;
}

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);
const nextMonth = new Date(today);
nextMonth.setMonth(nextMonth.getMonth() + 1);

const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const dummyUsers: AssignedUser[] = [
  { id: 'user-1', name: 'Alice Johnson', avatar: '/avatars/01.png', initials: 'AJ', role: 'Project Manager', email: 'alice@example.com' },
  { id: 'user-2', name: 'Bob Williams', avatar: '/avatars/02.png', initials: 'BW', role: 'Developer', email: 'bob@example.com' },
  { id: 'user-3', name: 'Charlie Brown', avatar: '/avatars/03.png', initials: 'CB', role: 'Designer', email: 'charlie@example.com' },
  { id: 'user-4', name: 'Diana Miller', avatar: '/avatars/04.png', initials: 'DM', role: 'QA Tester', email: 'diana@example.com' },
  { id: 'user-5', name: 'Ethan Davis', avatar: '/avatars/05.png', initials: 'ED', role: 'Developer', email: 'ethan@example.com' },
];

export let dummyProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Website Redesign',
    status: 'Active',
    client: 'Innovate Inc.',
    startDate: formatDate(today),
    deadline: formatDate(nextMonth),
    progress: 60,
    assignedTo: [dummyUsers[0], dummyUsers[1]],
    budget: 5000,
    paymentStatus: 'Paid',
    description: 'Complete redesign of the main corporate website to improve user experience and mobile responsiveness. The project involves UI/UX design, front-end development, and back-end integration.',
    services: ['UI/UX Design', 'Web Development'],
    briefFiles: [
      { name: 'project-brief.pdf', size: 1200000, type: 'application/pdf', url: '#' },
      { name: 'style-guide.docx', size: 850000, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', url: '#' },
    ],
    tasks: [
      { id: 'task-1-1', name: 'Finalize UI/UX mockups', completed: true, assignedTo: ['user-1'] },
      { id: 'task-1-2', name: 'Develop homepage layout', completed: true, assignedTo: ['user-2'] },
      { id: 'task-1-3', name: 'Integrate CMS', completed: false, assignedTo: ['user-2'] },
      { id: 'task-1-4', name: 'Setup staging server', completed: false, assignedTo: ['user-1', 'user-2'] },
    ],
    comments: [
      { id: 'comment-1-1', author: dummyUsers[0], text: 'Hey @[Bob Williams](user-2), can you check the latest mockups? I\'ve pushed them to the repo.', timestamp: new Date(Date.now() - 86400000).toISOString() },
      { id: 'comment-1-2', author: dummyUsers[1], text: 'Sure, I\'ll take a look this afternoon.', timestamp: new Date(Date.now() - 80000000).toISOString() },
      { id: 'comment-1-3', author: dummyUsers[0], text: 'I\'ve created a ticket for the bug on the contact form.', timestamp: new Date(Date.now() - 70000000).toISOString(), isTicket: true },
    ],
    activities: [
      { id: 'activity-1-1', type: 'PROJECT_CREATED', timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), user: { id: 'user-1', name: 'Alice Johnson' }, details: { description: 'membuat proyek baru' } },
      { id: 'activity-1-2', type: 'TEAM_MEMBER_ADDED', timestamp: new Date(Date.now() - 1.5 * 86400000).toISOString(), user: { id: 'user-1', name: 'Alice Johnson' }, details: { description: 'menambahkan Bob Williams ke tim' } },
      { id: 'activity-1-3', type: 'TASK_CREATED', timestamp: new Date(Date.now() - 1 * 86400000).toISOString(), user: { id: 'user-1', name: 'Alice Johnson' }, details: { description: 'membuat tugas baru: "Finalize UI/UX mockups"' } },
      { id: 'activity-1-4', type: 'TASK_COMPLETED', timestamp: new Date(Date.now() - 0.5 * 86400000).toISOString(), user: { id: 'user-1', name: 'Alice Johnson' }, details: { description: 'menyelesaikan tugas: "Finalize UI/UX mockups"' } },
    ],
    category: 'Web Development',
    createdBy: dummyUsers[0],
  },
  {
    id: 'proj-2',
    name: 'Mobile App Development',
    status: 'On Hold',
    client: 'Connect Co.',
    startDate: formatDate(new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)),
    deadline: formatDate(new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)),
    progress: 25,
    assignedTo: [dummyUsers[2], dummyUsers[3]],
    budget: 12000,
    paymentStatus: 'Unpaid',
    description: 'Development of a new cross-platform mobile application for social networking. The project is currently on hold pending client feedback on the initial prototype.',
    services: ['Mobile App Development', 'API Development'],
    tasks: [
      { id: 'task-2-1', name: 'Design database schema', completed: true },
      { id: 'task-2-2', name: 'Build user authentication API', completed: false },
    ],
    activities: [
      { id: 'activity-2-1', type: 'PROJECT_CREATED', timestamp: new Date(Date.now() - 14 * 86400000).toISOString(), user: { id: 'user-2', name: 'Bob Williams' }, details: { description: 'membuat proyek baru' } },
    ],
    category: 'Mobile Development',
    createdBy: dummyUsers[1],
  },
  {
    id: 'proj-3',
    name: 'E-commerce Platform',
    status: 'Completed',
    client: 'Shopify',
    startDate: formatDate(new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)),
    deadline: formatDate(new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000)),
    progress: 100,
    assignedTo: [dummyUsers[0], dummyUsers[4]],
    budget: 25000,
    paymentStatus: 'Paid',
    description: 'Full-stack development of a scalable e-commerce platform with features like product management, order processing, and payment gateway integration.',
    services: ['Web Development', 'Database Management'],
    tasks: [
      { id: 'task-3-1', name: 'Deploy to production', completed: true },
    ],
    activities: [
      { id: 'activity-3-1', type: 'PROJECT_CREATED', timestamp: new Date(Date.now() - 90 * 86400000).toISOString(), user: { id: 'user-1', name: 'Alice Johnson' }, details: { description: 'membuat proyek baru' } },
    ],
    category: 'E-commerce',
    createdBy: dummyUsers[0],
  },
];