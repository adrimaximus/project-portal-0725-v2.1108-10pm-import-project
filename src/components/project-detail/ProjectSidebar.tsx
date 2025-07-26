import { Project } from "@/data/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  project: Project;
}

const ProjectSidebar = ({ project }: ProjectSidebarProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assigned Team</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {project.assignedTo.map((assignee) => (
              <li key={assignee.name} className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={assignee.avatar} />
                  <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{assignee.name}</p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className={cn("h-2 w-2 rounded-full mr-2", assignee.status === 'Online' ? "bg-green-500" : "bg-gray-400")} />
                    <span>{assignee.status}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectSidebar;