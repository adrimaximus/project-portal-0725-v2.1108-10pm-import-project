export type Project = {
  id: string;
  name: string;
  description?: string;
  services?: string[];
  assignedTo: {
    name: string;
    avatar: string;
  }[];
  status: "In Progress" | "Completed" | "Billed" | "On Hold" | "Pending";
  progress: number;
  startDate: string;
  deadline: string;
  paymentDueDate?: string;
  paymentStatus?: 'Paid' | 'Overdue' | 'Pending';
  tickets?: number;
  budget: number;
  invoiceAttachmentUrl?: string;
};

export const dummyProjects: Project[] = [
  {
    id: "PROJ-001",
    name: "E-commerce Platform Development",
    description: "Building a full-featured e-commerce platform from scratch for a leading retail client.",
    services: ["Web Development", "UI/UX Design", "Backend API", "QA Testing"],
    assignedTo: [
      { name: "Alice Johnson", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d" },
      { name: "Bob Williams", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026705d" },
    ],
    status: "In Progress",
    progress: 75,
    startDate: "2023-01-15",
    deadline: "2023-06-30",
    paymentDueDate: "2023-07-15",
    paymentStatus: "Pending",
    tickets: 3,
    budget: 50000000,
    invoiceAttachmentUrl: "/invoices/PROJ-001.pdf",
  },
  {
    id: "PROJ-002",
    name: "Mobile Banking App",
    description: "Developing a secure and user-friendly mobile banking application for iOS and Android.",
    services: ["Mobile App Development", "Security Auditing"],
    assignedTo: [
      { name: "Charlie Brown", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026706d" },
    ],
    status: "Completed",
    progress: 100,
    startDate: "2023-02-01",
    deadline: "2023-05-31",
    paymentDueDate: "2023-06-15",
    paymentStatus: "Paid",
    tickets: 0,
    budget: 75000000,
    invoiceAttachmentUrl: "/invoices/PROJ-002.pdf",
  },
  {
    id: "PROJ-003",
    name: "CRM System Integration",
    description: "Integrating a new CRM system with existing sales and marketing tools.",
    services: ["API Integration", "Data Migration"],
    assignedTo: [
      { name: "Diana Prince", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026707d" },
      { name: "Eve Adams", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026708d" },
      { name: "Frank Miller", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026709d" },
    ],
    status: "Billed",
    progress: 100,
    startDate: "2023-03-10",
    deadline: "2023-07-20",
    paymentDueDate: "2023-08-01",
    paymentStatus: "Pending",
    tickets: 1,
    budget: 40000000,
    invoiceAttachmentUrl: "/invoices/PROJ-003.pdf",
  },
  {
    id: "PROJ-004",
    name: "Website Redesign",
    description: "A complete overhaul of the corporate website with a modern design and improved user experience.",
    services: ["UI/UX Design", "Frontend Development"],
    assignedTo: [
      { name: "Grace Hopper", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026710d" },
    ],
    status: "On Hold",
    progress: 20,
    startDate: "2023-04-05",
    deadline: "2023-08-31",
    budget: 25000000,
  },
  {
    id: "PROJ-005",
    name: "Data Analytics Dashboard",
    description: "Creating a real-time data analytics dashboard for business intelligence.",
    services: ["Data Visualization", "Backend Development"],
    assignedTo: [
      { name: "Heidi Lamar", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026711d" },
      { name: "Ivan Petrov", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026712d" },
    ],
    status: "In Progress",
    progress: 40,
    startDate: "2023-05-20",
    deadline: "2023-09-30",
    paymentDueDate: "2023-10-15",
    paymentStatus: "Pending",
    tickets: 5,
    budget: 60000000,
  },
];