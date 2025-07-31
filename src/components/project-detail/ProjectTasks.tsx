import { Project, Task } from "@/data/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProjectTasksProps {
  project: Project;
  onUpdate: (project: Project) => void;
}

const ProjectTasks = ({ project, onUpdate }: ProjectTasksProps) => {
  const handleToggleTask = (taskId: string) => {
    const updatedTasks = (project.tasks || []).map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    onUpdate({ ...project, tasks: updatedTasks });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(project.tasks || []).map((task: Task) => (
            <div key={task.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
              <Checkbox
                id={`task-${task.id}`}
                checked={task.completed}
                onCheckedChange={() => handleToggleTask(task.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <label
                  htmlFor={`task-${task.id}`}
                  className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                >
                  {task.text}
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">Assigned to:</span>
                  {task.assignedTo?.map(user => (
                    <Avatar key={user.id} className="h-6 w-6">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.initials}</AvatarFallback>
                    </Avatar>
                  )) || <span className="text-xs text-muted-foreground">Unassigned</span>}
                </div>
              </div>
            </div>
          ))}
          {(!project.tasks || project.tasks.length === 0) && (
            <p className="text-center text-muted-foreground py-4">No tasks for this project yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectTasks;