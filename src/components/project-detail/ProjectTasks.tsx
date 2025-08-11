import { useState } from "react";
import { Project, Task, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, MoreHorizontal, Trash2, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MultiSelect } from "@/components/ui/multi-select";

interface ProjectTasksProps {
  project: Project;
  onTaskAdd: (title: string) => void;
  onTaskAssignUsers: (taskId: string, userIds: string[]) => void;
  onTaskStatusChange: (taskId: string, completed: boolean) => void;
  onTaskDelete: (taskId: string) => void;
}

const ProjectTasks = ({
  project,
  onTaskAdd,
  onTaskAssignUsers,
  onTaskStatusChange,
  onTaskDelete,
}: ProjectTasksProps) => {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);

  const handleAddTask = () => {
    if (newTaskTitle.trim() === "") return;
    onTaskAdd(newTaskTitle.trim());
    setNewTaskTitle("");
    setIsAddingTask(false);
  };

  const userOptions = project.assignedTo.map((user) => ({
    value: user.id,
    label: user.name,
  }));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Tasks</h3>
      <div className="space-y-2">
        {(project.tasks || []).map((task) => (
          <div
            key={task.id}
            className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted"
          >
            <Checkbox
              id={`task-${task.id}`}
              checked={task.completed}
              onCheckedChange={(checked) =>
                onTaskStatusChange(task.id, !!checked)
              }
            />
            <label
              htmlFor={`task-${task.id}`}
              className={`flex-1 text-sm ${
                task.completed ? "text-muted-foreground line-through" : ""
              }`}
            >
              {task.title}
            </label>
            <div className="flex items-center -space-x-2">
              {(task.assignedTo || []).map((user) => (
                <Avatar key={user.id} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>{user.initials || user.name.slice(0,2)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <Dialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DialogTrigger asChild>
                    <DropdownMenuItem>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Assign
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DropdownMenuItem
                    className="text-red-500"
                    onClick={() => onTaskDelete(task.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign to: {task.title}</DialogTitle>
                </DialogHeader>
                <MultiSelect
                  options={userOptions}
                  value={(task.assignedTo || []).map(u => u.id)}
                  onChange={(selectedIds) => {
                    onTaskAssignUsers(task.id, selectedIds);
                  }}
                  placeholder="Select team members..."
                />
              </DialogContent>
            </Dialog>
          </div>
        ))}
      </div>
      {isAddingTask ? (
        <div className="flex items-center space-x-2">
          <Checkbox disabled />
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="What needs to be done?"
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            autoFocus
          />
          <Button onClick={handleAddTask}>Add</Button>
          <Button variant="ghost" onClick={() => setIsAddingTask(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => setIsAddingTask(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add task
        </Button>
      )}
    </div>
  );
};

export default ProjectTasks;