export type AssignedUser = {
  name: string;
  avatar: string;
  status: 'online' | 'offline';
};

export type Project = {
  id: string;
  name: string;
  description: string;
  status: "Completed" | "In Progress" | "On Hold" | "Pending";
  progress: number;
  deadline: string; // YYYY-MM-DD
  budget: number;
  paymentStatus: "Paid" | "Pending" | "Overdue";
  paymentDueDate?: string; // YYYY-MM-DD
  assignedTo: AssignedUser[];
  services: string[];
  tickets?: number;
  invoiceAttachmentUrl?: string;
};

export const dummyProjects: Project[] = [
  {
    id: "proj-1",
    name: "E-commerce Platform Development",
    description: "Building a full-featured e-commerce website from scratch.",
    status: "In Progress",
    progress: 65,
    deadline: "2024-12-15",
    budget: 150000000,
    paymentStatus: "Pending",
    paymentDueDate: "2024-08-30",
    assignedTo: [
      { name: "Ethan Carter", avatar: "https://i.pravatar.cc/150?u=ethan", status: 'offline' },
      { name: "Olivia Martin", avatar: "https://i.pravatar.cc/150?u=olivia", status: 'online' }
    ],
    services: ["Web Development", "UI/UX Design", "SEO Optimization"],
    tickets: 3,
    invoiceAttachmentUrl: "/invoices/inv-001.pdf",
  },
  {
    id: "proj-2",
    name: "Mobile Banking App",
    description: "Developing a secure and user-friendly mobile banking application.",
    status: "Completed",
    progress: 100,
    deadline: "2024-06-30",
    budget: 250000000,
    paymentStatus: "Paid",
    paymentDueDate: "2024-07-15",
    assignedTo: [
      { name: "Sophia Davis", avatar: "https://i.pravatar.cc/150?u=sophia", status: 'offline' },
    ],
    services: ["Mobile App Development", "API Integration"],
    tickets: 0,
    invoiceAttachmentUrl: "/invoices/inv-002.pdf",
  },
  {
    id: "proj-3",
    name: "Social Media Campaign",
    description: "Marketing campaign for a new product launch.",
    status: "On Hold",
    progress: 30,
    deadline: "2024-09-01",
    budget: 50000000,
    paymentStatus: "Pending",
    assignedTo: [
      { name: "Liam Brown", avatar: "https://i.pravatar.cc/150?u=liam", status: 'online' },
      { name: "Ava Garcia", avatar: "https://i.pravatar.cc/150?u=ava", status: 'offline' },
      { name: "Jackson Lee", avatar: "https://i.pravatar.cc/150?u=jackson", status: 'online' },
    ],
    services: ["Digital Marketing", "Content Creation"],
    tickets: 5,
  },
  {
    id: "proj-4",
    name: "Cloud Migration",
    description: "Migrating on-premise servers to AWS.",
    status: "In Progress",
    progress: 80,
    deadline: "2024-08-20",
    budget: 120000000,
    paymentStatus: "Paid",
    paymentDueDate: "2024-08-01",
    assignedTo: [
      { name: "Noah Rodriguez", avatar: "https://i.pravatar.cc/150?u=noah", status: 'online' },
    ],
    services: ["Cloud Services"],
    tickets: 1,
    invoiceAttachmentUrl: "/invoices/inv-004.pdf",
  },
  {
    id: "proj-5",
    name: "Brand Identity Redesign",
    description: "Complete redesign of the company's brand identity and logo.",
    status: "Pending",
    progress: 10,
    deadline: "2024-11-10",
    budget: 75000000,
    paymentStatus: "Pending",
    assignedTo: [
      { name: "Sophia Davis", avatar: "https://i.pravatar.cc/150?u=sophia", status: 'offline' },
      { name: "Liam Brown", avatar: "https://i.pravatar.cc/150?u=liam", status: 'online' },
    ],
    services: ["UI/UX Design", "Content Creation"],
    tickets: 2,
  },
];