import { User, dummyUsers } from "./users";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
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
  team: User[];
  status: "In Progress" | "On Hold" | "Completed";
  deadline: string;
  description: string;
  tasks: Task[];
  budget: number;
  spent: number;
  activities?: Activity[];
}

export const projects: Project[] = [
  {
    id: "PROJ-123",
    name: "Website Redesign",
    team: [dummyUsers[0], dummyUsers[1], dummyUsers[2]],
    status: "In Progress",
    deadline: "2024-08-15",
    description: "A complete overhaul of the company website, focusing on user experience and modern design principles.",
    tasks: [
      { id: "TASK-001", title: "Initial wireframing", completed: true },
      { id: "TASK-002", title: "UI/UX design mockups", completed: true },
      { id: "TASK-003", title: "Frontend development", completed: false },
      { id: "TASK-004", title: "Backend integration", completed: false },
      { id: "TASK-005", title: "User testing and feedback", completed: false },
    ],
    budget: 50000,
    spent: 22000,
    activities: [
        { id: 'act-1', user: dummyUsers[0], text: 'created the project.', timestamp: '2024-07-20T10:00:00Z' },
        { id: 'act-2', user: dummyUsers[1], text: 'completed task "UI/UX design mockups".', timestamp: '2024-07-21T14:30:00Z' },
    ]
  },
  {
    id: "PROJ-456",
    name: "Mobile App Development",
    team: [dummyUsers[3], dummyUsers[4]],
    status: "On Hold",
    deadline: "2024-09-30",
    description: "Native mobile application for iOS and Android to complement our web services.",
    tasks: [
      { id: "TASK-006", title: "Market research", completed: true },
      { id: "TASK-007", title: "Feature planning", completed: true },
      { id: "TASK-008", title: "Platform-specific UI design", completed: false },
    ],
    budget: 75000,
    spent: 15000,
    activities: [
        { id: 'act-3', user: dummyUsers[3], text: 'put the project on hold.', timestamp: '2024-07-22T11:00:00Z' },
    ]
  },
  {
    id: "PROJ-789",
    name: "Data Analytics Platform",
    team: [dummyUsers[1], dummyUsers[3], dummyUsers[4]],
    status: "Completed",
    deadline: "2024-06-01",
    description: "A new platform for internal data analysis and reporting.",
    tasks: [
      { id: "TASK-009", title: "Define data sources", completed: true },
      { id: "TASK-010", title: "Build data pipeline", completed: true },
      { id: "TASK-011", title: "Develop dashboard components", completed: true },
      { id: "TASK-012", title: "Final deployment", completed: true },
    ],
    budget: 60000,
    spent: 58000,
    activities: [
        { id: 'act-4', user: dummyUsers[1], text: 'completed the project.', timestamp: '2024-06-01T16:00:00Z' },
    ]
  },
];