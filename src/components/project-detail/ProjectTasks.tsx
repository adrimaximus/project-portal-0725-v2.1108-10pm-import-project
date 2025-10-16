import { Task, User } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { ListChecks, Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProjectTasksProps {
  tasks: Task[];
  projectId: string;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onToggleTaskCompletion: (task: Task, completed: boolean) => void;
}

const ProjectTasks = ({ tasks, onAddTask, onEditTask, onDeleteTask, onToggleTaskCompletion }: ProjectTasksProps) => {
  
  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <ListChecks className="mx-auto h-12 w-12" />
        <p className="mt-4">No tasks for this project yet.</p>
        <Button onClick={onAddTask} className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          Add First Task
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end mb-4">
        <Button onClick={onAddTask}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>
      <TooltipProvider>
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted group">
            <Checkbox
              id={`task-${task.id}`}
              checked={task.completed}
              onCheckedChange={(checked) => onToggleTaskCompletion(task, !!checked)}
              className="mt-1"
            />
            <label
              htmlFor={`task-${task.id}`}
              className={`flex-1 text-sm ${task.completed ? 'text-muted-foreground line-through' : 'text-card-foreground'}`}
            >
              {task.title}
            </label>

            <div className="flex items-center -space-x-2 ml-auto pr-2">
              {task.assignedTo?.map((assignee: User) => (
                <Tooltip key={assignee.id}>
                  <TooltipTrigger asChild>
                    <Avatar className="h-6 w-6 border-2 border-background">
                      <AvatarImage src={assignee.avatar_url} alt={assignee.name} />
                      <AvatarFallback>{assignee.initials}</AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{assignee.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onEditTask(task)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onDeleteTask(task)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </TooltipProvider>
    </div>
  );
};

export default ProjectTasks;