import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task as ProjectTask, TaskAttachment, Reaction, User, TaskStatus, TASK_STATUS_OPTIONS } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { format, isPast } from "date-fns";
import { generatePastelColor, getPriorityStyles, getTaskStatusStyles, isOverdue, cn, getAvatarUrl, getInitials, formatTaskText, truncateText } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "../ui/button";
import { MoreHorizontal, Edit, Trash2, Ticket, Paperclip, Eye, Download, File as FileIconLucide, ChevronDown, Loader2, SmilePlus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import TaskAttachmentList from './TaskAttachmentList';
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TaskDetailCard from './TaskDetailCard';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User as AuthUser } from '@supabase/supabase-js';

interface TasksViewProps {
  tasks: ProjectTask[];
  isLoading: boolean;
  onEdit: (task: ProjectTask) => void;
  onDelete: (taskId: string) => void;
  onToggleTaskCompletion: (task: ProjectTask, completed: boolean) => void;
  onStatusChange: (task: ProjectTask, newStatus: TaskStatus) => void;
  isToggling: boolean;
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  requestSort: (key: string) => void;
  rowRefs: React.MutableRefObject<Map<string, HTMLTableRowElement>>;
  highlightedTaskId: string | null;
  onHighlightComplete: () => void;
}

// Utility function to aggregate attachments
const aggregateAttachments = (task: ProjectTask): TaskAttachment[] => {
  let attachments: TaskAttachment[] = [...(task.attachments || [])];
  
  // 1. Add attachments from the modern ticket_attachments field (JSONB)
  if (task.ticket_attachments && task.ticket_attachments.length > 0) {
    const existingUrls = new Set(attachments.map(a => a.file_url));
    const uniqueTicketAttachments = task.ticket_attachments.filter(
      (ticketAtt) => ticketAtt.file_url && !existingUrls.has(ticketAtt.file_url)
    );
    attachments = [...attachments, ...uniqueTicketAttachments];
  }

  // 2. Add attachment from legacy fields if it exists and is not already included
  if (task.attachment_url && task.attachment_name) {
    const existingUrls = new Set(attachments.map((a) => a.file_url));
    if (!existingUrls.has(task.attachment_url)) {
      attachments.push({
        id: task.origin_ticket_id || `legacy-${task.id}`, // Use origin ticket ID if available
        file_name: task.attachment_name,
        file_url: task.attachment_url,
        file_type: null,
        file_size: null,
        storage_path: '', // Not available for legacy
        created_at: task.created_at, // Approximate time
      });
    }
  }

  return attachments;
};

