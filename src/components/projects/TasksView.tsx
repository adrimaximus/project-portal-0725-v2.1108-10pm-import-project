import React, { useMemo } from 'react';
import { Task as ProjectTask, User, TaskStatus, TASK_STATUS_OPTIONS } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { format, isPast } from "date-fns";
import { generatePastelColor, getPriorityStyles, getTaskStatusStyles, isOverdue, cn, getAvatarUrl, getInitials } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "../ui/button";
import { MoreHorizontal, Edit, Trash2, Ticket, Paperclip, Eye, Download, File as FileIconLucide, ChevronDown, Loader2, SmilePlus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from '@/hooks/use-mobile';
import { useTaskDrawer } from '@/contexts/TaskDrawerContext';
import { getProjectBySlug } from '@/lib/projectsApi';
import { SortableTableHead } from '../ui/SortableTableHead';
import TaskReactions from './TaskReactions';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { useQueryClient } from '@tanstack/react-query';
import InteractiveText from '../InteractiveText';
import { useProfiles } from '@/hooks/useProfiles';

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
  unreadTaskIds: string[];
}

const TaskListItem = ({ task, onToggleTaskCompletion, onTaskClick, isUnread, allUsers }: { task: ProjectTask, onToggleTaskCompletion: (task: ProjectTask, completed: boolean) => void, onTaskClick: (task: ProjectTask) => void, isUnread: boolean, allUsers: User[] }) => {
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  let dueDateText = '';
  let dueDateColor = 'text-muted-foreground';

  if (dueDate) {
    if (isPast(dueDate) && !task.completed) {
      dueDateText = format(dueDate, 'MMM d');
      dueDateColor = 'text-destructive';
    } else {
      dueDateText = format(dueDate, 'MMM d');
    }
  }

  return (
    <div className="flex items-start gap-3 p-3 border-b" onClick={() => onTaskClick(task)}>
      <Checkbox
        id={`task-mobile-${task.id}`}
        checked={task.completed}
        onCheckedChange={(checked) => onToggleTaskCompletion(task, !!checked)}
        className="mt-1"
        onClick={(e) => e.stopPropagation()}
        disabled={isToggling}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isUnread && <div className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />}
          <div className={cn("font-medium", task.completed && "line-through text-muted-foreground")}>
            <InteractiveText text={task.title} members={allUsers} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{task.project_name}</p>
        <div className="flex items-center gap-4 mt-2">
          {dueDateText && <span className={`text-xs font-medium ${dueDateColor}`}>{dueDateText}</span>}
          <div className="flex -space-x-2">
            {task.assignedTo?.slice(0, 3).map(user => (
              <Avatar key={user.id} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                <AvatarFallback style={generatePastelColor(user.id)}>{getInitials([user.first_name, user.last_name].filter(Boolean).join(' '), user.email || undefined)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const TasksView = ({ tasks, isLoading, onEdit, onDelete, onToggleTaskCompletion, onStatusChange, isToggling, sortConfig, requestSort, rowRefs, highlightedTaskId, onHighlightComplete, unreadTaskIds }: TasksViewProps) => {
  const isMobile = useIsMobile();
  const { onOpen: onOpenTaskDrawer } = useTaskDrawer();
  const queryClient = useQueryClient();
  const { toggleTaskReaction } = useTaskMutations(() => queryClient.invalidateQueries({ queryKey: ['tasks'] }));
  const { data: allUsers = [] } = useProfiles();

  const handleTaskClick = async (task: ProjectTask) => {
    try {
      const projectForTask = await getProjectBySlug(task.project_slug);
      if (!projectForTask) {
        throw new Error("Project for this task could not be found.");
      }
      onOpenTaskDrawer(task, projectForTask);
    } catch (error) {
      toast.error("Could not open task details.", { description: (error as Error).message });
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

  if (isMobile) {
    return (
      <div>
        {tasks.map(task => (
          <TaskListItem 
            key={task.id} 
            task={task} 
            onToggleTaskCompletion={onToggleTaskCompletion}
            onTaskClick={handleTaskClick}
            isUnread={unreadTaskIds.includes(task.id)}
            allUsers={allUsers}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-auto h-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-px p-2"></TableHead>
            <SortableTableHead columnKey="title" onSort={requestSort} sortConfig={sortConfig} className="w-[40%]">Task</SortableTableHead>
            <SortableTableHead columnKey="project_name" onSort={requestSort} sortConfig={sortConfig}>Project</SortableTableHead>
            <SortableTableHead columnKey="status" onSort={requestSort} sortConfig={sortConfig}>Status</SortableTableHead>
            <SortableTableHead columnKey="priority" onSort={requestSort} sortConfig={sortConfig}>Priority</SortableTableHead>
            <SortableTableHead columnKey="due_date" onSort={requestSort} sortConfig={sortConfig}>Due Date</SortableTableHead>
            <TableHead>Assignees</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map(task => (
            <TableRow 
              key={task.id} 
              ref={el => { if (el) rowRefs.current.set(task.id, el); else rowRefs.current.delete(task.id); }}
              onClick={() => handleTaskClick(task)}
              className="cursor-pointer"
            >
              <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={(checked) => onToggleTaskCompletion(task, !!checked)}
                  disabled={isToggling}
                />
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {unreadTaskIds.includes(task.id) && <div className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />}
                  <div className={cn(task.completed && "line-through text-muted-foreground")}>
                    <InteractiveText text={task.title} members={allUsers} />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Link to={`/projects/${task.project_slug}`} onClick={(e) => e.stopPropagation()} className="hover:underline text-primary text-xs block max-w-[15ch] truncate">
                  {task.project_name}
                </Link>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Select value={task.status} onValueChange={(newStatus: TaskStatus) => onStatusChange(task, newStatus)}>
                  <SelectTrigger className="h-auto p-0 border-0 focus:ring-0 focus:ring-offset-0 w-auto bg-transparent shadow-none">
                    <SelectValue>
                      <Badge variant="outline" className={cn(getTaskStatusStyles(task.status).tw, 'border-transparent font-normal')}>
                        {task.status}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Badge className={getPriorityStyles(task.priority).tw}>{task.priority}</Badge>
              </TableCell>
              <TableCell className={cn("text-xs", isOverdue(task.due_date) && !task.completed && "text-destructive font-semibold")}>
                {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : '-'}
              </TableCell>
              <TableCell>
                <div className="flex -space-x-2">
                  {task.assignedTo?.map(user => (
                    <TooltipProvider key={user.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar className="h-6 w-6 border-2 border-background">
                            <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                            <AvatarFallback style={generatePastelColor(user.id)}>{getInitials([user.first_name, user.last_name].filter(Boolean).join(' '), user.email || undefined)}</AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent><p>{user.name}</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onEdit(task)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onDelete(task.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TasksView;