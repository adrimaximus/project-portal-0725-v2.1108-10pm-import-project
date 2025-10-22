import React, { useState } from "react";
import { Task, TaskAttachment } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { generatePastelColor, getPriorityStyles, getTaskStatusStyles, isOverdue, cn, getAvatarUrl, getInitials, formatTaskText } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "../ui/button";
import { MoreHorizontal, Edit, Trash2, Ticket, Paperclip } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import TaskAttachmentList from './TaskAttachmentList';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Table as Table2,
  TableBody as TableBody2,
  TableCell as TableCell2,
  TableHead as TableHead2,
  TableHeader as TableHeader2,
  TableRow as TableRow2,
} from "@/components/ui/table";
import { Button as Button2 } from '@/components/ui/button';
import { Checkbox as Checkbox2 } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, PlusCircle, Loader2, MessageSquare, Paperclip, Ticket, Trash2, Edit, X, Send } from 'lucide-react';
import CommentInput from '@/components/CommentInput';
import { Project, Task, Comment, Tag, User } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isOverdue } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatTaskText } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import TaskDetailCard from './TaskDetailCard';

interface TasksViewProps {
  project: Project;
  tasks: Task[];
  refetchTasks: () => void;
  profiles: User[];
  tags: Tag[];
}

const TasksView = ({ project, tasks, refetchTasks, profiles, tags }: TasksViewProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task> | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentAttachments, setNewCommentAttachments] = useState<File[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | undefined>(undefined);
  const [newTaskPriority, setNewTaskPriority] = useState<string>('normal');
  const [newTaskStatus, setNewTaskStatus] = useState<string>('To do');
  const [newTaskAssignees, setNewTaskAssignees] = useState<string[]>([]);
  const [newTaskTags, setNewTaskTags] = useState<string[]>([]);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [isTagOpen, setIsTagOpen] = useState(false);

  const handleAddCommentOrTicket = async (text: string, isTicket: boolean, attachments: File[] | null, mentionedUserIds: string[], description?: string) => {
    if (!project || !user) return;

    try {
      let finalCommentText = text;
      let firstAttachmentUrl: string | null = null;
      let firstAttachmentName: string | null = null;
      let firstAttachmentType: string | null = null;

      if (attachments && attachments.length > 0) {
        const uploadPromises = attachments.map(async (file) => {
          const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
          const filePath = `${project.id}/comments/${Date.now()}-${sanitizedFileName}`;
          const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, file);
          if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
          
          const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(filePath);
          return { name: file.name, url: urlData.publicUrl, type: file.type };
        });

        const uploadedFiles = await Promise.all(uploadPromises);

        if (uploadedFiles.length > 0) {
          firstAttachmentUrl = uploadedFiles[0].url;
          firstAttachmentName = uploadedFiles[0].name;
          firstAttachmentType = uploadedFiles[0].type;

          const markdownLinks = uploadedFiles.map(file => `* [${file.name}](${file.url})`).join('\n');
          finalCommentText += `\n\n**Attachments:**\n${markdownLinks}`;
        }
      }

      const { data: commentData, error: commentError } = await supabase.from('comments').insert({
        project_id: project.id, 
        author_id: user.id, 
        text: finalCommentText, 
        is_ticket: isTicket, 
        attachment_url: firstAttachmentUrl, 
        attachment_name: firstAttachmentName,
      }).select().single();
      
      if (commentError) throw commentError;

      if (mentionedUserIds.length > 0) {
        supabase.functions.invoke('send-mention-email', {
          body: {
            project_slug: project.slug,
            project_name: project.name,
            mentioner_name: user.name,
            mentioned_user_ids: mentionedUserIds,
            comment_text: text,
          },
        }).then(({ error }) => {
          if (error) {
            console.error("Failed to trigger mention email notifications:", error);
          }
        });
      }

      if (isTicket && commentData) {
          const cleanTextForTitle = text.replace(/@\[[^\]]+\]\([^)]+\)\s*/g, '').trim();

          const { data: newTask, error: taskError } = await supabase.from('tasks').insert({
              project_id: project.id, 
              created_by: user.id, 
              title: text, // This is now the AI-generated title from CommentInput
              description: description, // This is the original comment text from CommentInput
              origin_ticket_id: commentData.id,
              status: 'To do', // Default status for new tickets
              priority: 'high', // Default priority for new tickets
          }).select().single();
          
          if (taskError) throw new Error(`Ticket created, but failed to create task: ${taskError.message}`);

          if (newTask && mentionedUserIds.length > 0) {
              const assignments = mentionedUserIds.map(userId => ({
                  task_id: newTask.id,
                  user_id: userId,
              }));
              const { error: assignError } = await supabase.from('task_assignees').insert(assignments);
              if (assignError) {
                  console.warn('Failed to assign mentioned users:', assignError);
                  toast.warning("Ticket created, but couldn't assign mentioned users automatically.");
              }
          }
      }
      toast.success(isTicket ? "Ticket created and added to tasks." : "Comment posted.");
      refetchTasks();
      queryClient.invalidateQueries(['projectComments', project.id]);
      queryClient.invalidateQueries(['project', project.slug]);
      setNewCommentText('');
      setNewCommentAttachments([]);
    } catch (error: any) {
      console.error('Error adding comment or ticket:', error);
      toast.error(`Failed to add comment or ticket: ${error.message}`);
    }
  };

  const handleUpdateTask = async () => {
    if (!editedTask || !selectedTask) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update(editedTask)
        .eq('id', selectedTask.id);

      if (error) throw error;

      toast.success('Task updated successfully!');
      setIsEditingTask(false);
      setSelectedTask(null); // Close dialog after update
      refetchTasks();
      queryClient.invalidateQueries(['project', project.slug]);
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast.error(`Failed to update task: ${error.message}`);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Task deleted successfully!');
      setSelectedTask(null); // Close dialog after delete
      refetchTasks();
      queryClient.invalidateQueries(['project', project.slug]);
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast.error(`Failed to delete task: ${error.message}`);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      toast.error('Task title cannot be empty.');
      return;
    }

    try {
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert({
          project_id: project.id,
          title: newTaskTitle,
          description: newTaskDescription,
          due_date: newTaskDueDate?.toISOString(),
          priority: newTaskPriority,
          status: newTaskStatus,
          created_by: user?.id,
        })
        .select()
        .single();

      if (taskError) throw taskError;

      if (newTaskAssignees.length > 0) {
        const assigneeInserts = newTaskAssignees.map(assigneeId => ({
          task_id: taskData.id,
          user_id: assigneeId,
        }));
        const { error: assigneeError } = await supabase
          .from('task_assignees')
          .insert(assigneeInserts);
        if (assigneeError) throw assigneeError;
      }

      if (newTaskTags.length > 0) {
        const tagInserts = newTaskTags.map(tagId => ({
          task_id: taskData.id,
          tag_id: tagId,
        }));
        const { error: tagError } = await supabase
          .from('task_tags')
          .insert(tagInserts);
        if (tagError) throw tagError;
      }

      toast.success('Task added successfully!');
      setIsAddingTask(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskDueDate(undefined);
      setNewTaskPriority('normal');
      setNewTaskStatus('To do');
      setNewTaskAssignees([]);
      setNewTaskTags([]);
      refetchTasks();
      queryClient.invalidateQueries(['project', project.slug]);
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast.error(`Failed to add task: ${error.message}`);
    }
  };

  const renderAttachments = (task: Task) => {
    const allAttachments: TaskAttachment[] = [...(task.attachments || [])];

    if (task.originTicketId && task.attachment_url) {
      if (!allAttachments.some(att => att.file_url === task.attachment_url)) {
        allAttachments.unshift({
          id: `origin-${task.originTicketId}`,
          file_name: task.attachment_name || 'Ticket Attachment',
          file_url: task.attachment_url,
          file_type: '',
          file_size: 0,
          storage_path: '',
          created_at: task.created_at,
        });
      }
    }

    if (allAttachments.length === 0) return null;

    return (
      <Dialog>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1 text-muted-foreground cursor-pointer hover:text-primary">
                  <Paperclip className="h-4 w-4" />
                  <span className="text-xs">{allAttachments.length}</span>
                </div>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent><p>{allAttachments.length} attachment(s)</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DialogContent>
          <TaskAttachmentList attachments={allAttachments} />
        </DialogContent>
      </Dialog>
    );
  };

  const statusStyle: { [key: string]: { tw: string } } = {
    'To do': { tw: 'bg-gray-200 text-gray-800' },
    'In Progress': { tw: 'bg-blue-200 text-blue-800' },
    'Done': { tw: 'bg-green-200 text-green-800' },
    'Blocked': { tw: 'bg-red-200 text-red-800' },
  };

  const priorityStyle: { [key: string]: { tw: string } } = {
    'low': { tw: 'bg-green-100 text-green-700' },
    'normal': { tw: 'bg-yellow-100 text-yellow-700' },
    'high': { tw: 'bg-red-100 text-red-700' },
  };

  let lastMonthYear: string | null = null;
  const isDateSorted = sortConfig.key === 'due_date';

  return (
    <div className="w-full overflow-x-auto">
      <Dialog open={!!selectedTask} onOpenChange={(isOpen) => !isOpen && setSelectedTask(null)}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%] sm:w-[30%] cursor-pointer hover:bg-muted/50 sticky left-0 bg-background z-10" onClick={() => requestSort('title')}>
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
              <TableHead>Assignees</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map(task => {
              const statusStyle = getTaskStatusStyles(task.status);
              const priorityStyle = getPriorityStyles(task.priority);

              const taskMonthYear = task.due_date ? format(new Date(task.due_date), 'MMMM yyyy') : 'No Due Date';
              let showMonthSeparator = false;
              if (isDateSorted && taskMonthYear !== lastMonthYear) {
                showMonthSeparator = true;
                lastMonthYear = taskMonthYear;
              }

              return (
                <React.Fragment key={task.id}>
                  {showMonthSeparator && (
                    <TableRow className="border-none hover:bg-transparent">
                      <TableCell colSpan={8} className="pt-6 pb-2 px-4 text-sm font-semibold text-foreground">
                        {taskMonthYear}
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow data-state={task.completed ? "completed" : ""}>
                    <TableCell className="font-medium sticky left-0 bg-background z-10 w-[40%] sm:w-[30%]">
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
                        <DialogTrigger asChild>
                          <div className="flex flex-col cursor-pointer text-sm md:text-base" onClick={() => setSelectedTask(task)}>
                            <div className="flex items-center gap-2">
                              <div className={`${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: 'span' }}>
                                  {formatTaskText(task.title)}
                                </ReactMarkdown>
                              </div>
                            </div>
                            {task.originTicketId && task.created_by && (
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
                            <div className="flex justify-between items-center mt-2">
                              <div className="flex gap-1 flex-wrap">
                                {task.tags?.map(tag => (
                                  <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }}>{tag.name}</Badge>
                                ))}
                              </div>
                              <div className="flex gap-1 items-center mr-1.5">
                                {(task.originTicketId || task.tags?.some(t => t.name === 'Ticket')) && (
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
                                {renderAttachments(task)}
                              </div>
                            </div>
                          </div>
                        </DialogTrigger>
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
                      <Badge className={cn(statusStyle.tw, 'border-transparent')}>{task.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityStyle.tw}>{task.priority || 'Low'}</Badge>
                    </TableCell>
                    <TableCell>
                      {task.due_date ? (
                        <span className={cn(isOverdue(task.due_date) && "text-red-600 font-bold")}>
                          {format(new Date(task.due_date), "MMM d, yyyy")}
                        </span>
                      ) : <span className="text-muted-foreground text-xs">No due date</span>}
                    </TableCell>
                    <TableCell>
                      {task.updated_at ? (
                        <span className="text-muted-foreground text-xs">
                          {format(new Date(task.updated_at), "MMM d, yyyy")}
                        </span>
                      ) : <span className="text-muted-foreground text-xs">-</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center -space-x-1 md:-space-x-2">
                        {task.assignedTo?.map((assignee) => (
                          <TooltipProvider key={assignee.id}>
                            <Tooltip>
                              <TooltipTrigger>
                                <Avatar className="h-5 w-5 md:h-6 md:w-6 border-2 border-background">
                                  <AvatarImage src={getAvatarUrl(assignee.avatar_url, assignee.id)} />
                                  <AvatarFallback style={generatePastelColor(assignee.id)}>
                                    {getInitials([assignee.first_name, assignee.last_name].filter(Boolean).join(' '), assignee.email || undefined)}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{[assignee.first_name, assignee.last_name].filter(Boolean).join(' ')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(task)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-500"
                              onClick={() => onDelete(task.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              )
            })}
          </TableBody>
        </Table>
        {selectedTask && (
          <TaskDetailCard
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      </Dialog>
    </div>
  );
};

export default TasksView;