export interface User {
  id: string;
  name: string;
  avatar?: string; // Dibuat opsional untuk kompatibilitas
  initials: string;
}

// Mengekspor sebagai AssignedUser untuk kompatibilitas dengan impor yang ada
export type AssignedUser = User;

export interface Task {
  id: string;
  text: string; // Diubah dari 'title' menjadi 'text' untuk konsistensi
  completed: boolean;
  assignedTo?: User[];
}

export interface Comment {
  id: string;
  text: string;
  author: User;
  createdAt: string;
  isTicket?: boolean;
}

export interface ProjectFile {
    id: string;
    name: string;
    url: string;
    size: string;
}

export interface Activity {
    id: string;
    type: 'comment' | 'file' | 'task' | 'status';
    user: User;
    timestamp: string;
    details: string;
}

export interface Project {
  id:string;
  name: string;
  category: string;
  description: string; // Ditambahkan
  status: 'On Track' | 'At Risk' | 'Off Track' | 'On Hold' | 'Completed' | 'Requested' | 'Done' | 'Billed' | 'In Progress' | 'Cancelled'; // Diperluas
  paymentStatus: 'Paid' | 'Pending' | 'Overdue' | 'Draft' | 'Proposed' | 'Approved' | 'PO Created' | 'On Process' | 'Cancelled' | 'paid' | 'approved' | 'po_created' | 'on_process' | 'pending' | 'cancelled' | 'proposed'; // Diperluas
  budget: number;
  progress: number;
  startDate: string;
  endDate: string;
  deadline?: string; // Ditambahkan
  paymentDueDate?: string;
  assignedTo: User[];
  createdBy?: User; // Ditambahkan
  tasks?: Task[];
  comments?: Comment[];
  tickets?: Comment[]; // Ditambahkan
  services?: string[];
  briefFiles?: ProjectFile[]; // Ditambahkan
  files?: ProjectFile[]; // Ditambahkan
}

const users: User[] = [
    { id: 'user-1', name: 'Alice Johnson', avatar: 'https://i.pravatar.cc/150?u=alice', initials: 'AJ' },
    { id: 'user-2', name: 'Bob Williams', avatar: 'https://i.pravatar.cc/150?u=bob', initials: 'BW' },
    { id: 'user-3', name: 'Charlie Brown', avatar: 'https://i.pravatar.cc/150?u=charlie', initials: 'CB' },
    { id: 'user-4', name: 'Diana Miller', avatar: 'https://i.pravatar.cc/150?u=diana', initials: 'DM' },
];

export const dummyProjects: Project[] = [
  {
    id: "proj-1",
    name: "E-commerce Platform",
    category: "Web Development",
    description: "Building a full-featured e-commerce platform with a modern tech stack.",
    status: "On Track",
    paymentStatus: "Paid",
    budget: 50000000,
    progress: 75,
    startDate: "2023-08-01",
    endDate: "2024-02-28",
    deadline: "2024-02-28",
    paymentDueDate: "2024-01-15",
    assignedTo: [users[0], users[1]],
    createdBy: users[0],
    services: ["Web Development", "UI/UX Design"],
    tasks: [{id: 't1', text: 'Implement payment gateway', completed: true, assignedTo: [users[1]]}],
    comments: [{id: 'c1', text: 'Initial project kickoff meeting notes.', author: users[0], createdAt: '2023-08-02'}],
    tickets: [{id: 'ticket-1', text: 'Login button not working on Firefox', author: users[1], createdAt: '2023-10-01', isTicket: true}],
    briefFiles: [{id: 'file-1', name: 'Project Brief.pdf', url: '#', size: '2.5 MB'}],
  },
  {
    id: "proj-2",
    name: "Mobile Banking App",
    category: "Mobile Development",
    description: "Developing a secure and user-friendly mobile banking application for iOS and Android.",
    status: "At Risk",
    paymentStatus: "Pending",
    budget: 75000000,
    progress: 40,
    startDate: "2023-09-15",
    endDate: "2024-05-30",
    deadline: "2024-05-30",
    paymentDueDate: "2024-02-20",
    assignedTo: [users[2], users[3], users[0]],
    createdBy: users[2],
    services: ["Mobile Development", "API Integration", "Security Audit"],
  },
  {
    id: "proj-3",
    name: "Data Analytics Dashboard",
    category: "Data Science",
    description: "A comprehensive dashboard for visualizing sales and marketing data.",
    status: "Completed",
    paymentStatus: "Paid",
    budget: 30000000,
    progress: 100,
    startDate: "2023-06-01",
    endDate: "2023-11-30",
    deadline: "2023-11-30",
    paymentDueDate: "2023-12-05",
    assignedTo: [users[1]],
    createdBy: users[1],
    services: ["Data Visualization", "ETL Pipeline"],
  },
  {
    id: "proj-4",
    name: "Branding for Startup X",
    category: "Marketing",
    description: "Complete branding package including logo, style guide, and marketing materials.",
    status: "On Hold",
    paymentStatus: "Draft",
    budget: 15000000,
    progress: 10,
    startDate: "2024-01-10",
    endDate: "2024-04-30",
    deadline: "2024-04-30",
    assignedTo: [users[0], users[3]],
    createdBy: users[3],
    services: ["Branding", "Logo Design"],
  },
  {
    id: "proj-5",
    name: "Cloud Migration",
    category: "Infrastructure",
    description: "Migrating on-premise servers to a cloud-based infrastructure.",
    status: "Off Track",
    paymentStatus: "Overdue",
    budget: 60000000,
    progress: 25,
    startDate: "2023-10-01",
    endDate: "2024-03-31",
    deadline: "2024-03-31",
    paymentDueDate: "2023-12-15",
    assignedTo: [users[1], users[2]],
    createdBy: users[2],
    services: ["Cloud Architecture", "DevOps"],
  }
];