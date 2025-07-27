import { allUsers } from './users';
import { AssignedUser } from './types';

export type { AssignedUser };

export interface Comment {
  id: string;
  author: AssignedUser;
  timestamp: Date;
  content: string;
  isInternal: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: "Requested" | "In Progress" | "Completed" | "Billed" | "On Hold" | "Cancelled" | "Done";
  progress: number;
  startDate: string;
  deadline: string;
  paymentDueDate?: string;
  budget: number;
  paymentStatus: "proposed" | "approved" | "po_created" | "on_process" | "pending" | "paid" | "cancelled";
  assignedTo: AssignedUser[];
  services: string[];
  briefFiles?: File[];
  comments?: Comment[];
  invoiceAttachmentUrl?: string;
}

export const dummyProjects: Project[] = [
  {
    id: "proj-1",
    name: "E-commerce Platform",
    description: "Developing a new e-commerce platform with a focus on user experience and scalability. The platform will feature a modern design, easy navigation, and a secure checkout process.",
    status: "In Progress",
    progress: 65,
    startDate: "2024-05-15",
    deadline: "2024-09-30",
    paymentDueDate: "2024-10-15",
    budget: 120000000,
    paymentStatus: "pending",
    assignedTo: [allUsers[0], allUsers[2]],
    services: ["Web Development", "UI/UX Design"],
    comments: [
      {
        id: 'comment-1-1',
        author: allUsers[0],
        timestamp: new Date('2024-07-29T10:00:00Z'),
        content: "Initial project brief is uploaded. Please review.",
        isInternal: false,
      },
      {
        id: 'comment-1-2',
        author: allUsers[2],
        timestamp: new Date('2024-07-29T14:30:00Z'),
        content: "Reviewed. Looks good. Let's schedule a kickoff meeting.",
        isInternal: true,
      }
    ]
  },
  {
    id: "proj-2",
    name: "Mobile Banking App",
    description: "Creating a secure and user-friendly mobile banking application for iOS and Android. Key features include fund transfers, bill payments, and account statement viewing.",
    status: "Completed",
    progress: 100,
    startDate: "2024-03-01",
    deadline: "2024-07-20",
    paymentDueDate: "2024-08-05",
    budget: 250000000,
    paymentStatus: "paid",
    assignedTo: [allUsers[1], allUsers[3], allUsers[4]],
    services: ["Mobile App Development", "API Integration"],
    comments: [
        {
            id: 'comment-2-1',
            author: allUsers[1],
            timestamp: new Date('2024-07-28T10:30:00Z'),
            content: "The final version has been deployed to production.",
            isInternal: false,
        }
    ]
  },
  {
    id: "proj-3",
    name: "Social Media Campaign",
    description: "Launching a comprehensive social media campaign to increase brand awareness and engagement. The campaign will run on major platforms like Instagram, Facebook, and Twitter.",
    status: "On Hold",
    progress: 20,
    startDate: "2024-06-01",
    deadline: "2024-08-31",
    budget: 50000000,
    paymentStatus: "pending",
    assignedTo: [allUsers[5]],
    services: ["Digital Marketing"],
    comments: [],
  },
  {
    id: "proj-4",
    name: "Corporate Rebranding",
    description: "Complete corporate rebranding including a new logo, brand guidelines, and marketing materials. The goal is to modernize the brand image and appeal to a younger demographic.",
    status: "Requested",
    progress: 0,
    startDate: "2024-07-10",
    deadline: "2024-11-25",
    budget: 85000000,
    paymentStatus: "proposed",
    assignedTo: [allUsers[0], allUsers[5]],
    services: ["Branding", "Graphic Design"],
    comments: [
        {
            id: 'comment-4-1',
            author: allUsers[5],
            timestamp: new Date('2024-07-25T09:00:00Z'),
            content: "Can we get the new logo concepts by end of week?",
            isInternal: false,
        }
    ],
  },
  {
    id: "proj-5",
    name: "CRM System Implementation",
    description: "Implementing a new CRM system to streamline sales and customer service processes. This includes data migration, user training, and system customization.",
    status: "Billed",
    progress: 100,
    startDate: "2024-02-10",
    deadline: "2024-06-30",
    paymentDueDate: "2024-07-15",
    budget: 150000000,
    paymentStatus: "paid",
    assignedTo: [allUsers[1], allUsers[6]],
    services: ["System Integration", "Consulting"],
    comments: [],
  },
];