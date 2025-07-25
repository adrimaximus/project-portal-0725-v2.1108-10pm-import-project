export type Project = {
  id: string;
  name: string;
  assignedTo: {
    name: string;
    avatar: string;
  };
  status: "Completed" | "In Progress" | "On Hold";
  budget: number;
  deadline: string;
  description: string;
  checklist: { id: string; task: string; completed: boolean }[];
};

export const dummyProjects: Project[] = [
  {
    id: "prj-001",
    name: "E-commerce Platform Launch",
    assignedTo: {
      name: "John Doe",
      avatar: "https://i.pravatar.cc/150?u=john.doe",
    },
    status: "In Progress",
    budget: 75000,
    deadline: "2024-08-15",
    description: "Launch of a new e-commerce platform with a focus on user experience and mobile-first design. The project includes backend development, frontend implementation, and integration with major payment gateways.",
    checklist: [
      { id: "task-01", task: "Finalize UI/UX designs", completed: true },
      { id: "task-02", task: "Develop backend API", completed: true },
      { id: "task-03", task: "Implement frontend components", completed: false },
      { id: "task-04", task: "Integrate payment gateway", completed: false },
      { id: "task-05", task: "User acceptance testing", completed: false },
    ],
  },
  {
    id: "prj-002",
    name: "Mobile App for Event Management",
    assignedTo: {
      name: "Jane Smith",
      avatar: "https://i.pravatar.cc/150?u=jane.smith",
    },
    status: "Completed",
    budget: 120000,
    deadline: "2024-05-20",
    description: "A comprehensive mobile application for managing large-scale events, including ticketing, scheduling, and attendee engagement features. The app is available on both iOS and Android platforms.",
    checklist: [
      { id: "task-01", task: "Requirement gathering", completed: true },
      { id: "task-02", task: "Cross-platform development", completed: true },
      { id: "task-03", task: "Real-time notification system", completed: true },
      { id: "task-04", task: "Deploy to app stores", completed: true },
    ],
  },
  {
    id: "prj-003",
    name: "Data Analytics Dashboard",
    assignedTo: {
      name: "Peter Jones",
      avatar: "https://i.pravatar.cc/150?u=peter.jones",
    },
    status: "On Hold",
    budget: 50000,
    deadline: "2024-09-30",
    description: "A web-based dashboard for visualizing and analyzing sales data from multiple sources. The project is currently on hold pending budget reallocation.",
    checklist: [
      { id: "task-01", task: "Define key metrics", completed: true },
      { id: "task-02", task: "Data source integration", completed: false },
      { id: "task-03", task: "Dashboard UI development", completed: false },
    ],
  },
  {
    id: "prj-004",
    name: "Corporate Website Redesign",
    assignedTo: {
      name: "Mary Johnson",
      avatar: "https://i.pravatar.cc/150?u=mary.johnson",
    },
    status: "In Progress",
    budget: 45000,
    deadline: "2024-07-01",
    description: "A complete redesign of the corporate website to improve branding, usability, and SEO performance. The new site will be built on a modern CMS for easy content management.",
    checklist: [
      { id: "task-01", task: "Content audit and strategy", completed: true },
      { id: "task-02", task: "Wireframing and prototyping", completed: true },
      { id: "task-03", task: "CMS implementation", completed: false },
      { id: "task-04", task: "SEO optimization", completed: false },
    ],
  },
];