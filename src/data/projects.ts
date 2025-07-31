import { User } from "./users";

export interface AssignedUser {
  id: string;
  name: string;
  avatar: string;
  role: string;
  status?: 'Online' | 'Offline';
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  assignedTo?: string[];
}

export interface Activity {
  id: string;
  text: string;
  timestamp: string;
  user: User;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: "Requested" | "In Progress" | "Completed" | "Billed" | "On Hold" | "Cancelled" | "Done";
  paymentStatus: "proposed" | "approved" | "po_created" | "on_process" | "pending" | "paid" | "cancelled" | "billed";
  budget: number;
  startDate: string; // "YYYY-MM-DD"
  deadline: string; // "YYYY-MM-DD"
  paymentDueDate?: string; // "YYYY-MM-DD"
  createdBy: AssignedUser;
  assignedTo: AssignedUser[];
  services: string[];
  briefFiles?: File[];
  tasks?: Task[];
  progress?: number;
  tickets?: number;
  activities?: Activity[];
}

const user1: AssignedUser = { id: 'user-1', name: 'Alex Mahmberg', avatar: 'https://i.pravatar.cc/150?u=alex', role: 'Project Manager', status: 'Online' };
const user2: AssignedUser = { id: 'user-2', name: 'Samantha Carter', avatar: 'https://i.pravatar.cc/150?u=samantha', role: 'Lead Designer', status: 'Offline' };
const user3: AssignedUser = { id: 'user-3', name: 'John Doe', avatar: 'https://i.pravatar.cc/150?u=john', role: 'Developer', status: 'Online' };
const user4: AssignedUser = { id: 'user-4', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?u=jane', role: 'Marketing Lead', status: 'Online' };

export const dummyProjects: Project[] = [
  {
    id: "PROJ-001",
    name: "E-commerce Platform Launch",
    description: "<p>Complete overhaul of the company website, focusing on user experience and modern design principles. This project involves migrating from our legacy platform to a new, scalable solution with enhanced features for both customers and administrators.</p>",
    status: "In Progress",
    paymentStatus: "on_process",
    budget: 75000,
    startDate: "2024-06-01",
    deadline: "2024-09-30",
    paymentDueDate: "2024-10-15",
    createdBy: user1,
    assignedTo: [user1, user2, user3],
    services: ["3D Graphic Design", "Digital Marketing", "Web Development"],
    briefFiles: [],
    tasks: [
      { id: "task-1", text: "Finalize UI/UX mockups", completed: true, assignedTo: [user2.id] },
      { id: "task-2", text: "Develop frontend architecture", completed: true, assignedTo: [user3.id] },
      { id: "task-3", text: "Integrate payment gateway", completed: false, assignedTo: [user3.id] },
      { id: "task-4", text: "Set up marketing campaign", completed: false, assignedTo: [user4.id] },
    ],
    progress: 50,
    tickets: 2,
  },
  {
    id: "PROJ-002",
    name: "Annual Tech Conference",
    description: "<p>Organize and manage the annual technology conference, including venue selection, speaker coordination, and event marketing.</p>",
    status: "Completed",
    paymentStatus: "paid",
    budget: 120000,
    startDate: "2024-02-01",
    deadline: "2024-05-20",
    paymentDueDate: "2024-06-01",
    createdBy: user4,
    assignedTo: [user1, user4],
    services: ["Event Management", "Venue Sourcing", "Digital Marketing"],
    tasks: [],
    progress: 100,
    tickets: 0,
  },
  {
    id: "PROJ-003",
    name: "Mobile Banking App",
    description: "<p>Develop a secure and user-friendly mobile banking application for iOS and Android platforms.</p>",
    status: "On Hold",
    paymentStatus: "proposed",
    budget: 250000,
    startDate: "2024-07-15",
    deadline: "2025-01-31",
    createdBy: user1,
    assignedTo: [user2, user3],
    services: ["Mobile App Development", "UI/UX Design"],
    tasks: [],
    progress: 10,
    tickets: 1,
  },
  {
    id: "PROJ-004",
    name: "Q3 Social Media Campaign",
    description: "<p>Launch a comprehensive social media campaign to boost brand awareness and engagement for the third quarter.</p>",
    status: "Done",
    paymentStatus: "billed",
    budget: 25000,
    startDate: "2024-07-01",
    deadline: "2024-09-30",
    paymentDueDate: "2024-10-10",
    createdBy: user4,
    assignedTo: [user4],
    services: ["Digital Marketing", "Content Creation"],
    tasks: [],
    progress: 100,
    tickets: 0,
  },
];