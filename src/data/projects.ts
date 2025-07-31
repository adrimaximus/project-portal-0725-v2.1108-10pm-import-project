export interface User {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
}

export type AssignedUser = User;

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  assignedTo?: AssignedUser[];
  dueDate?: string;
}

export interface File {
  name: string;
  size: string;
  url: string;
}

export interface Activity {
  id: string;
  user: User;
  action: string;
  target: string;
  date: string;
}

export interface Service {
  name: string;
  price: number;
}

export interface Ticket {
    id: string;
    title: string;
    status: 'Open' | 'In Progress' | 'Closed';
    priority: 'Low' | 'Medium' | 'High';
    lastUpdate: string;
}

export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'Completed' | 'Done' | 'Billed' | 'In Progress' | 'On Hold' | 'Cancelled' | 'Requested';
export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue' | 'paid' | 'approved' | 'po_created' | 'on_process' | 'cancelled' | 'proposed';


const user1: User = { id: 'user-1', name: 'Ahmad Subagja', initials: 'AS', avatar: 'https://i.pravatar.cc/150?u=ahmad' };
const user2: User = { id: 'user-2', name: 'Budi Santoso', initials: 'BS', avatar: 'https://i.pravatar.cc/150?u=budi' };
const user3: User = { id: 'user-3', name: 'Citra Lestari', initials: 'CL', avatar: 'https://i.pravatar.cc/150?u=citra' };
const user4: User = { id: 'user-4', name: 'Dewi Anggraini', initials: 'DA', avatar: 'https://i.pravatar.cc/150?u=dewi' };

export interface Project {
  id: string;
  name: string;
  description: string;
  owner: User;
  createdBy: User;
  status: ProjectStatus;
  paymentStatus: PaymentStatus;
  progress: number;
  value: number;
  budget: number;
  startDate: string;
  dueDate: string;
  deadline: string;
  paymentDue: string;
  paymentDueDate: string;
  activeTickets: number;
  rating: number;
  assignedTo: User[];
  category: string;
  tasks: Task[];
  tickets: Ticket[];
  services: Service[];
  briefFiles: File[];
  activity: Activity[];
}

export const dummyProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Platform E-commerce',
    description: 'Membangun toko online baru dari awal.',
    owner: user1,
    createdBy: user1,
    status: 'On Track',
    paymentStatus: 'Paid',
    progress: 75,
    value: 750000000,
    budget: 750000000,
    startDate: '2023-01-15',
    dueDate: '2023-08-30',
    deadline: '2023-08-30',
    paymentDue: '2023-09-15',
    paymentDueDate: '2023-09-15',
    activeTickets: 3,
    rating: 4,
    assignedTo: [user1, user2, user3],
    category: 'Web Development',
    tasks: [{ id: 'task-1', title: 'Design UI/UX', completed: true }, { id: 'task-2', title: 'Develop Frontend', completed: true }, { id: 'task-3', title: 'Develop Backend', completed: false }],
    tickets: [{ id: 't-1', title: 'Bug in cart', status: 'Open', priority: 'High', lastUpdate: '2023-08-20' }],
    services: [{ name: 'Web Development', price: 500000000 }, { name: 'UI/UX Design', price: 250000000 }],
    briefFiles: [{ name: 'brief.pdf', size: '1.2MB', url: '#' }],
    activity: [{ id: 'act-1', user: user1, action: 'created project', target: 'Platform E-commerce', date: '2023-01-15' }],
  },
  {
    id: 'proj-2',
    name: 'Aplikasi Seluler untuk Kebugaran',
    description: 'Aplikasi lintas platform untuk melacak latihan.',
    owner: user2,
    createdBy: user2,
    status: 'At Risk',
    paymentStatus: 'Pending',
    progress: 40,
    value: 1125000000,
    budget: 1125000000,
    startDate: '2023-03-01',
    dueDate: '2023-10-15',
    deadline: '2023-10-15',
    paymentDue: '2023-11-01',
    paymentDueDate: '2023-11-01',
    activeTickets: 8,
    rating: 3,
    assignedTo: [user2, user4],
    category: 'Mobile App',
    tasks: [{ id: 'task-4', title: 'Setup React Native', completed: true }, { id: 'task-5', title: 'Integrate with Strava', completed: false }],
    tickets: [],
    services: [{ name: 'Mobile App Development', price: 1125000000 }],
    briefFiles: [],
    activity: [],
  },
  {
    id: 'proj-3',
    name: 'Dasbor Analitik Data',
    description: 'Dasbor internal untuk memvisualisasikan data penjualan.',
    owner: user3,
    createdBy: user3,
    status: 'Completed',
    paymentStatus: 'Paid',
    progress: 100,
    value: 450000000,
    budget: 450000000,
    startDate: '2023-02-01',
    dueDate: '2023-06-30',
    deadline: '2023-06-30',
    paymentDue: '2023-07-15',
    paymentDueDate: '2023-07-15',
    activeTickets: 0,
    rating: 5,
    assignedTo: [user3, user4],
    category: 'Data Science',
    tasks: [],
    tickets: [],
    services: [],
    briefFiles: [],
    activity: [],
  },
  {
    id: 'proj-4',
    name: 'Migrasi Cloud',
    description: 'Memigrasikan server on-premise ke AWS.',
    owner: user1,
    createdBy: user1,
    status: 'Off Track',
    paymentStatus: 'Overdue',
    progress: 20,
    value: 1800000000,
    budget: 1800000000,
    startDate: '2023-05-10',
    dueDate: '2023-12-20',
    deadline: '2023-12-20',
    paymentDue: '2024-01-05',
    paymentDueDate: '2024-01-05',
    activeTickets: 12,
    rating: 2,
    assignedTo: [user1, user2, user3, user4],
    category: 'Infrastructure',
    tasks: [],
    tickets: [],
    services: [],
    briefFiles: [],
    activity: [],
  },
];