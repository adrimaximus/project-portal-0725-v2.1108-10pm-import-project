export type Project = {
  id: string;
  name: string;
  description: string;
  status: "Completed" | "In Progress" | "On Hold" | "Pending";
  progress: number;
  deadline: string; // yyyy-MM-dd
  budget: number;
  paymentStatus: "Paid" | "Pending" | "Overdue";
  assignedTo: {
    name: string;
    avatar: string;
  };
  services: string[];
  tickets?: {
    count: number;
    open: number;
  };
  paymentDueDate?: string; // yyyy-MM-dd
  invoiceAttachmentUrl?: string;
};

export const dummyProjects: Project[] = [
  {
    id: "proj-1",
    name: "E-commerce Platform Development",
    description: "Building a new online marketplace for local artisans.",
    status: "In Progress",
    progress: 65,
    deadline: "2024-12-15",
    budget: 150000000,
    paymentStatus: "Pending",
    assignedTo: {
      name: "Ethan Carter",
      avatar: "https://i.pravatar.cc/150?u=ethan",
    },
    services: ["Web Development", "UI/UX Design", "API Integration"],
    tickets: { count: 3, open: 2 },
    paymentDueDate: "2024-12-22",
    invoiceAttachmentUrl: "/invoices/inv-001.pdf",
  },
  {
    id: "proj-2",
    name: "Mobile Banking App",
    description: "Creating a secure and user-friendly mobile banking application.",
    status: "Completed",
    progress: 100,
    deadline: "2024-06-30",
    budget: 250000000,
    paymentStatus: "Paid",
    assignedTo: {
      name: "Ava Rodriguez",
      avatar: "https://i.pravatar.cc/150?u=ava",
    },
    services: ["Mobile Development", "Security Audit"],
    tickets: { count: 0, open: 0 },
    paymentDueDate: "2024-07-07",
    invoiceAttachmentUrl: "/invoices/inv-002.pdf",
  },
  {
    id: "proj-3",
    name: "Internal CRM System",
    description: "Developing a custom CRM to manage customer relationships.",
    status: "On Hold",
    progress: 20,
    deadline: "2025-02-28",
    budget: 80000000,
    paymentStatus: "Pending",
    assignedTo: {
      name: "Noah Kim",
      avatar: "https://i.pravatar.cc/150?u=noah",
    },
    services: ["Web Development", "Database Management"],
    tickets: { count: 1, open: 1 },
    paymentDueDate: "2025-03-07",
  },
];