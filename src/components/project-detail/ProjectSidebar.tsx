import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Project } from "@/data/projects";
import { format } from "date-fns";

interface ProjectSidebarProps {
  project: Project;
}

const ProjectSidebar = ({ project }: ProjectSidebarProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Owner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={project.createdBy.avatar} alt={project.createdBy.name} />
              <AvatarFallback>{project.createdBy.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-primary">{project.createdBy.name}</p>
              <p className="text-xs">{project.createdBy.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Key Dates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Start Date</span>
            <span>{format(new Date(project.startDate), "MMM dd, yyyy")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Due Date</span>
            <span>{format(new Date(project.deadline), "MMM dd, yyyy")}</span>
          </div>
          {project.paymentDueDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Due</span>
              <span>{format(new Date(project.paymentDueDate), "MMM dd, yyyy")}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectSidebar;