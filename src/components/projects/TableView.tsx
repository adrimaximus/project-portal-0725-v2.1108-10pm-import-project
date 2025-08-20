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
import { isSameDay, getMonth, getYear } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TableViewProps {
  projects: Project[];
  isLoading: boolean;
  onDeleteProject: (projectId: string) => void;
}

const formatProjectDateRange = (startDateStr: string | null | undefined, dueDateStr: string | null | undefined): string => {
  if (!startDateStr) return '-';

  const startDate = new Date(startDateStr);
  const dueDate = dueDateStr ? new Date(dueDateStr) : startDate;

  if (isSameDay(startDate, dueDate)) {
    return formatInJakarta(startDate, 'd MMM');
  }

  const startMonth = getMonth(startDate);
  const endMonth = getMonth(dueDate);
  const startYear = getYear(startDate);
  const endYear = getYear(dueDate);

  if (startYear !== endYear) {
    return `${formatInJakarta(startDate, 'd MMM yyyy')} - ${formatInJakarta(dueDate, 'd MMM yyyy')}`;
  }

  if (startMonth !== endMonth) {
    return `${formatInJakarta(startDate, 'd MMM')} - ${formatInJakarta(dueDate, 'd MMM')}`;
  }

  // Same month, same year
  return `${formatInJakarta(startDate, 'd')} - ${formatInJakarta(dueDate, 'd MMM')}`;
};

const TableView = ({ projects, isLoading, onDeleteProject }: TableViewProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[300px]">Project</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Venue</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={7} className="h-24 text-center">
              Loading projects...
            </TableCell>
          </TableRow>
        ) : projects.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="h-24 text-center">
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
                  <Badge variant="outline" className={cn("border-transparent font-normal", paymentBadgeColor)}>
                    {project.payment_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={project.progress} className="h-2" />
                    <span className="text-sm text-muted-foreground">{project.progress}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  {formatProjectDateRange(project.start_date, project.due_date)}
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <p className="truncate max-w-[15ch]">{project.venue || '-'}</p>
                      </TooltipTrigger>
                      {project.venue && project.venue.length > 15 && (
                        <TooltipContent>
                          <p>{project.venue}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
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