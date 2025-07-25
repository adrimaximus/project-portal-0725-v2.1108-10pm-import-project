export interface Project {
  id: string;
  name: string;
  description: string;
  assignedTo: {
    name: string;
    avatar: string;
  };
  status: "Completed" | "In Progress" | "On Hold";
  paymentStatus: "Paid" | "Pending" | "Overdue";
  tickets?: {
    open: number;
    total: number;
  };
  budget: number;
  deadline: string;
  paymentDueDate: string;
  invoiceAttachmentUrl?: string;
}

export const dummyProjects: Project[] = [
  {
    id: "PROJ-001",
    name: "E-commerce Platform",
    description: "Development of a full-featured e-commerce platform with a custom CMS.",
    assignedTo: { name: "John Doe", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d" },
    status: "Completed",
    paymentStatus: "Paid",
    tickets: { open: 0, total: 10 },
    budget: 50000000,
    deadline: "2024-08-15",
    paymentDueDate: "2024-08-20",
    invoiceAttachmentUrl: "/invoices/invoice-001.pdf",
  },
  {
    id: "PROJ-002",
    name: "Mobile Banking App",
    description: "Create a secure and user-friendly mobile banking application for iOS and Android.",
    assignedTo: { name: "Jane Smith", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d" },
    status: "In Progress",
    paymentStatus: "Pending",
    tickets: { open: 3, total: 5 },
    budget: 75000000,
    deadline: "2024-09-20",
    paymentDueDate: "2024-09-25",
    invoiceAttachmentUrl: "/invoices/invoice-002.pdf",
  },
  {
    id: "PROJ-003",
    name: "CRM Integration",
    description: "Integrate the new CRM system with existing sales and marketing tools.",
    assignedTo: { name: "Peter Jones", avatar: "https://i.pravatar.cc/150?u=a04258114e29026702d" },
    status: "On Hold",
    paymentStatus: "Overdue",
    tickets: { open: 1, total: 2 },
    budget: 30000000,
    deadline: "2024-07-30",
    paymentDueDate: "2024-08-05",
  },
  {
    id: "PROJ-004",
    name: "Website Redesign",
    description: "Complete redesign of the corporate website with a focus on modern UI/UX.",
    assignedTo: { name: "Mary Johnson", avatar: "https://i.pravatar.cc/150?u=a048581f4e29026701d" },
    status: "In Progress",
    paymentStatus: "Paid",
    tickets: { open: 5, total: 8 },
    budget: 45000000,
    deadline: "2024-10-01",
    paymentDueDate: "2024-10-06",
    invoiceAttachmentUrl: "/invoices/invoice-004.pdf",
  },
  {
    id: "PROJ-005",
    name: "Data Analytics Dashboard",
    description: "Build a real-time data analytics dashboard for tracking key business metrics.",
    assignedTo: { name: "Chris Lee", avatar: "https://i.pravatar.cc/150?u=a092581f4e29026705d" },
    status: "Completed",
    paymentStatus: "Paid",
    tickets: { open: 0, total: 4 },
    budget: 60000000,
    deadline: "2024-06-30",
    paymentDueDate: "2024-07-05",
    invoiceAttachmentUrl: "/invoices/invoice-005.pdf",
  },
];