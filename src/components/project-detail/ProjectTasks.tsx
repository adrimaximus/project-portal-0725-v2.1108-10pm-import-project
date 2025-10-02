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
import { generatePastelColor, getInitials } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
        {(project.tasks || []).map((task) => {
          const assignees = (task.assignees || (task as any).assignedTo || []) as (User & { first_name?: string; last_name?: string; avatar_url?: string; email?: string })[];

          return (
            <div
              key={task.id}
              className={`flex items-center space-x-3 p-2 rounded-md hover:bg-muted ${
                (task.priority as string) === 'high' ? 'bg-red-500/10' : ''
              }`}
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
                {(assignees && assignees.length > 0)
                  ? assignees.map((user) => {
                    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || user.name;
                    return (
                      <TooltipProvider key={user.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Avatar className="h-6 w-6 border-2 border-background">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback style={generatePastelColor(user.id)}>{getInitials(fullName, user.email)}</AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{fullName}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })
                  : task.created_by ? (() => {
                    const createdByFullName = `${task.created_by.first_name || ''} ${task.created_by.last_name || ''}`.trim() || task.created_by.email;
                    return (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Avatar key={task.created_by.id} className="h-6 w-6 border-2 border-background opacity-50">
                              <AvatarImage src={task.created_by.avatar_url} />
                              <AvatarFallback style={generatePastelColor(task.created_by.id)}>{getInitials(createdByFullName, task.created_by.email)}</AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Created by {createdByFullName}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })() : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="h-6 w-6 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center">
                            <UserPlus className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Not assigned</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                }
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
                    value={assignees.map(u => u.id)}
                    onChange={(selectedIds) => {
                      onTaskAssignUsers(task.id, selectedIds);
                    }}
                    placeholder="Select team members..."
                  />
                </DialogContent>
              </Dialog>
            </div>
          )
        })}
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