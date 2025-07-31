import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Task, User, AssignedUser } from "@/data/projects";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProjectProgressCardProps {
  progress: number;
  tasks: Task[];
  team: AssignedUser[];
  projectCreator: User;
}

export function ProjectProgressCard({
  progress,
  tasks,
  team,
  projectCreator,
}: ProjectProgressCardProps) {
  const completedTasks = tasks.filter((task) => task.completed).length;
  const totalTasks = tasks.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Progress</CardTitle>
        <CardDescription>
          {completedTasks} of {totalTasks} tasks completed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Progress value={progress} className="flex-1" />
          <span className="text-lg font-semibold">{Math.round(progress)}%</span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Team:</span>
            <div className="flex -space-x-2">
              <TooltipProvider>
                {team.map((member) => (
                  <Tooltip key={member.id}>
                    <TooltipTrigger asChild>
                      <Avatar className="h-8 w-8 border-2 border-card">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>{member.initials}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{member.name}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Created by:{" "}
            <span className="font-semibold text-foreground">
              {projectCreator.name}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}