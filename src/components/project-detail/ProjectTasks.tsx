import { useState, useEffect } from "react";
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
import { Plus, MoreHorizontal, Trash2, UserPlus, Sparkles, RefreshCw, Ticket } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ProjectTasksProps {
  project: Project;
  onTaskAdd: (title: string) => void;
  onTaskAssignUsers: (taskId: string, userIds: string[]) => void;
  onTaskStatusChange: (taskId: string, completed: boolean) => void;
  onTaskDelete: (taskId: string) => void;
}

const processMentions = (text: string | null | undefined) => {
  if (!text) return '';
  return text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '**@$1**');
};

const plainTextMentions = (text: string | null | undefined) => {
  if (!text) return '';
  return text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1');
};

const ProjectTasks = ({
  project,
  onTaskAdd,
  onTaskAssignUsers,
  onTaskStatusChange,
  onTaskDelete,
}: ProjectTasksProps) => {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const tasks = project.tasks || [];

  const handleAddTask = () => {
    if (newTaskTitle.trim() === "") return;
    onTaskAdd(newTaskTitle.trim());
    setNewTaskTitle("");
    setIsAddingTask(false);
  };

  const handleGenerateTasks = async (isInitial: boolean) => {
    setIsGenerating(true);
    const toastId = toast.loading(isInitial ? "Membuat tugas awal..." : "Membuat lebih banyak tugas...");
    try {
      const existingTaskTitles = tasks.map(t => t.title);
      const { data, error } = await supabase.functions.invoke('generate-tasks', {
        body: {
          projectName: project.name,
          venue: project.venue,
          services: project.services,
          description: project.description,
          existingTasks: existingTaskTitles,
          language: 'Bahasa Indonesia',
          taskCount: 3,
        },
      });

      if (error) throw error;

      if (Array.isArray(data) && data.every(item => typeof item === 'string')) {
        for (const title of data) {
          onTaskAdd(title);
        }
        toast.success(`${data.length} tugas baru berhasil dibuat!`, { id: toastId });
      } else {
        throw new Error("AI tidak memberikan daftar judul tugas yang valid.");
      }
    } catch (error: any) {
      console.error("Gagal membuat tugas:", error);
      toast.error("Gagal membuat tugas.", {
        id: toastId,
        description: error.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const userOptions = project.assignedTo.map((user) => ({
    value: user.id,
    label: user.name,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tugas</h3>
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
                <p>Buat lebih banyak tugas dengan AI</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {tasks.length === 0 && !isAddingTask && (
        <div className="text-center py-4 border-2 border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground mb-4">Belum ada tugas. Mulai dengan menambahkan satu atau biarkan AI membantu.</p>
          <Button onClick={() => handleGenerateTasks(true)} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Membuat...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Buat Tugas Awal dengan AI
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
              className={`flex items-start space-x-3 p-2 rounded-md hover:bg-muted ${
                (task.priority as string) === 'high' ? 'bg-red-100 border-l-4 border-red-500' : ''
              }`}
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
                          {task.completed ? 'Selesai' : 'Tiket'}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Tugas ini dibuat dari sebuah tiket.</p>
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
                            <p>Dibuat oleh {createdByFullName}</p>
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
                          <p>Belum ditugaskan</p>
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
                    <DialogTitle>Assign to: {plainTextMentions(task.title)}</DialogTitle>
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
            placeholder="Apa yang harus dilakukan?"
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            autoFocus
          />
          <Button onClick={handleAddTask}>Tambah</Button>
          <Button variant="ghost" onClick={() => setIsAddingTask(false)}>
            Batal
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => setIsAddingTask(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah tugas
        </Button>
      )}
    </div>
  );
};

export default ProjectTasks;