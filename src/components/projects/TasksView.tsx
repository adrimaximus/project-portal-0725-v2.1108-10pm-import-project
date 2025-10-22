import React, { useState } from "react";
import { Task as ProjectTask, TaskAttachment } from "@/types";
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
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TaskDetailCard from './TaskDetailCard';

interface TasksViewProps {
  tasks: ProjectTask[];
  isLoading: boolean;
  onEdit: (task: ProjectTask) => void;
  onDelete: (taskId: string) => void;
  onToggleTaskCompletion: (task: ProjectTask, completed: boolean) => void;
  isToggling: boolean;
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  requestSort: (key: string) => void;
}

const processMentions = (text: string | null | undefined) => {
  if (!text) return '';
  let processedText = text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1');
  if (processedText.length > 50) {
    return processedText.substring(0, 50) + '...';
  }
  return processedText;
};

const TasksView = ({ tasks, isLoading, onEdit, onDelete, onToggleTaskCompletion, isToggling, sortConfig, requestSort }: TasksViewProps) => {
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);

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

  const renderAttachments = (task: ProjectTask) => {
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
                                {(task.originTicketId || task.origin_ticket_id || task.tags?.some(t => t.name === 'Ticket')) && (
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
                      <div className="flex items-center -space-x-2">
                        {task.assignedTo?.map((user) => (
                          <TooltipProvider key={user.id}>
                            <Tooltip>
                              <TooltipTrigger>
                                <Avatar className="h-6 w-6 md:h-8 md:w-8 border-2 border-background">
                                  <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                                  <AvatarFallback style={generatePastelColor(user.id)}>
                                    {getInitials([user.first_name, user.last_name].filter(Boolean).join(' '), user.email || undefined)}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{[user.first_name, user.last_name].filter(Boolean).join(' ')}</p>
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