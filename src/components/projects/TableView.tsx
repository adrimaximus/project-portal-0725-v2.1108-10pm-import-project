import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Project } from "@/types";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import StatusBadge from "../StatusBadge";
import { getStatusStyles, cn, getPaymentStatusStyles } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TableViewProps {
  projects: Project[];
}

const TableView = ({ projects }: TableViewProps) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            return (
              <TableRow key={project.id}>
                <TableCell className="font-medium">
                  <Link to={`/projects/${project.slug}`} className="hover:underline">
                    {project.name}
                  </Link>
                </TableCell>
                <TableCell>{project.category}</TableCell>
                <TableCell>
                  <StatusBadge status={project.status} />
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("border-transparent", getPaymentStatusStyles(project.payment_status).className)}>
                    {project.payment_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {project.start_date ? format(new Date(project.start_date), "dd MMM yyyy") : "-"}
                </TableCell>
                <TableCell>
                  {project.due_date ? format(new Date(project.due_date), "dd MMM yyyy") : "-"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default TableView;