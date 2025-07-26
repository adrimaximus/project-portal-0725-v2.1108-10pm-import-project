export type AssignedUser = {
  id: string;
  name: string;
  avatar: string;
  status?: 'Online' | 'Offline';
};

export type Project = {
  id: string;
  name: string;
  status: "Requested" | "In Progress" | "Completed" | "Billed" | "On Hold" | "Cancelled" | "Done";
  assignedTo: AssignedUser[];
  progress: number;
  startDate: string;
  deadline: string;
  projectValue: number;
  paymentStatus: "Paid" | "Pending" | "Overdue";
  paymentDueDate?: string;
  tickets?: number;
  invoiceAttachmentUrl?: string;
  description?: string;
  services?: string[];
};

export const dummyProjects: Project[] = [
  {
    id: "PROJ-001",
    name: "E-commerce Platform Development",
    status: "In Progress",
    assignedTo: [
      { id: "user-1", name: "Alice Johnson", avatar: "https://i.pravatar.cc/150?u=alice", status: "Online" },
      { id: "user-2", name: "Bob Williams", avatar: "https://i.pravatar.cc/150?u=bob", status: "Offline" },
      { id: "user-3", name: "Charlie Brown", avatar: "https://i.pravatar.cc/150?u=charlie", status: "Online" },
      { id: "user-4", name: "Diana Prince", avatar: "https://i.pravatar.cc/150?u=diana", status: "Online" },
    ],
    progress: 75,
    startDate: "2023-01-15",
    deadline: "2024-06-30",
    projectValue: 50000000,
    paymentStatus: "Pending",
    paymentDueDate: "2024-07-15",
    tickets: 3,
    invoiceAttachmentUrl: "https://example.com/invoice.pdf",
    description: "Developing a full-featured e-commerce platform with a custom CMS and payment gateway integration. The project is currently in the final stages of testing.",
    services: ["UI/UX Design", "Frontend Development", "Backend Development", "Payment Integration"],
  },
  {
    id: "PROJ-002",
    name: "Mobile Banking App",
    status: "Completed",
    assignedTo: [
      { id: "user-5", name: "Ethan Hunt", avatar: "https://i.pravatar.cc/150?u=ethan", status: "Offline" },
    ],
    progress: 100,
    startDate: "2023-03-01",
    deadline: "2024-08-20",
    projectValue: 75000000,
    paymentStatus: "Paid",
    paymentDueDate: "2024-09-01",
    tickets: 0,
    description: "A secure and user-friendly mobile banking application for iOS and Android.",
    services: ["Mobile App Design", "iOS Development", "Android Development"],
  },
  {
    id: "PROJ-003",
    name: "Data Analytics Dashboard",
    status: "On Hold",
    assignedTo: [
      { id: "user-6", name: "Fiona Glenanne", avatar: "https://i.pravatar.cc/150?u=fiona", status: "Online" },
      { id: "user-7", name: "Sam Axe", avatar: "https://i.pravatar.cc/150?u=sam", status: "Offline" },
    ],
    progress: 40,
    startDate: "2023-05-10",
    deadline: "2024-10-31",
    projectValue: 30000000,
    paymentStatus: "Pending",
    tickets: 1,
    description: "A web-based dashboard for visualizing sales and marketing data. Project is on hold pending client feedback.",
    services: ["Data Visualization", "BI Integration"],
  },
  {
    id: "PROJ-004",
    name: "Cloud Migration",
    status: "Billed",
    assignedTo: [
      { id: "user-8", name: "Grace O'Malley", avatar: "https://i.pravatar.cc/150?u=grace", status: "Online" },
    ],
    progress: 100,
    startDate: "2023-02-20",
    deadline: "2024-05-30",
    projectValue: 45000000,
    paymentStatus: "Overdue",
    paymentDueDate: "2024-06-15",
    invoiceAttachmentUrl: "https://example.com/invoice.pdf",
    description: "Migration of on-premise servers to a cloud infrastructure.",
    services: ["Cloud Infrastructure", "DevOps", "Server Migration"],
  },
  {
    id: "PROJ-005",
    name: "Website Redesign",
    status: "Cancelled",
    assignedTo: [],
    progress: 10,
    startDate: "2023-08-01",
    deadline: "2024-12-01",
    projectValue: 15000000,
    paymentStatus: "Pending",
    description: "A complete redesign of the corporate website. Project was cancelled due to a shift in business strategy.",
    services: ["Web Design", "Branding"],
  },
];