const TasksView = ({ tasks: tasksProp, isLoading, onEdit, onDelete, onToggleTaskCompletion, onStatusChange, isToggling, sortConfig, requestSort, rowRefs, highlightedTaskId, onHighlightComplete }: TasksViewProps) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ProjectTask[]>(tasksProp);
  const queryClient = useQueryClient();
  const commonEmojis = ['👍', '❤️', '😂', '🎉', '🙏', '😢'];
  const initialSortSet = useRef(false);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find(t => t.id === selectedTaskId) || null;
  }, [selectedTaskId, tasks]);

  const handleEditTask = (task: ProjectTask) => {
    setSelectedTaskId(null);
    onEdit(task);
  };

  const handleDeleteTask = (taskId: string) => {
    setSelectedTaskId(null);
    onDelete(taskId);
  };

  useEffect(() => {
    if (highlightedTaskId && tasks.length > 0) {
      const element = rowRefs.current.get(highlightedTaskId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('bg-primary/10');
        setTimeout(() => {
          element.classList.remove('bg-primary/10');
          if (onHighlightComplete) {
            onHighlightComplete();
          }
        }, 2000);
      }
    }
  }, [highlightedTaskId, onHighlightComplete, rowRefs, tasks]);

  const getDueDateClassName = (dueDateStr: string | null, completed: boolean): string => {
    if (!dueDateStr || completed) {
      return "text-muted-foreground text-xs";
    }

    const dueDate = new Date(dueDateStr);
    const now = new Date();
    const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 0) {
      return "text-red-600 font-bold text-xs"; // Overdue
    }
    if (diffHours <= 1) {
      return "text-primary font-bold text-xs"; // Due within 1 hour
    }
    if (diffHours <= 24) {
      return "text-primary text-xs"; // Due within 1 day
    }
    return "text-muted-foreground text-xs"; // Not due soon
  };

  const getEffectivePriority = (task: ProjectTask): string => {
    const basePriority = task.priority || 'Low';
    // Normalize 'normal' to 'Normal' for consistent styling
    const normalizedPriority = basePriority.toLowerCase() === 'normal' ? 'Normal' : basePriority;

    if (task.completed || !task.due_date) {
        return normalizedPriority;
    }

    const dueDate = new Date(task.due_date);
    const now = new Date();
    const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Apply due date conditions
    if (diffHours < 0) { // Overdue tasks are Urgent
        return 'Urgent';
    }
    if (diffHours <= 12) { // Due within 12 hours
        return 'Urgent';
    }
    if (diffHours <= 48) { // Due within 48 hours (2 days)
        return 'High';
    }
    
    return normalizedPriority;
  };

  useEffect(() => {
    if (!initialSortSet.current && tasksProp.length > 0) {
      // Default sort: updated_at desc
      if (sortConfig.key !== 'updated_at') {
        requestSort('updated_at'); // This will trigger a re-render with asc
      } else if (sortConfig.direction !== 'desc') {
        requestSort('updated_at'); // This will toggle to desc
        initialSortSet.current = true;
      } else {
        // Already sorted correctly
        initialSortSet.current = true;
      }
    }
  }, [tasksProp, sortConfig, requestSort]);

  useEffect(() => {
    let tasksToSet = [...tasksProp];

    const getEffectiveStatus = (task: ProjectTask): string => {
      if (task.due_date && isOverdue(task.due_date) && !task.completed) {
        return 'Overdue';
      }
      return task.status;
    };

    if (sortConfig.key) {
      tasksToSet.sort((a, b) => {
        let valA: any;
        let valB: any;

        switch (sortConfig.key) {
          case 'priority':
            const priorityOrder: { [key: string]: number } = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Normal': 2, 'Low': 1 };
            valA = priorityOrder[getEffectivePriority(a)] || 0;
            valB = priorityOrder[getEffectivePriority(b)] || 0;
            break;
          case 'status':
            valA = getEffectiveStatus(a);
            valB = getEffectiveStatus(b);
            break;
          case 'due_date':
          case 'updated_at':
            valA = a[sortConfig.key] ? new Date(a[sortConfig.key] as string).getTime() : null;
            valB = b[sortConfig.key] ? new Date(b[sortConfig.key] as string).getTime() : null;
            break;
          case 'title':
            valA = a.title;
            valB = b.title;
            break;
          default:
            valA = a[sortConfig.key as keyof ProjectTask];
            valB = b[sortConfig.key as keyof ProjectTask];
        }

        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'string' && typeof valB === 'string') {
          return valA.localeCompare(valB);
        }

        if (valA < valB) return -1;
        if (valA > valB) return 1;
        return 0;
      });

      if (sortConfig.direction === 'desc') {
        tasksToSet.reverse();
      }
    }
    
    setTasks(tasksToSet);
  }, [tasksProp, sortConfig]);

  const handleEmojiSelect = async (emoji: string, taskId: string) => {
    if (!user) return;

    const previousTasks = tasks;
    setTasks(currentTasks =>
      currentTasks.map(task => {
        if (task.id === taskId) {
          const newReactions: Reaction[] = [...(task.reactions || [])];
          const existingReactionIndex = newReactions.findIndex(r => r.user_id === user.id);

          if (existingReactionIndex > -1) {
            if (newReactions[existingReactionIndex].emoji === emoji) {
              newReactions.splice(existingReactionIndex, 1);
            } else {
              newReactions[existingReactionIndex] = { ...newReactions[existingReactionIndex], emoji };
            }
          } else {
            newReactions.push({
              id: `temp-${Date.now()}`,
              emoji,
              user_id: user.id,
              user_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'You',
            });
          }
          return { ...task, reactions: newReactions };
        }
        return task;
      })
    );

    const { error } = await supabase.rpc('toggle_task_reaction', {
      p_task_id: taskId,
      p_emoji: emoji,
    });

    if (error) {
      console.error("Error toggling reaction:", error);
      toast.error("Failed to update reaction.");
      setTasks(previousTasks); // Rollback on error
    } else {
      // Invalidate queries to sync with the database in the background
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return <div className="text-center text-muted-foreground p-8">No tasks found.</div>;
  }

  const renderAttachments = (task: ProjectTask, allAttachments: TaskAttachment[]) => {
    if (allAttachments.length === 0) return null;

    return (
      <Drawer>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DrawerTrigger asChild onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1 text-muted-foreground cursor-pointer hover:text-primary">
                  <Paperclip className="h-4 w-4" />
                  <span className="text-xs">{allAttachments.length}</span>
                </div>
              </DrawerTrigger>
            </TooltipTrigger>
            <TooltipContent><p>{allAttachments.length} attachment(s)</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DrawerContent>
          <TaskAttachmentList attachments={allAttachments} />
        </DrawerContent>
      </Drawer>
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <Drawer open={!!selectedTask} onOpenChange={(isOpen) => { if (!isOpen) setSelectedTaskId(null); }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%] sm:w-[30%] cursor-pointer hover:bg-muted/50" onClick={() => requestSort('title')}>
                Task
              </TableHead>
              <TableHead className="w-[20%]">Project</TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('status')}>
                Status
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('priority')}>
                Priority
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('due_date')}>
                Due Date
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('updated_at')}>
                Last Updated
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center h-24">Loading tasks...</TableCell></TableRow>
            ) : tasks.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center h-24">No tasks found.</TableCell></TableRow>
            ) : (
              tasks.map(task => {
                const effectivePriority = getEffectivePriority(task);
                const statusStyle = getTaskStatusStyles(task.status);
                const priorityStyle = getPriorityStyles(effectivePriority);
                const allAttachments = aggregateAttachments(task);
                const hasAssignees = task.assignedTo && task.assignedTo.length > 0;
                const reactions = task.reactions || [];
                const hasBottomBar = hasAssignees || reactions.length > 0 || (task.origin_ticket_id || task.tags?.some(t => t.name === 'Ticket')) || allAttachments.length > 0;

                const groupedReactions: Record<string, { users: string[]; userIds: string[] }> = reactions.reduce((acc, reaction) => {
                    if (!acc[reaction.emoji]) {
                        acc[reaction.emoji] = { users: [], userIds: [] };
                    }
                    acc[reaction.emoji].users.push(reaction.user_name);
                    acc[reaction.emoji].userIds.push(reaction.user_id);
                    return acc;
                }, {} as Record<string, { users: string[]; userIds: string[] }>);

                return (
                  <TableRow 
                    key={task.id}
                    ref={el => {
                      if (el) rowRefs.current.set(task.id, el);
                      else rowRefs.current.delete(task.id);
                    }}
                    data-state={task.completed ? "completed" : ""}
                  >
                    <TableCell className="font-medium w-[40%] sm:w-[30%]">
                      <div className="flex items-start gap-3">
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            id={`task-${task.id}`}
                            checked={task.completed}
                            onCheckedChange={(checked) => onToggleTaskCompletion(task, !!checked)}
                            aria-label={`Mark task ${task.title} as complete`}
                            className="mt-1"
                            disabled={isToggling}
                          />
                        </div>
                        <DrawerTrigger asChild>
                          <div className="flex flex-col cursor-pointer text-sm md:text-base w-full" onClick={() => setSelectedTaskId(task.id)}>
                            <div className="flex items-center gap-2">
                              <div className={`${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: 'span' }}>
                                  {formatTaskText(task.title)}
                                </ReactMarkdown>
                              </div>
                            </div>
                            {task.origin_ticket_id && task.created_by && (
                              <p className="text-xs text-muted-foreground mt-1">
                                From: {task.created_by.email}
                              </p>
                            )}
                            {task.description && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {formatTaskText(task.description, 50)}
                                    </p>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{formatTaskText(task.description)}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {hasBottomBar && (
                              <div className="flex justify-between items-center border-t pt-1 mt-1">
                                <div className="flex items-center gap-2">
                                  {hasAssignees && (
                                    <div className="flex items-center -space-x-2">
                                      {task.assignedTo?.map((user) => (
                                        <TooltipProvider key={user.id}>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Link to="/chat" state={{ recipient: user }} onClick={(e) => e.stopPropagation()}>
                                                <Avatar className="h-6 w-6 border-2 border-background">
                                                  <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                                                  <AvatarFallback style={generatePastelColor(user.id)}>
                                                    {getInitials([user.first_name, user.last_name].filter(Boolean).join(' '), user.email || undefined)}
                                                  </AvatarFallback>
                                                </Avatar>
                                              </Link>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>{[user.first_name, user.last_name].filter(Boolean).join(' ')}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      ))}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {Object.entries(groupedReactions).map(([emoji, { users, userIds }]) => {
                                        const userHasReacted = user ? userIds.includes(user.id) : false;
                                        return (
                                            <TooltipProvider key={emoji}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEmojiSelect(emoji, task.id);
                                                            }}
                                                            className={cn(
                                                                "px-1.5 py-0.5 rounded-full text-xs flex items-center gap-1 transition-colors border",
                                                                userHasReacted
                                                                ? "bg-primary/20 border-primary/50"
                                                                : "bg-muted hover:bg-muted/80"
                                                            )}
                                                        >
                                                            <span>{emoji}</span>
                                                            <span className="font-medium text-xs">{users.length}</span>
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{users.join(', ')}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        );
                                    })}
                                  </div>
                                </div>
                                <div className="flex justify-end gap-1 items-center mr-1">
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button className="hover:bg-muted rounded-full p-1.5 transition-transform transform hover:scale-125">
                                        <SmilePlus className="h-5 w-5 text-muted-foreground" />
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-0 w-auto border-0"
                                      side="bottom"
                                      align="start"
                                      sideOffset={8}
                                    >
                                      <EmojiPicker
                                        onEmojiClick={(emojiObject) => {
                                          handleEmojiSelect(emojiObject.emoji, task.id);
                                        }}
                                        emojiStyle={EmojiStyle.NATIVE}
                                        previewConfig={{ showPreview: false }}
                                        width={350}
                                        height={400}
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  {(task.origin_ticket_id || task.tags?.some(t => t.name === 'Ticket')) && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Ticket className={`h-4 w-4 flex-shrink-0 ${task.completed ? 'text-green-500' : 'text-red-500'}`} />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>This is a ticket</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                  {renderAttachments(task, allAttachments)}
                                </div>
                              </div>
                            )}
                          </div>
                        </DrawerTrigger>
                      </div>
                    </TableCell>
                    <TableCell className="w-[20%]">
                      {task.project_name && task.project_name !== 'General Tasks' ? (
                        <Link to={`/projects/${task.project_slug}`} className="hover:underline text-primary text-xs block max-w-[50ch] break-words">
                          {task.project_name}
                        </Link>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={task.status}
                        onValueChange={(newStatus: TaskStatus) => onStatusChange(task, newStatus)}
                      >
                        <SelectTrigger className={cn(
                          "h-auto border-0 focus:ring-0 focus:ring-offset-0 shadow-none bg-transparent p-0 w-auto",
                          isOverdue(task.due_date) && !task.completed && "ring-2 ring-destructive rounded-md px-1"
                        )}>
                          <SelectValue>
                            <Badge variant="outline" className={cn(getTaskStatusStyles(task.status).tw, 'border-transparent font-normal')}>
                              {task.status}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_STATUS_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityStyle.tw}>{effectivePriority}</Badge>
                    </TableCell>
                    <TableCell>
                      {task.due_date ? (
                        <span className={getDueDateClassName(task.due_date, task.completed)}>
                          {format(new Date(task.due_date), "MMM d, yyyy, p")}
                        </span>
                      ) : <span className="text-muted-foreground text-xs">No due date</span>}
                    </TableCell>
                    <TableCell>
                      {task.updated_at ? (
                        <span className="text-muted-foreground text-xs">
                          {format(new Date(task.updated_at), "MMM d, yyyy, p")}
                        </span>
                      ) : <span className="text-muted-foreground text-xs">-</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => onEdit(task)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onDelete(task.id)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <DrawerContent>
          {selectedTask && (
            <TaskDetailCard
              task={selectedTask}
              onClose={() => setSelectedTaskId(null)}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default TasksView;