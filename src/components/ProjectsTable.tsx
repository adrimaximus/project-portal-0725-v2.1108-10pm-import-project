import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/data/projects";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface ProjectsTableProps {
  projects: Project[];
}

const statusStyles: { [key: string]: string } = {
  "On Track": "bg-green-100 text-green-800",
  "In Progress": "bg-green-100 text-green-800",
  "At Risk": "bg-yellow-100 text-yellow-800",
  "Off Track": "bg-red-100 text-red-800",
  "On Hold": "bg-gray-100 text-gray-800",
  Completed: "bg-blue-100 text-blue-800",
  Done: "bg-blue-100 text-blue-800",
  Billed: "bg-purple-100 text-purple-800",
  Cancelled: "bg-red-100 text-red-800",
  Requested: "bg-yellow-100 text-yellow-800",
};

const ProjectsTable = ({ projects }: ProjectsTableProps) => {
  const navigate = useNavigate();

  const handleRowClick = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Budget</TableHead>
          <TableHead>End Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id} onClick={() => handleRowClick(project.id)} className="cursor-pointer">
            <TableCell className="font-medium">{project.name}</TableCell>
            <TableCell>{project.category || 'N/A'}</TableCell>
            <TableCell>
              <Badge className={cn("capitalize", statusStyles[project.status] || "bg-gray-100 text-gray-800")}>
                {project.status}
              </Badge>
            </TableCell>
            <TableCell>${project.budget?.toLocaleString() || 'N/A'}</TableCell>
            <TableCell>{project.endDate}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ProjectsTable;