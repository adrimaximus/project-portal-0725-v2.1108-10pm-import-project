import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { getStatusStyles } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Project } from "@/data/projects";
import StatusBadge from "@/components/StatusBadge";

interface DashboardProjectListProps {
  projects: Project[];
}

const DashboardProjectList = ({ projects }: DashboardProjectListProps) => {
  const navigate = useNavigate();

  if (projects.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8">
        No projects found for the selected date range.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <TooltipProvider>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Project Name</TableHead>
              <TableHead>Project Status</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Project Progress</TableHead>
              <TableHead>Tickets</TableHead>
              <TableHead>Project Value</TableHead>
              <TableHead>Project Due Date</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="text-right">Team</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => {
              const totalTasks = project.tasks?.length || 0;
              const completedTasks = project.tasks?.filter(t => t.completed).length || 0;
              const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (project.progress || 0);
              const ticketCount = project.comments?.filter(comment => (comment as any).isTicket).length || 0;

              return (
                <TableRow
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell style={{ borderLeft: `4px solid ${getStatusStyles(project.status).hex}` }}>
                    <div className="font-medium whitespace-nowrap">{project.name}</div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={project.status} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={project.paymentStatus} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Progress value={progressPercentage} className="w-24" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {progressPercentage}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-center">{ticketCount}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium whitespace-nowrap">
                      {'Rp ' + (project.budget || 0).toLocaleString('id-ID')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium whitespace-nowrap">
                      {project.dueDate ? format(new Date(project.dueDate), "MMM dd, yyyy") : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {project.assignedTo && project.assignedTo.length > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar className="h-8 w-8 border-2 border-background">
                            <AvatarImage src={project.assignedTo[0].avatar} alt={project.assignedTo[0].name} />
                            <AvatarFallback>{project.assignedTo[0].initials}</AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{project.assignedTo[0].name}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end -space-x-2">
                      {project.assignedTo.map((user) => (
                        <Tooltip key={user.id}>
                          <TooltipTrigger asChild>
                            <Avatar className="h-8 w-8 border-2 border-background">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback>{user.initials}</AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{user.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TooltipProvider>
    </div>
  );
};

export default DashboardProjectList;