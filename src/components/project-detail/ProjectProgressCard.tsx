import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Project } from "@/types";

interface ProjectProgressCardProps {
  project: Project;
}

const ProjectProgressCard = ({ project }: ProjectProgressCardProps) => {
  const tasks = project.tasks || [];
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const progressPercentage = project.progress;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Progress</CardTitle>
        <CardDescription>
          {`${completedTasks} of ${totalTasks} tasks completed.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">Overall Progress</span>
          <span className="text-sm font-bold">{progressPercentage}%</span>
        </div>
        <Progress value={progressPercentage} />
      </CardContent>
    </Card>
  );
};

export default ProjectProgressCard;