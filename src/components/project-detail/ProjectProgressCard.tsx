import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Project, Task } from "@/data/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectProgressCardProps {
  project: Project;
  onTasksUpdate: (tasks: Task[]) => void;
}

const ProjectProgressCard = ({ project, onTasksUpdate }: ProjectProgressCardProps) => {
  const progress = project.progress || 0;
  const tasks = project.tasks || [];
  const [newTaskText, setNewTaskText] = useState("");

  const handleAddTask = () => {
    if (newTaskText.trim() === "") return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      text: newTaskText.trim(),
      completed: false,
    };
    onTasksUpdate([...tasks, newTask]);
    setNewTaskText("");
  };

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    onTasksUpdate(updatedTasks);
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    onTasksUpdate(updatedTasks);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Progress & Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Progress Section */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Completion</span>
          <span className="text-sm font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="w-full" />
        <p className="text-xs text-muted-foreground mt-2 mb-6">
          {progress === 100 ? "Project complete! 🎉" : `Task completion is at ${progress}%.`}
        </p>

        {/* Task Management Section */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a new task..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            />
            <Button onClick={handleAddTask} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                >
                  <Checkbox
                    id={`task-progress-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => handleToggleTask(task.id)}
                  />
                  <label
                    htmlFor={`task-progress-${task.id}`}
                    className={cn(
                      "flex-1 text-sm cursor-pointer",
                      task.completed && "line-through text-muted-foreground"
                    )}
                  >
                    {task.text}
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tasks yet. Add one to get started!
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectProgressCard;