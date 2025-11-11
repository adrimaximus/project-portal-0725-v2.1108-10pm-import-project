import { Task, User, TaskAttachment, Reaction, Project } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { ListChecks, Plus, MoreHorizontal, Edit, Trash2, Ticket, Paperclip, Eye, Download, File as FileIconLucide, ChevronDown, Loader2, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMemo, useRef, useEffect, useState } from "react";
import FileIcon from "../FileIcon";
import TaskReactions from '../projects/TaskReactions';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import TaskAttachmentList from './TaskAttachmentList';
import { cn, getErrorMessage, formatBytes, formatActivityDescription } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { User as AuthUser } from '@supabase/supabase-js';
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Textarea } from "../ui/textarea";
import TaskSuggestionDialog from './TaskSuggestionDialog';
import { useTaskDrawer } from "@/contexts/TaskDrawerContext";
import { useUnreadTasks } from "@/hooks/useUnreadTasks";

interface ProjectTasksProps {
  project: Project;
  tasks: Task[];
  projectId: string;
  projectSlug: string;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onToggleTaskCompletion: (task: Task, completed: boolean) => void;
  highlightedTaskId?: string | null;
  onHighlightComplete?: () => void;
}

const TaskRow = ({ task, onToggleTaskCompletion, onEditTask, onDeleteTask, handleToggleReaction, setRef, currentUserId, isUnread, onClick }: {
  task: Task;
  onToggleTaskCompletion: (task: Task, completed: boolean) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  handleToggleReaction: (taskId: string, emoji: string) => void;
  setRef: (el: HTMLDivElement | null) => void;
  currentUserId?: string;
  isUnread: boolean;
  onClick: () => void;
}) => {
  const navigate = useNavigate();

  const handleTitleClick = () => {
    navigate(`/projects?view=tasks&highlight=${task.id}`);
  };

  const allAttachments = useMemo(() => {
    let attachments: TaskAttachment[] = [...(task.attachments || [])];
    if (task.ticket_attachments && task.ticket_attachments.length > 0) {
      const uniqueTicketAttachments = task.ticket_attachments.filter(
        (ticketAtt) => !attachments.some((att) => att.file_url === ticketAtt.file_url)
      );
      attachments = [...attachments, ...uniqueTicketAttachments];
    }
    return attachments;
  }, [task.attachments, task.ticket_attachments]);

  const attachmentCount = allAttachments.length;
  const hasAttachments = attachmentCount > 0;

  const isAssignedToCurrentUser = useMemo(() => {
    if (!currentUserId) return false;
    return task.assignedTo?.some(assignee => assignee.id === currentUserId);
  }, [task.assignedTo, currentUserId]);

  const isUrgent = task.priority?.toLowerCase() === 'urgent';

  return (
    <div
      ref={setRef}
      className={cn(
        "flex items-start space-x-3 p-2 rounded-md hover:bg-muted group transition-colors duration-500",
        isUrgent ? "bg-red-500/10" : isAssignedToCurrentUser ? "bg-primary/10" : ""
      )}
      onClick={onClick}
    >
      <Checkbox
        id={`task-${task.id}`}
        checked={task.completed}
        onCheckedChange={(checked) => onToggleTaskCompletion(task, !!checked)}
        className="mt-1"
      />
      <div
        className={`flex-1 min-w-0 text-sm flex items-center gap-2 ${task.completed ? 'text-muted-foreground' : 'text-card-foreground'}`}
      >
        <div className="flex items-center gap-2">
          {isUnread && <div className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />}
          <div className={cn(
            "break-words cursor-pointer hover:underline",
            task.completed && "line-through"
          )}
          title={task.title}
          dangerouslySetInnerHTML={{ __html: formatActivityDescription(task.title) }}
        />
        </div>
      </div>

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
                  {allAttachments.map(att => (
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
        {(task.origin_ticket_id || task.tags?.some(t => t.name === 'Ticket')) && (
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
};

const ProjectTasks = ({ project, tasks, projectId, projectSlug, onEditTask, onDeleteTask, onToggleTaskCompletion, highlightedTaskId, onHighlightComplete }: ProjectTasksProps) => {
  const queryClient = useQueryClient();
  const { toggleTaskReaction, createTasks, isCreatingTasks } = useTaskMutations(() => queryClient.invalidateQueries({ queryKey: ['project', projectSlug] }));
  const taskRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [isCompletedOpen, setIsCompletedOpen] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const { user: authUser } = useAuth();
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionDialogOpen, setIsSuggestionDialogOpen] = useState(false);
  const { onOpen: onOpenTaskDrawer } = useTaskDrawer();
  const { unreadTaskIds } = useUnreadTasks();

  const handleTaskClick = (task: Task) => {
    onOpenTaskDrawer(task, project);
  };

  const handleSuggestTasks = async () => {
    setIsSuggesting(true);
    toast.info("Asking AI to suggest tasks...");
    try {
      const { data, error } = await supabase.functions.invoke('generate-tasks', {
        body: {
          projectName: project.name,
          venue: project.venue,
          services: project.services,
          description: project.description,
          existingTasks: tasks.map(t => t.title),
        }
      });
      if (error) throw error;
      setSuggestions(data);
      setIsSuggestionDialogOpen(true);
    } catch (error: any) {
      toast.error("Failed to get suggestions.", { description: error.message });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleAddSuggestedTasks = (selectedTitles: string[]) => {
    if (selectedTitles.length === 0) {
      setIsSuggestionDialogOpen(false);
      return;
    }
    const tasksToCreate = selectedTitles.map(title => ({
      title,
      project_id: project.id,
      created_by: user!.id,
    }));
    createTasks(tasksToCreate, {
      onSuccess: () => {
        setIsSuggestionDialogOpen(false);
      }
    });
  };

  const handleAddNewTask = () => {
    if (newTaskTitle.trim()) {
        createTasks([{ title: newTaskTitle.trim(), project_id: projectId, created_by: authUser!.id }], {
          onSuccess: () => {
            setShowNewTaskForm(false);
            setNewTaskTitle("");
          }
        });
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (highlightedTaskId) {
      const element = taskRefs.current.get(highlightedTaskId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('bg-primary/10', 'rounded-md');
        setTimeout(() => {
          element.classList.remove('bg-primary/10', 'rounded-md');
          if (onHighlightComplete) {
            onHighlightComplete();
          }
        }, 2000);
      }
    }
  }, [highlightedTaskId, onHighlightComplete]);

  const handleToggleReaction = (taskId: string, emoji: string) => {
    toggleTaskReaction({ taskId, emoji }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['project', (tasks.find(t => t.id === taskId) as Task)?.project_slug] });
      }
    });
  };

  const { undoneTasks, doneTasks } = useMemo(() => {
    const undone: Task[] = [];
    const done: Task[] = [];
    (tasks || []).forEach(task => {
      if (task.completed) {
        done.push(task);
      } else {
        undone.push(task);
      }
    });
    const sortByDate = (a: Task, b: Task) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    undone.sort(sortByDate);
    done.sort(sortByDate);
    return { undoneTasks: undone, doneTasks: done };
  }, [tasks]);

  const hasNoTasks = !tasks || tasks.length === 0;

  const addTaskForm = (
    <div className="p-2">
      <Textarea
        placeholder="What needs to be done?"
        value={newTaskTitle}
        onChange={(e) => setNewTaskTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAddNewTask();
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            setShowNewTaskForm(false);
            setNewTaskTitle("");
          }
        }}
        autoFocus
        className="mb-2"
      />
      <div className="flex items-center gap-2">
        <Button onClick={handleAddNewTask} disabled={isCreatingTasks}>
          {isCreatingTasks ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Add Task
        </Button>
        <Button variant="ghost" onClick={() => { setShowNewTaskForm(false); setNewTaskTitle(""); }}>Cancel</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-1">
      <TooltipProvider>
        {undoneTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onToggleTaskCompletion={onToggleTaskCompletion}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            handleToggleReaction={handleToggleReaction}
            currentUserId={user?.id}
            setRef={(el) => {
              if (el) taskRefs.current.set(task.id, el);
              else taskRefs.current.delete(task.id);
            }}
            isUnread={unreadTaskIds.includes(task.id)}
            onClick={() => handleTaskClick(task)}
          />
        ))}
      </TooltipProvider>

      {showNewTaskForm ? (
        addTaskForm
      ) : hasNoTasks ? (
        <div className="text-center text-muted-foreground py-4">
          <ListChecks className="mx-auto h-8 w-8" />
          <p className="mt-2 text-sm">No tasks for this project yet.</p>
          <div className="flex justify-center gap-2 mt-3">
            <Button onClick={() => setShowNewTaskForm(true)} className="text-sm h-8 px-3">
              <Plus className="mr-1 h-4 w-4" />
              Add First Task
            </Button>
            <Button variant="outline" onClick={handleSuggestTasks} disabled={isSuggesting} className="text-sm h-8 px-3">
              {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Suggest Tasks
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 mt-2">
          <Button variant="ghost" onClick={() => setShowNewTaskForm(true)} className="w-full justify-start text-muted-foreground hover:text-foreground">
            <Plus className="mr-2 h-4 w-4" />
            Add task
          </Button>
          <Button variant="outline" size="sm" onClick={handleSuggestTasks} disabled={isSuggesting}>
            {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Suggest
          </Button>
        </div>
      )}

      {doneTasks.length > 0 && (
        <>
          <Separator className="my-4" />
          <Collapsible open={isCompletedOpen} onOpenChange={setIsCompletedOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-md hover:bg-muted group">
              <div className="flex items-center gap-2">
                <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                <h4 className="font-semibold text-sm">Completed ({doneTasks.length})</h4>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pt-2">
              <TooltipProvider>
                {doneTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggleTaskCompletion={onToggleTaskCompletion}
                    onEditTask={onEditTask}
                    onDeleteTask={onDeleteTask}
                    handleToggleReaction={handleToggleReaction}
                    currentUserId={user?.id}
                    setRef={(el) => {
                      if (el) taskRefs.current.set(task.id, el);
                      else taskRefs.current.delete(task.id);
                    }}
                    isUnread={unreadTaskIds.includes(task.id)}
                    onClick={() => handleTaskClick(task)}
                  />
                ))}
              </TooltipProvider>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}
      <TaskSuggestionDialog
        isOpen={isSuggestionDialogOpen}
        onClose={() => setIsSuggestionDialogOpen(false)}
        suggestions={suggestions}
        onAddTasks={handleAddSuggestedTasks}
        isLoading={isCreatingTasks}
      />
    </div>
  );
};

export default ProjectTasks;