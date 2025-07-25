export type Project = {
  id: string;
  name: string;
  description: string;
  assignedTo: { name: string; avatar: string; status: 'online' | 'offline' }[];
  status: "Completed" | "In Progress" | "On Hold" | "Pending";
  progress: number;
  startDate: string; // YYYY-MM-DD
  deadline: string; // YYYY-MM-DD
  paymentStatus: "Paid" | "Pending" | "Overdue";
  paymentDueDate?: string; // YYYY-MM-DD
  budget: number;
  tickets?: number;
  services: string[];
  invoiceAttachmentUrl?: string;
};

export const dummyProjects: Project[] = [
  {
    id: "PROJ-001",
    name: "E-commerce Platform Development",
    description: "Building a full-featured e-commerce website from scratch.",
    assignedTo: [
      { name: "John Doe", avatar: "https://i.pravatar.cc/150?u=john", status: 'online' },
      { name: "Jane Smith", avatar: "https://i.pravatar.cc/150?u=jane", status: 'offline' },
    ],
    status: "In Progress",
    progress: 65,
    startDate: "2024-06-01",
    deadline: "2024-12-31",
    paymentStatus: "Pending",
    paymentDueDate: "2024-08-15",
    budget: 50000000,
    tickets: 3,
    services: ["Web Development", "UI/UX Design"],
    invoiceAttachmentUrl: "https://example.com/invoice.pdf",
  },
  {
    id: "PROJ-002",
    name: "Mobile App for Fitness Tracking",
    description: "A native mobile application for iOS and Android.",
    assignedTo: [
      { name: "Alex Johnson", avatar: "https://i.pravatar.cc/150?u=alex", status: 'online' },
    ],
    status: "Completed",
    progress: 100,
    startDate: "2024-01-15",
    deadline: "2024-07-20",
    paymentStatus: "Paid",
    paymentDueDate: "2024-07-25",
    budget: 75000000,
    tickets: 0,
    services: ["Mobile Development"],
  },
  {
    id: "PROJ-003",
    name: "Corporate Branding Redesign",
    description: "Complete overhaul of the company's brand identity.",
    assignedTo: [
      { name: "Emily White", avatar: "https://i.pravatar.cc/150?u=emily", status: 'online' },
      { name: "Chris Green", avatar: "https://i.pravatar.cc/150?u=chris", status: 'online' },
      { name: "Michael Brown", avatar: "https://i.pravatar.cc/150?u=michael", status: 'offline' },
      { name: "Sarah Black", avatar: "https://i.pravatar.cc/150?u=sarah", status: 'online' },
    ],
    status: "On Hold",
    progress: 30,
    startDate: "2024-05-10",
    deadline: "2024-11-30",
    paymentStatus: "Pending",
    budget: 30000000,
    tickets: 1,
    services: ["Branding", "Graphic Design"],
  },
  {
    id: "PROJ-004",
    name: "SEO & Digital Marketing Campaign",
    description: "Increasing online visibility and lead generation.",
    assignedTo: [
      { name: "David Wilson", avatar: "https://i.pravatar.cc/150?u=david", status: 'offline' },
    ],
    status: "In Progress",
    progress: 80,
    startDate: "2024-07-01",
    deadline: "2024-10-31",
    paymentStatus: "Overdue",
    paymentDueDate: "2024-07-15",
    budget: 25000000,
    tickets: 5,
    services: ["SEO", "Digital Marketing"],
    invoiceAttachmentUrl: "https://example.com/invoice.pdf",
  },
  {
    id: "PROJ-005",
    name: "Cloud Infrastructure Migration",
    description: "Migrating on-premise servers to AWS.",
    assignedTo: [
      { name: "Laura Taylor", avatar: "https://i.pravatar.cc/150?u=laura", status: 'online' },
      { name: "Robert Miller", avatar: "https://i.pravatar.cc/150?u=robert", status: 'online' },
    ],
    status: "Pending",
    progress: 0,
    startDate: "2024-09-01",
    deadline: "2025-02-28",
    paymentStatus: "Pending",
    budget: 120000000,
    tickets: 0,
    services: ["Cloud Services"],
  },
];