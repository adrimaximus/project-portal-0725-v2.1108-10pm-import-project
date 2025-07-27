import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Project, Task } from "@/data/projects";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ProjectProgressCardProps {
  project: Project;
  onTasksUpdate?: (tasks: Task[]) => void;
}

const ProjectProgressCard = ({ project, onTasksUpdate }: ProjectProgressCardProps) => {
  const [newTaskText, setNewTaskText] = useState("");
  const tasks = project.tasks || [];

  const handleToggleTask = (taskId: string) => {
    if (!onTasksUpdate) return;
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    onTasksUpdate(updatedTasks);
  };

  const handleAddTask = () => {
    if (!onTasksUpdate || newTaskText.trim() === "") return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      text: newTaskText.trim(),
      completed: false,
    };
    const updatedTasks = [...tasks, newTask];
    onTasksUpdate(updatedTasks);
    setNewTaskText("");
  };

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Progress</CardTitle>
        <CardDescription>
          {onTasksUpdate
            ? `${completedTasks} of ${totalTasks} tasks completed.`
            : `This project is ${project.progress}% complete.`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">Overall Progress</span>
          <span className="text-sm font-bold">{project.progress}%</span>
        </div>
        <Progress value={project.progress} className={onTasksUpdate ? "mb-6" : ""} />
        
        {onTasksUpdate && (
          <>
            <Separator className="my-4" />

            <h4 className="text-sm font-medium mb-3">Tasks</h4>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {tasks.length > 0 ? (
                tasks.map(task => (
                  <div key={task.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={task.id}
                      checked={task.completed}
                      onCheckedChange={() => handleToggleTask(task.id)}
                    />
                    <label
                      htmlFor={task.id}
                      className={`text-sm font-medium leading-none ${
                        task.completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {task.text}
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No tasks yet.</p>
              )}
            </div>

            <div className="mt-4 flex space-x-2">
              <Input
                placeholder="Add a new task..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
              />
              <Button onClick={handleAddTask} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectProgressCard;