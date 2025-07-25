import { Project } from "@/types";

// Mengekspor kembali tipe untuk memperbaiki kesalahan impor di file-file lama.
export type { Project };

export const dummyProjects: Project[] = [
  {
    id: "proj-1",
    name: "Website Redesign",
    description: "A complete overhaul of the company website to improve user experience and modernize the design.",
    status: "On Track",
    team: [
      { name: "Jane Doe", src: "https://i.pravatar.cc/40?u=a042581f4e29026704d", fallback: "JD" },
      { name: "John Smith", src: "https://i.pravatar.cc/40?u=a042581f4e29026705d", fallback: "JS" },
    ],
    assignedTo: { name: "Jane Doe", src: "https://i.pravatar.cc/40?u=a042581f4e29026704d", fallback: "JD" },
    progress: 75,
    lastUpdated: "3 jam yang lalu",
    budget: 25000,
    deadline: "2024-08-15",
    paymentStatus: "Paid",
    paymentDueDate: "2024-07-01",
    invoiceAttachmentUrl: "/invoices/inv-001.pdf",
    tickets: { open: 2, total: 10 },
  },
  {
    id: "proj-2",
    name: "Mobile App Launch",
    description: "Launch of the new mobile application for iOS and Android platforms.",
    status: "At Risk",
    team: [
        { name: "Peter Jones", src: "https://i.pravatar.cc/40?u=a042581f4e29026706d", fallback: "PJ" },
    ],
    assignedTo: { name: "Peter Jones", src: "https://i.pravatar.cc/40?u=a042581f4e29026706d", fallback: "PJ" },
    progress: 40,
    lastUpdated: "1 hari yang lalu",
    budget: 50000,
    deadline: "2024-09-01",
    paymentStatus: "Pending",
    paymentDueDate: "2024-07-20",
    invoiceAttachmentUrl: null,
    tickets: { open: 5, total: 8 },
  },
  {
    id: "proj-3",
    name: "API Integration",
    description: "Integrating a new third-party API for enhanced functionality.",
    status: "In Progress",
    team: [
      { name: "Sarah Miller", src: "https://i.pravatar.cc/40?u=a042581f4e29026707d", fallback: "SM" },
    ],
    assignedTo: { name: "Sarah Miller", src: "https://i.pravatar.cc/40?u=a042581f4e29026707d", fallback: "SM" },
    progress: 50,
    lastUpdated: "2 hari yang lalu",
    budget: 15000,
    deadline: "2024-07-30",
    paymentStatus: "Pending",
    paymentDueDate: "2024-07-15",
    invoiceAttachmentUrl: null,
    tickets: { open: 1, total: 3 },
  },
];