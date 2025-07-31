import PortalLayout from "@/components/PortalLayout";
import { dummyProjects } from "@/data/projects";
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
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { getStatusClass, getPaymentStatusClass } from "@/lib/utils";
import { cn } from "@/lib/utils";

const Index = () => {
  const navigate = useNavigate();

  return (
    <PortalLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Welcome to your Portal</h1>
          <p className="text-xl text-muted-foreground mt-2">Here's a quick overview of your projects.</p>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Project Name</TableHead>
                <TableHead>Project Status</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Project Progress</TableHead>
                <TableHead>Project Value</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead className="text-right">Team</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dummyProjects.map((project) => {
                const totalTasks = project.tasks?.length || 0;
                const completedTasks = project.tasks?.filter(t => t.completed).length || 0;
                const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : project.progress;

                return (
                  <TableRow
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-sm text-muted-foreground hidden md:block">
                        {project.category}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("border-transparent", getStatusClass(project.status))}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("border-transparent", getPaymentStatusClass(project.paymentStatus))}>
                        {project.paymentStatus}
                      </Badge>
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
                      <div className="font-medium">
                        {'Rp ' + project.budget.toLocaleString('id-ID')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {project.deadline ? format(new Date(project.deadline), "MMM dd, yyyy") : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end -space-x-2">
                        {project.assignedTo.map((user) => (
                          <Avatar key={user.id} className="h-8 w-8 border-2 border-background">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>{user.initials}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </PortalLayout>
  );
};

export default Index;