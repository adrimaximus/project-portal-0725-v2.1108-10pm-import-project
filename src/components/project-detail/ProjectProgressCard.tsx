import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Project } from "@/types";
import { ListChecks } from "lucide-react";

interface ProjectProgressCardProps {
  project: Project;
}

const ProjectProgressCard = ({ project }: ProjectProgressCardProps) => {
  const progressPercentage = project.progress || 0;
  const totalTasks = project.total_task_count || 0;
  const completedTasks = totalTasks > 0 ? Math.round((progressPercentage / 100) * totalTasks) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Project Progress</CardTitle>
        <ListChecks className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{progressPercentage}%</div>
        <p className="text-xs text-muted-foreground mb-2">
          {`${completedTasks} of ${totalTasks} tasks completed.`}
        </p>
        <Progress value={progressPercentage} />
      </CardContent>
    </Card>
  );
};

export default ProjectProgressCard;