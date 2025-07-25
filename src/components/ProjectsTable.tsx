import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Data moved here to resolve import issue
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


const ProjectsTable = () => {
  const projects: Project[] = dummyProjects;

  const getStatusBadgeVariant = (status: Project["status"]) => {
    switch (status) {
      case "Completed":
        return "default";
      case "In Progress":
        return "secondary";
      case "On Hold":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Projects Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Name</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Budget</TableHead>
              <TableHead>Deadline</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>{project.client}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(project.status)}>
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(project.budget)}
                </TableCell>
                <TableCell>
                  {new Date(project.deadline).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ProjectsTable;