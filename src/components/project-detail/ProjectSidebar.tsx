import { Project } from "@/data/projects";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProjectSidebarProps {
  project: Project;
}

const ProjectSidebar = ({ project }: ProjectSidebarProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Team</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Progress</h4>
          <Progress value={project.progress} />
          <p className="text-xs text-muted-foreground">{project.progress}% complete</p>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Assigned Team</h4>
          <div className="space-y-3">
            {project.assignedTo.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("h-2 w-2 rounded-full", user.status === 'Online' ? 'bg-green-500' : 'bg-gray-400')} />
                    <p className="text-xs text-muted-foreground">{user.status === 'Online' ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectSidebar;