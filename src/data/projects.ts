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
  budget: number;
  deadline: string;
  tickets?: {
    open: number;
    total: number;
  };
}

export const dummyProjects: Project[] = [
  {
    id: "prj-001",
    name: "E-commerce Platform",
    description: "Developing a full-featured e-commerce platform with a modern tech stack.",
    assignedTo: {
      name: "John Doe",
      avatar: "https://i.pravatar.cc/150?u=john",
    },
    status: "In Progress",
    paymentStatus: "Paid",
    budget: 150000000,
    deadline: "2024-12-31",
    tickets: { open: 3, total: 5 },
  },
  {
    id: "prj-002",
    name: "Mobile Banking App",
    description: "Creating a secure and user-friendly mobile banking application for iOS and Android.",
    assignedTo: {
      name: "Jane Smith",
      avatar: "https://i.pravatar.cc/150?u=jane",
    },
    status: "Completed",
    paymentStatus: "Paid",
    budget: 250000000,
    deadline: "2024-06-30",
    tickets: { open: 0, total: 8 },
  },
  {
    id: "prj-003",
    name: "CRM System Integration",
    description: "Integrating a new CRM system with existing company infrastructure.",
    assignedTo: {
      name: "Mike Johnson",
      avatar: "https://i.pravatar.cc/150?u=mike",
    },
    status: "In Progress",
    paymentStatus: "Pending",
    budget: 80000000,
    deadline: "2024-09-15",
    tickets: { open: 1, total: 2 },
  },
  {
    id: "prj-004",
    name: "Website Redesign",
    description: "A complete overhaul of the corporate website with a focus on UX and performance.",
    assignedTo: {
      name: "Emily Davis",
      avatar: "https://i.pravatar.cc/150?u=emily",
    },
    status: "On Hold",
    paymentStatus: "Overdue",
    budget: 50000000,
    deadline: "2024-08-20",
    tickets: { open: 0, total: 0 },
  },
  {
    id: "prj-005",
    name: "Data Analytics Dashboard",
    description: "Building a real-time data analytics dashboard for marketing and sales teams.",
    assignedTo: {
      name: "Chris Wilson",
      avatar: "https://i.pravatar.cc/150?u=chris",
    },
    status: "Completed",
    paymentStatus: "Paid",
    budget: 120000000,
    deadline: "2024-05-10",
    tickets: { open: 0, total: 4 },
  },
];