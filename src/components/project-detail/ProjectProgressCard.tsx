import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Project } from "@/types";
import { ListChecks } from "lucide-react";
import { useProjectContext } from "@/contexts/ProjectContext";

const ProjectProgressCard = () => {
  const { editedProject: project } = useProjectContext();

  const tasks = project.tasks || [];
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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