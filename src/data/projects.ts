export type Assignee = {
  name: string;
  avatar?: string;
  status?: 'Online' | 'Offline';
};

export type ProjectStatus =
  | "Requested"
  | "In Progress"
  | "Completed"
  | "Billed"
  | "On Hold"
  | "Cancelled"
  | "Done";

export type PaymentStatus = "Paid" | "Pending" | "Overdue";

export type Project = {
  id: string;
  name: string;
  client: string;
  startDate: string;
  deadline: string;
  status: ProjectStatus;
  budget: number;
  paymentStatus: PaymentStatus;
  paymentDueDate?: string;
  assignedTo: Assignee[];
  tickets?: number;
  description?: string;
  services?: string[];
  invoiceAttachmentUrl?: string;
};

export const dummyProjects: Project[] = [
  {
    id: "PRJ-001",
    name: "E-commerce Platform",
    client: "Tech Solutions Inc.",
    startDate: "2023-01-15",
    deadline: "2023-08-30",
    status: "Completed",
    budget: 50000000,
    paymentStatus: "Paid",
    paymentDueDate: "2023-09-15",
    assignedTo: [{ name: "Alice", status: 'Online' }, { name: "Bob", status: 'Offline' }],
    tickets: 3,
    description: "Development of a full-featured e-commerce platform with a custom CMS.",
    services: ["Web Development", "UI/UX Design", "CMS Integration"],
  },
  {
    id: "PRJ-002",
    name: "Mobile Banking App",
    client: "Global Bank",
    startDate: "2023-03-01",
    deadline: "2023-12-31",
    status: "In Progress",
    budget: 75000000,
    paymentStatus: "Pending",
    assignedTo: [{ name: "Charlie", status: 'Online' }],
    tickets: 5,
    description: "A native mobile application for iOS and Android for online banking services.",
    services: ["Mobile App Development", "API Integration", "Security Auditing"],
  },
  {
    id: "PRJ-003",
    name: "Data Analytics Dashboard",
    client: "Data Insights LLC",
    startDate: "2023-05-20",
    deadline: "2023-11-20",
    status: "On Hold",
    budget: 30000000,
    paymentStatus: "Pending",
    assignedTo: [{ name: "David", status: 'Offline' }, { name: "Eve", status: 'Online' }],
    tickets: 1,
    description: "A web-based dashboard for visualizing sales and marketing data.",
    services: ["Data Visualization", "Backend Development"],
  },
  {
    id: "PRJ-004",
    name: "New Website Design",
    client: "Creative Co.",
    startDate: "2023-09-01",
    deadline: "2023-10-15",
    status: "Requested",
    budget: 15000000,
    paymentStatus: "Pending",
    assignedTo: [{ name: "Frank", status: 'Online' }],
    description: "A complete redesign of the corporate website.",
    services: ["UI/UX Design", "Branding"],
  },
  {
    id: "PRJ-005",
    name: "Marketing Campaign",
    client: "AdWorks",
    startDate: "2023-06-10",
    deadline: "2023-07-30",
    status: "Done",
    budget: 20000000,
    paymentStatus: "Paid",
    paymentDueDate: "2023-08-10",
    assignedTo: [{ name: "Grace", status: 'Offline' }],
    tickets: 0,
    description: "Digital marketing campaign for a new product launch.",
    services: ["Social Media Marketing", "Content Creation"],
  },
  {
    id: "PRJ-006",
    name: "Internal CRM Tool",
    client: "Internal",
    startDate: "2023-04-01",
    deadline: "2023-09-01",
    status: "Cancelled",
    budget: 40000000,
    paymentStatus: "Pending",
    assignedTo: [{ name: "Heidi", status: 'Offline' }],
    description: "Development of an internal tool for managing customer relationships.",
    services: ["Web Development"],
  },
  {
    id: "PRJ-007",
    name: "API Integration",
    client: "ConnectApp",
    startDate: "2023-08-15",
    deadline: "2023-10-30",
    status: "Billed",
    budget: 25000000,
    paymentStatus: "Pending",
    paymentDueDate: "2023-11-15",
    assignedTo: [{ name: "Ivan", status: 'Online' }, { name: "Judy", status: 'Online' }],
    tickets: 2,
    description: "Integration with third-party payment and shipping APIs.",
    services: ["API Integration", "Backend Development"],
    invoiceAttachmentUrl: "/invoices/inv-007.pdf",
  },
];