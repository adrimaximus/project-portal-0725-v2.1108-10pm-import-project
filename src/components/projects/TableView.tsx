import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Project } from "@/types";
import { Link } from "react-router-dom";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import StatusBadge from "../StatusBadge";
import { getStatusStyles, cn, formatInJakarta, getPaymentStatusStyles } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TableViewProps {
  projects: Project[];
  isLoading: boolean;
  onDeleteProject: (projectId: string) => void;
}

const TableView = ({ projects, isLoading, onDeleteProject }: TableViewProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[300px]">Project</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Venue</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={8} className="h-24 text-center">
              Loading projects...
            </TableCell>
          </TableRow>
        ) : projects.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="h-24 text-center">
              No projects found.
            </TableCell>
          </TableRow>
        ) : (
          projects.map((project) => {
            const paymentBadgeColor = getPaymentStatusStyles(project.payment_status).tw;
            return (
              <TableRow key={project.id}>
                <TableCell style={{ borderLeft: `4px solid ${getStatusStyles(project.status).hex}` }}>
                  <Link to={`/projects/${project.slug}`} className="font-medium text-primary hover:underline">
                    {project.name}
                  </Link>
                  <div className="text-sm text-muted-foreground">{project.category}</div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={project.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={project.progress} className="h-2" />
                    <span className="text-sm text-muted-foreground">{project.progress}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  {formatInJakarta(project.start_date, 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  {formatInJakarta(project.due_date, 'MMM d, yyyy')}
                </TableCell>
                <TableCell>{project.venue || '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("border-transparent font-normal", paymentBadgeColor)}>
                    {project.payment_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => onDeleteProject(project.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Hapus Proyek</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
};

export default TableView;