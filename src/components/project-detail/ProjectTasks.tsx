import { useState } from "react";
import { Project, Task, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, MoreHorizontal, Trash2, UserPlus, Sparkles, RefreshCw, Ticket, Edit } from "lucide-react";
import { generatePastelColor, getInitials } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TaskFormDialog } from "@/components/tasks/TaskFormDialog";

interface ProjectTasksProps {
  project: Project;
  onTaskSave: (taskData: any) => void;
  onTaskStatusChange: (taskId: string, completed: boolean) => void;
  onTaskDelete: (taskId: string) => void;
}

const processMentions = (text: string | null | undefined) => {
  if (!text) return '';
  return text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '**@$1**');
};

const ProjectTasks = ({
  project,
  onTaskSave,
  onTaskStatusChange,
  onTaskDelete,
}: ProjectTasksProps) => {
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateTasks = async (isInitial: boolean) => {
    setIsGenerating(true);
    const toastId = toast.loading(isInitial ? "Generating initial tasks..." : "Generating more tasks...");
    try {
      const existingTaskTitles = project.tasks?.map(t => t.title) || [];
      const { data, error } = await supabase.functions.invoke('generate-tasks', {
        body: {
          projectName: project.name,
          venue: project.venue,
          services: project.services,
          description: project.description,
          existingTasks: existingTaskTitles,
        },
      });

      if (error) throw error;

      if (Array.isArray(data) && data.every(item => typeof item === 'string')) {
        for (const title of data) {
          onTaskSave({ project_id: project.id, title, status: 'To do', priority: 'normal' });
        }
        toast.success(`${data.length} new tasks generated!`, { id: toastId });
      } else {
        throw new Error("AI did not return a valid list of task titles.");
      }
    } catch (error: any) {
      console.error("Failed to generate tasks:", error);
      toast.error("Failed to generate tasks.", {
        id: toastId,
        description: error.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenTaskForm = (task: Task | null) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const handleSaveAndClose = (taskData: any) => {
    onTaskSave(taskData);
    setIsTaskFormOpen(false);
    setEditingTask(null);
  };

  const tasks = project.tasks || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tasks</h3>
        {tasks.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => handleGenerateTasks(false)} disabled={isGenerating} size="icon" variant="outline">
                  {isGenerating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Generate more tasks with AI</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {tasks.length === 0 && (
        <div className="text-center py-4 border-2 border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground mb-4">No tasks yet. Get started by adding one or let AI help.</p>
          <Button onClick={() => handleGenerateTasks(true)} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Initial Tasks with AI
              </>
            )}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {tasks.map((task) => {
          const assignees = (task.assignees || (task as any).assignedTo || []) as (User & { first_name?: string; last_name?: string; avatar_url?: string; email?: string })[];

          return (
            <div
              key={task.id}
              className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted"
            >
              <Checkbox
                id={`task-${task.id}`}
                checked={task.completed}
                onCheckedChange={(checked) =>
                  onTaskStatusChange(task.id, !!checked)
                }
                className="mt-1"
              />
              <div className="flex-1 flex items-start gap-2 min-w-0">
                <label
                  htmlFor={`task-${task.id}`}
                  className={`text-sm break-words cursor-pointer w-full ${
                    task.completed ? "text-muted-foreground line-through" : ""
                  }`}
                  onClick={() => handleOpenTaskForm(task)}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{ p: 'span' }}
                  >
                    {processMentions(task.title)}
                  </ReactMarkdown>
                </label>
                {(task as any).originTicketId && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant={task.completed ? 'default' : 'outline'} className={`mt-0.5 ${task.completed ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}>
                          <Ticket className="h-3 w-3 mr-1" />
                          {task.completed ? 'Done' : 'Ticket'}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This task was created from a ticket.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
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
                  : (
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleOpenTaskForm(task)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-500"
                    onClick={() => onTaskDelete(task.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        })}
      </div>
      
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={() => handleOpenTaskForm(null)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add task
      </Button>

      <TaskFormDialog
        isOpen={isTaskFormOpen}
        onOpenChange={setIsTaskFormOpen}
        project={project}
        taskToEdit={editingTask}
        onSave={handleSaveAndClose}
        users={project.assignedTo}
      />
    </div>
  );
};

export default ProjectTasks;