import React, { useEffect, useRef, useMemo } from 'react';
import { Task as ProjectTask, User, TaskStatus, TASK_STATUS_OPTIONS } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { format, isPast } from "date-fns";
import { generatePastelColor, getPriorityStyles, getTaskStatusStyles, isOverdue, cn, getAvatarUrl, getInitials, formatTaskText } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "../ui/button";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  onTaskClick: (task: ProjectTask) => void;
}

const TasksView = ({ tasks: tasksProp, isLoading, onEdit, onDelete, onToggleTaskCompletion, onStatusChange, isToggling, sortConfig, requestSort, rowRefs, highlightedTaskId, onHighlightComplete, onTaskClick }: TasksViewProps) => {
  const initialSortSet = useRef(false);

  useEffect(() => {
    if (highlightedTaskId && tasksProp.length > 0) {
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
  }, [highlightedTaskId, onHighlightComplete, rowRefs, tasksProp]);

  const getDueDateClassName = (dueDateStr: string | null, completed: boolean): string => {
    if (!dueDateStr || completed) {
      return "text-muted-foreground text-xs";
    }
    if (isPast(new Date(dueDateStr))) {
      return "text-destructive font-semibold text-xs";
    }
    return "text-muted-foreground text-xs";
  };

  const getEffectivePriority = (task: ProjectTask): string => {
    const basePriority = task.priority || 'Low';
    const normalizedPriority = basePriority.toLowerCase() === 'normal' ? 'Normal' : basePriority;
    if (task.completed || !task.due_date) return normalizedPriority;
    if (isPast(new Date(task.due_date))) return 'Urgent';
    return normalizedPriority;
  };

  useEffect(() => {
    if (!initialSortSet.current && tasksProp.length > 0) {
      if (sortConfig.key !== 'updated_at' || sortConfig.direction !== 'desc') {
        requestSort('updated_at');
        if (sortConfig.key === 'updated_at' && sortConfig.direction === 'asc') {
          requestSort('updated_at');
        }
      }
      initialSortSet.current = true;
    }
  }, [tasksProp, sortConfig, requestSort]);

  const sortedTasks = useMemo(() => {
    let sortableItems = [...tasksProp];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let valA: any, valB: any;
        switch (sortConfig.key) {
          case 'priority':
            const priorityOrder: { [key: string]: number } = { 'Urgent': 4, 'High': 3, 'Normal': 2, 'Low': 1 };
            valA = priorityOrder[getEffectivePriority(a)] || 0;
            valB = priorityOrder[getEffectivePriority(b)] || 0;
            break;
          case 'status':
            valA = a.status;
            valB = b.status;
            break;
          case 'due_date':
          case 'updated_at':
            valA = a[sortConfig.key] ? new Date(a[sortConfig.key] as string).getTime() : null;
            valB = b[sortConfig.key] ? new Date(b[sortConfig.key] as string).getTime() : null;
            break;
          default:
            valA = a[sortConfig.key as keyof ProjectTask];
            valB = b[sortConfig.key as keyof ProjectTask];
        }
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [tasksProp, sortConfig]);

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

  if (sortedTasks.length === 0) {
    return <div className="text-center text-muted-foreground p-8">No tasks found.</div>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
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
          {sortedTasks.map(task => (
            <TableRow 
              key={task.id}
              ref={el => {
                if (el) rowRefs.current.set(task.id, el);
                else rowRefs.current.delete(task.id);
              }}
              data-state={task.completed ? "completed" : ""}
              onClick={() => onTaskClick && onTaskClick(task)}
              className="cursor-pointer"
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
                  <div className="flex flex-col text-sm md:text-base w-full">
                    <div className="flex items-center gap-2">
                      <div className={`${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {formatTaskText(task.title)}
                      </div>
                    </div>
                  </div>
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
                <Badge className={getPriorityStyles(getEffectivePriority(task)).tw}>{getEffectivePriority(task)}</Badge>
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TasksView;