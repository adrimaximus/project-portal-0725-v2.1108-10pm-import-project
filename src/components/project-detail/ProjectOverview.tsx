import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Project } from "@/data/projects";
import { format } from "date-fns";
import { getStatusClass, getPaymentStatusClass, formatFileSize } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { FileIcon } from "@/components/FileIcon";

interface ProjectOverviewProps {
  project: Project;
  onUpdate: (project: Project) => void;
}

export const ProjectOverview = ({ project, onUpdate }: ProjectOverviewProps) => {
  const totalTasks = project.tasks?.length || 0;
  const completedTasks = project.tasks?.filter(t => t.completed).length || 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : project.progress;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Project Description</h3>
        <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status</CardDescription>
            <CardTitle>
              <Badge variant="outline" className={cn("border-transparent", getStatusClass(project.status))}>
                {project.status}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Payment</CardDescription>
            <CardTitle>
              <Badge variant="outline" className={cn("border-transparent", getPaymentStatusClass(project.paymentStatus))}>
                {project.paymentStatus}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Budget</CardDescription>
            <CardTitle className="text-xl">{'Rp ' + project.budget.toLocaleString('id-ID')}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Deadline</CardDescription>
            <CardTitle className="text-xl">{project.deadline ? format(new Date(project.deadline), "MMM dd, yyyy") : 'N/A'}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-medium">Progress</h3>
        <div className="flex items-center gap-4 mt-2">
          <Progress value={progress} className="flex-1" />
          <span className="font-semibold">{progress}%</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{completedTasks} of {totalTasks} tasks completed.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium">Team</h3>
          <div className="mt-2 space-y-3">
            {project.assignedTo.map(user => (
              <div key={user.id} className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.role || 'Member'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-medium">Project Owner</h3>
          {project.createdBy && (
            <div className="mt-2 flex items-center gap-3">
              <Avatar>
                <AvatarImage src={project.createdBy.avatar} alt={project.createdBy.name} />
                <AvatarFallback>{project.createdBy.initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{project.createdBy.name}</p>
                <p className="text-xs text-muted-foreground">{project.createdBy.email || 'No email'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium">Brief Files</h3>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {project.briefFiles?.map(file => (
            <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 border rounded-lg hover:bg-gray-50">
              <FileIcon fileName={file.name} className="h-6 w-6 text-gray-500" />
              <div className="ml-2 flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};