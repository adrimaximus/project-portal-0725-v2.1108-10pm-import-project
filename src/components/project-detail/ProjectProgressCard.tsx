import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Project } from "@/data/projects";

interface ProjectProgressCardProps {
  project: Project;
}

const ProjectProgressCard = ({ project }: ProjectProgressCardProps) => {
  const progress = project.progress || 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Project Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Completion</span>
          <span className="text-sm font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="w-full" />
        <p className="text-xs text-muted-foreground mt-2">
          {progress === 100 ? "Project complete! 🎉" : `Task completion is at ${progress}%.`}
        </p>
      </CardContent>
    </Card>
  );
};

export default ProjectProgressCard;