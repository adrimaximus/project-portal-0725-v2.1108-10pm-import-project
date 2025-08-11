import { Project, Task } from '@/data/projects';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Circle, Clock } from 'lucide-react';

interface ProjectOverviewTabProps {
  project: Project;
}

const ProjectOverviewTab = ({ project }: ProjectOverviewTabProps) => {
  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter(task => task.completed).length;
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Tasks Completed</span>
            <span>{completedTasks} / {totalTasks}</span>
          </div>
          <Progress value={completionPercentage} />
          <p className="text-right text-sm text-muted-foreground mt-2">{completionPercentage.toFixed(0)}% Complete</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {project.tasks.map(task => (
              <li key={task.id} className="flex items-center">
                {task.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground mr-3" />
                )}
                <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                  {task.title}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectOverviewTab;