import { Project } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { format, formatDistanceToNow } from "date-fns";
import { getStatusColor, generatePastelColor } from "@/lib/utils";
import { Link } from "react-router-dom";

interface ProjectInfoCardProps {
  project: Project;
}

const ProjectInfoCard = ({ project }: ProjectInfoCardProps) => {
  const dueDate = project.due_date ? new Date(project.due_date) : null;
  const isOverdue = dueDate && new Date() > dueDate && project.status !== "Completed";

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <Link to={`/projects/${project.slug}`}>
            <CardTitle className="text-lg font-bold hover:underline">{project.name}</CardTitle>
          </Link>
          <Badge style={{ backgroundColor: getStatusColor(project.status) }} className="text-white">
            {project.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{project.category}</p>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{project.description}</p>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm font-medium">{project.progress || 0}%</span>
            </div>
            <Progress value={project.progress || 0} />
          </div>
          {dueDate && (
            <div className="text-sm">
              <span className="font-medium">Due: </span>
              <span className={isOverdue ? "text-destructive" : "text-muted-foreground"}>
                {format(dueDate, "MMM d, yyyy")} ({formatDistanceToNow(dueDate, { addSuffix: true })})
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <div className="p-6 pt-0 flex justify-between items-center">
        <TooltipProvider>
          <div className="flex -space-x-2">
            {typeof project.created_by === 'object' && (
              <Tooltip>
                <TooltipTrigger>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={project.created_by.avatar_url || undefined} />
                    <AvatarFallback style={generatePastelColor(project.created_by.id)}>{project.created_by.initials}</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{project.created_by.name} (Owner)</p>
                </TooltipContent>
              </Tooltip>
            )}
            {project.assignedTo?.map((user) => (
              <Tooltip key={user.id}>
                <TooltipTrigger>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{user.name}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
        <span className="text-sm font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(project.budget || 0)}</span>
      </div>
    </Card>
  );
};

export default ProjectInfoCard;