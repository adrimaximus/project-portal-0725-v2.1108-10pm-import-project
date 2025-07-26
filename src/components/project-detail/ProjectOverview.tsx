import { Project, AssignedUser } from "@/data/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RichTextEditor from "@/components/RichTextEditor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const AssignedTeam = ({ users }: { users: AssignedUser[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Assigned Team</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center space-x-4">
        <div className="flex -space-x-2 overflow-hidden">
          {users.map(user => (
            <TooltipProvider key={user.name}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="inline-block h-10 w-10 rounded-full ring-2 ring-background">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{user.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{users.length} members</p>
      </div>
    </CardContent>
  </Card>
);

const ProjectServices = ({ services }: { services: string[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Services</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex flex-wrap gap-2">
        {services.map(service => (
          <Badge key={service} variant="secondary">{service}</Badge>
        ))}
      </div>
    </CardContent>
  </Card>
);

interface ProjectOverviewProps {
  project: Project;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
}

const ProjectOverview = ({ project, isEditing, onDescriptionChange }: ProjectOverviewProps) => {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Description</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <RichTextEditor
                value={project.description}
                onChange={onDescriptionChange}
                placeholder="Enter project description..."
              />
            ) : (
              <div
                className="prose prose-sm max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: project.description }}
              />
            )}
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1 space-y-6">
        <AssignedTeam users={project.assignedTo} />
        <ProjectServices services={project.services} />
      </div>
    </div>
  );
};

export default ProjectOverview;