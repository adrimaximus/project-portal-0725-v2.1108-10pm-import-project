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
import { getStatusStyles, cn, getPaymentStatusStyles, formatProjectDateRange } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
  sortConfig: { key: keyof Project | null; direction: 'ascending' | 'descending' };
  requestSort: (key: keyof Project) => void;
  rowRefs: React.MutableRefObject<Map<string, HTMLTableRowElement>>;
}

const TableView = ({ projects, isLoading, onDeleteProject, sortConfig, requestSort, rowRefs }: TableViewProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[300px] p-2">
            <Button variant="ghost" onClick={() => requestSort('name')} className="w-full justify-start px-2 group">
              Project
            </Button>
          </TableHead>
          <TableHead className="p-2">
            <Button variant="ghost" onClick={() => requestSort('status')} className="w-full justify-start px-2 group">
              Status
            </Button>
          </TableHead>
          <TableHead className="p-2">
            <Button variant="ghost" onClick={() => requestSort('payment_status')} className="w-full justify-start px-2 group">
              Payment
            </Button>
          </TableHead>
          <TableHead className="p-2">
            <Button variant="ghost" onClick={() => requestSort('progress')} className="w-full justify-start px-2 group">
              Progress
            </Button>
          </TableHead>
          <TableHead className="p-2">
            <Button variant="ghost" onClick={() => requestSort('start_date')} className="w-full justify-start px-2 group">
              Date
            </Button>
          </TableHead>
          <TableHead className="p-2">
            <Button variant="ghost" onClick={() => requestSort('venue')} className="w-full justify-start px-2 group">
              Venue
            </Button>
          </TableHead>
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
              <TableRow 
                key={project.id}
                ref={el => {
                  if (el) rowRefs.current.set(project.id, el);
                  else rowRefs.current.delete(project.id);
                }}
              >
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
                <TableCell className="whitespace-nowrap">
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