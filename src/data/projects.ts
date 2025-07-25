export type Project = {
  id: string;
  name: string;
  status: "Completed" | "In Progress" | "On Hold";
  client: string;
  budget: number;
  deadline: string;
};

export const dummyProjects: Project[] = [
  {
    id: "PROJ-001",
    name: "Website Redesign",
    status: "In Progress",
    client: "Innovate Corp",
    budget: 25000,
    deadline: "2024-08-30",
  },
  {
    id: "PROJ-002",
    name: "Mobile App Development",
    status: "Completed",
    client: "Tech Solutions Ltd.",
    budget: 45000,
    deadline: "2024-07-15",
  },
  {
    id: "PROJ-003",
    name: "Marketing Campaign",
    status: "On Hold",
    client: "Global Goods Inc.",
    budget: 15000,
    deadline: "2024-09-20",
  },
  {
    id: "PROJ-004",
    name: "E-commerce Platform",
    status: "In Progress",
    client: "Retail Giant",
    budget: 75000,
    deadline: "2024-11-10",
  },
  {
    id: "PROJ-005",
    name: "Data Analytics Dashboard",
    status: "Completed",
    client: "Innovate Corp",
    budget: 30000,
    deadline: "2024-06-01",
  },
];