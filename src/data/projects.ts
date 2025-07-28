export interface AssignedUser {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  role?: string;
  status?: 'Online' | 'Offline';
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  assignedTo?: string[];
}

export interface Activity {
  id: string;
  text: string;
  timestamp: string;
  user: {
    name: string;
    avatar?: string;
  };
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: "Requested" | "In Progress" | "Completed" | "On Hold" | "Cancelled" | "Done" | "Billed";
  progress: number;
  startDate: string;
  deadline: string;
  paymentDueDate?: string;
  budget: number;
  paymentStatus: "proposed" | "pending" | "paid" | "overdue" | "approved" | "po_created" | "on_process" | "cancelled";
  createdBy: AssignedUser;
  assignedTo: AssignedUser[];
  services: string[];
  briefFiles?: File[];
  tasks?: Task[];
  activityFeed?: Activity[];
  tickets?: number;
  invoiceAttachmentUrl?: string;
}

// Data dummy untuk memastikan aplikasi dapat berjalan
export const dummyProjects: Project[] = [
  {
    id: "proj-1",
    name: "E-commerce Platform Development",
    description: "Building a full-featured e-commerce platform for a client, including a customer-facing storefront and an admin panel for managing products, orders, and customers.",
    status: "In Progress",
    progress: 65,
    startDate: "2024-05-01",
    deadline: "2024-09-30",
    budget: 750000000,
    paymentStatus: "pending",
    createdBy: { id: "user-1", name: "Alice Johnson", avatar: "https://i.pravatar.cc/150?u=alice" },
    assignedTo: [
      { id: "user-2", name: "Bob Williams", avatar: "https://i.pravatar.cc/150?u=bob" },
      { id: "user-3", name: "Charlie Brown", avatar: "https://i.pravatar.cc/150?u=charlie" },
      { id: "user-4", name: "Diana Prince", avatar: "https://i.pravatar.cc/150?u=diana" },
    ],
    services: ["Web Development", "UI/UX Design", "API Integration"],
    tasks: [
      { id: "task-1", text: "Design homepage and product pages", completed: true, assignedTo: ["user-3"] },
      { id: "task-2", text: "Set up PostgreSQL database schema", completed: true, assignedTo: ["user-2"] },
      { id: "task-3", text: "Develop REST API for products and orders", completed: true, assignedTo: ["user-2"] },
      { id: "task-4", text: "Implement user authentication", completed: false, assignedTo: ["user-4"] },
      { id: "task-5", text: "Build frontend for product catalog", completed: false, assignedTo: ["user-3"] },
    ],
    activityFeed: [
      { id: 'act-1', text: 'Bob completed "Develop REST API for products and orders"', timestamp: '2024-06-20T14:00:00Z', user: { name: 'Bob Williams' } },
      { id: 'act-2', text: 'Alice added a new file "project-brief-v2.pdf"', timestamp: '2024-06-19T11:30:00Z', user: { name: 'Alice Johnson' } }
    ],
    briefFiles: [],
    tickets: 5,
    invoiceAttachmentUrl: "https://example.com/invoice.pdf",
  },
];