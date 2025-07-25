export type Project = {
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
};

export const dummyProjects: Project[] = [
  {
    id: "PROJ-001",
    name: "E-commerce Platform",
    description:
      "A comprehensive e-commerce platform with features like product management, order processing, and a customer-facing storefront. Built with a modern tech stack for scalability and performance.",
    assignedTo: {
      name: "Alice Johnson",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    },
    status: "In Progress",
    paymentStatus: "Paid",
    budget: 1125000000,
    deadline: "2024-12-31",
  },
  {
    id: "PROJ-002",
    name: "Mobile App for iOS",
    description:
      "A native iOS application for social networking. Includes features like real-time chat, user profiles, and an event feed. Designed with a focus on user experience and a clean interface.",
    assignedTo: {
      name: "Bob Williams",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026705d",
    },
    status: "Completed",
    paymentStatus: "Paid",
    budget: 1800000000,
    deadline: "2024-09-01",
  },
  {
    id: "PROJ-003",
    name: "Marketing Website",
    description:
      "A responsive marketing website to showcase company services and generate leads. Includes a blog, contact forms, and integration with a CRM. Optimized for SEO and fast loading times.",
    assignedTo: {
      name: "Charlie Brown",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026706d",
    },
    status: "In Progress",
    paymentStatus: "Pending",
    budget: 375000000,
    deadline: "2024-11-15",
  },
  {
    id: "PROJ-004",
    name: "Data Analytics Dashboard",
    description:
      "A web-based dashboard for visualizing key business metrics. Connects to multiple data sources and provides interactive charts and reports to help with data-driven decision making.",
    assignedTo: {
      name: "Diana Prince",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026707d",
    },
    status: "On Hold",
    paymentStatus: "Pending",
    budget: 825000000,
    deadline: "2025-02-28",
  },
  {
    id: "PROJ-005",
    name: "Internal CRM Tool",
    description:
      "A custom Customer Relationship Management (CRM) tool to manage sales pipelines and customer interactions. Tailored to the specific workflow of the sales team to improve efficiency.",
    assignedTo: {
      name: "Ethan Hunt",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026708d",
    },
    status: "Completed",
    paymentStatus: "Overdue",
    budget: 1425000000,
    deadline: "2024-07-20",
  },
];