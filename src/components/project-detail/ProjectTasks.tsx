import { Task, User, TaskAttachment } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { ListChecks, Plus, MoreHorizontal, Edit, Trash2, Ticket, Paperclip, Eye, Download, File as FileIconLucide } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMemo } from "react";
import FileIcon from "../FileIcon"; // Correct import for custom FileIcon
import TaskReactions from '../projects/TaskReactions';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { useQueryClient } from '@tanstack/react-query';

interface ProjectTasksProps {
  tasks: Task[];
  projectId: string;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onToggleTaskCompletion: (task: Task, completed: boolean) => void;
}

const formatBytes = (bytes?: number, decimals = 2) => {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const ProjectTasks = ({ tasks, projectId, onAddTask, onEditTask, onDeleteTask, onToggleTaskCompletion }: ProjectTasksProps) => {
  const queryClient = useQueryClient();
  const { toggleTaskReaction } = useTaskMutations();

  const handleToggleReaction = (taskId: string, emoji: string) => {
    toggleTaskReaction({ taskId, emoji }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['project', (tasks.find(t => t.id === taskId) as Task)?.project_slug] });
      }
    });
  };
  
  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        <ListChecks className="mx-auto h-8 w-8" />
        <p className="mt-2 text-sm">No tasks for this project yet.</p>
        <Button onClick={onAddTask} className="mt-3 text-sm h-8 px-3">
          <Plus className="mr-1 h-4 w-4" />
          Add First Task
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-end mb-4">
        <Button onClick={onAddTask}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>
      <TooltipProvider>
        {tasks.map((task) => {
          const allAttachments = useMemo(() => {
            let attachments: TaskAttachment[] = [...(task.attachments || [])];
            
            if (task.ticket_attachments && task.ticket_attachments.length > 0) {
              const existingUrls = new Set(attachments.map(a => a.file_url));
              const uniqueTicketAttachments = task.ticket_attachments.filter(
                (ticketAtt) => !attachments.some((att) => att.file_url === ticketAtt.file_url)
              );
              attachments = [...attachments, ...uniqueTicketAttachments];
            }
            return attachments;
          }, [task.attachments, task.ticket_attachments]);
          
          const attachmentCount = allAttachments.length;
          const hasAttachments = attachmentCount > 0;

          return (
            <div key={task.id} className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted group">
              <Checkbox
                id={`task-${task.id}`}
                checked={task.completed}
                onCheckedChange={(checked) => onToggleTaskCompletion(task, !!checked)}
                className="mt-1"
              />
              <label
                htmlFor={`task-${task.id}`}
                className={`flex-1 min-w-0 text-sm flex items-center gap-2 cursor-pointer ${task.completed ? 'text-muted-foreground line-through' : 'text-card-foreground'}`}
              >
                <span className="break-words" title={task.title}>{task.title}</span>
              </label>

              <div className="flex items-center gap-2 ml-auto">
                <TaskReactions reactions={task.reactions || []} onToggleReaction={(emoji) => handleToggleReaction(task.id, emoji)} />
                {hasAttachments && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex items-center gap-1 text-muted-foreground h-auto p-1">
                        <Paperclip className="h-4 w-4" />
                        <span className="text-xs font-medium">{attachmentCount}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none">Attachments ({attachmentCount})</h4>
                        <div className="space-y-2 pt-2">
                          {allAttachments.map((att) => (
                            <div key={att.id} className="flex items-center justify-between p-2 rounded-md border bg-card">
                              <div className="flex items-center gap-3 min-w-0">
                                <FileIcon fileType={att.file_type || ''} className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate" title={att.file_name}>{att.file_name}</p>
                                  {att.file_size != null && att.file_size > 0 && <p className="text-xs text-muted-foreground">{formatBytes(att.file_size)}</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                  <a href={att.file_url} target="_blank" rel="noopener noreferrer" title="Preview">
                                    <Eye className="h-4 w-4" />
                                  </a>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                  <a href={att.file_url} download={att.file_name} title="Download">
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                {(task.originTicketId || task.tags?.some(t => t.name === 'Ticket')) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Ticket className={`h-4 w-4 flex-shrink-0 ${task.completed ? 'text-green-500' : 'text-red-500'}`} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This is a ticket</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                <div className="flex items-center -space-x-2 pr-2">
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
          );
        })}
      </TooltipProvider>
    </div>
  );
};

export default ProjectTasks;