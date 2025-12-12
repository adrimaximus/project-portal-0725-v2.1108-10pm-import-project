import React, { useMemo, useState, useEffect } from 'react';
import { Task as ProjectTask, User, TaskStatus, TASK_STATUS_OPTIONS } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { format, isPast } from "date-fns";
import { generatePastelColor, getPriorityStyles, getTaskStatusStyles, isOverdue, cn, getAvatarUrl, getInitials } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "../ui/button";
import { MoreHorizontal, Edit, Trash2, Loader2, Plus, CalendarIcon, Clock } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "../ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from '@/hooks/use-mobile';
import { useTaskDrawer } from '@/contexts/TaskDrawerContext';
import { getProjectBySlug } from '@/lib/projectsApi';
import { SortableTableHead } from '../ui/SortableTableHead';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { useQueryClient } from '@tanstack/react-query';
import InteractiveText from '../InteractiveText';
import { useProfiles } from '@/hooks/useProfiles';
import { toast } from 'sonner';
import { markTaskAsRead } from '@/lib/tasksApi';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const PRIORITY_OPTIONS = [
  { value: 'Low', label: 'Low' },
  { value: 'Normal', label: 'Normal' },
  { value: 'High', label: 'High' },
  { value: 'Urgent', label: 'Urgent' },
];

interface TasksTableViewProps {
  tasks: ProjectTask[];
  isLoading: boolean;
  onEdit: (task: ProjectTask) => void;
  onDelete: (taskId: string) => void;
  onToggleTaskCompletion: (task: ProjectTask, completed: boolean) => void;
  onStatusChange: (task: ProjectTask, newStatus: TaskStatus) => void;
  isToggling: boolean;
  sortConfig: { key: string | null; direction: 'asc' | 'desc' };
  requestSort: (key: string) => void;
  rowRefs: React.MutableRefObject<Map<string, HTMLTableRowElement>>;
  highlightedTaskId: string | null;
  onHighlightComplete: () => void;
  unreadTaskIds: string[];
}

const TaskListItem = ({ task, onToggleTaskCompletion, onTaskClick, isUnread, allUsers, isToggling }: { task: ProjectTask, onToggleTaskCompletion: (task: ProjectTask, completed: boolean) => void, onTaskClick: (task: ProjectTask) => void, isUnread: boolean, allUsers: User[], isToggling: boolean }) => {
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  let dueDateText = '';
  let dueDateColor = 'text-muted-foreground';

  if (dueDate) {
    if (isPast(dueDate) && !task.completed) {
      dueDateText = format(dueDate, 'MMM d, p');
      dueDateColor = 'text-destructive';
    } else {
      dueDateText = format(dueDate, 'MMM d, p');
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
          <div className={cn("break-words min-w-0", isUnread ? "font-semibold" : "font-normal", task.completed && "line-through text-muted-foreground")}>
            <InteractiveText text={task.title} members={allUsers} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground truncate">{task.project_name}</p>
        <div className="flex items-center gap-4 mt-2 border-t pt-2">
          {task.priority && (
            <Badge className={cn(getPriorityStyles(task.priority).tw, 'text-xs')}>{task.priority}</Badge>
          )}
          {dueDateText && <span className={`text-xs font-medium ${dueDateColor}`}>{dueDateText}</span>}
          {task.updated_at && (
            <span className="text-xs text-muted-foreground">Upd: {format(new Date(task.updated_at), 'MMM d')}</span>
          )}
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

const AssigneeSelector = ({ task, allUsers, onAssigneeChange }: { task: ProjectTask, allUsers: User[], onAssigneeChange: (userId: string, assigned: boolean) => void }) => {
  const assignedIds = new Set(task.assignedTo?.map(u => u.id) || []);

  const validUsers = allUsers.filter(u => u.id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div 
          className="flex items-center cursor-pointer hover:bg-muted/50 p-1 rounded-md transition-colors -space-x-2 min-h-[32px] min-w-[32px] w-fit"
          onClick={(e) => e.stopPropagation()}
        >
          {task.assignedTo && task.assignedTo.length > 0 ? (
            <>
              {task.assignedTo.slice(0, 3).map(user => (
                 <Avatar key={user.id} className="h-6 w-6 border-2 border-background ring-offset-background">
                  <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                  <AvatarFallback style={generatePastelColor(user.id)}>{getInitials([user.first_name, user.last_name].filter(Boolean).join(' '), user.email || undefined)}</AvatarFallback>
                </Avatar>
              ))}
              {task.assignedTo.length > 3 && (
                 <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] border-2 border-background font-medium z-10">
                   +{task.assignedTo.length - 3}
                 </div>
              )}
            </>
          ) : (
             <div className="h-6 w-6 rounded-full bg-muted/50 flex items-center justify-center border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors">
                <Plus className="h-3 w-3 text-muted-foreground" />
             </div>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel>Assignees</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {validUsers.length > 0 ? validUsers.map(user => (
          <DropdownMenuCheckboxItem
            key={user.id}
            checked={assignedIds.has(user.id)}
            onCheckedChange={(checked) => onAssigneeChange(user.id, checked)}
            onSelect={(e) => e.preventDefault()}
          >
            <div className="flex items-center gap-2">
               <Avatar className="h-5 w-5">
                <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                <AvatarFallback className="text-[9px]">{getInitials([user.first_name, user.last_name].filter(Boolean).join(' '), user.email || undefined)}</AvatarFallback>
              </Avatar>
              <span className="truncate text-sm">{user.name || user.email || 'Unknown'}</span>
            </div>
          </DropdownMenuCheckboxItem>
        )) : (
          <div className="p-2 text-sm text-muted-foreground text-center">No users available</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const DueDateSelector = ({ task, onDueDateChange }: { task: ProjectTask, onDueDateChange: (date: Date | undefined) => void }) => {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    task.due_date ? new Date(task.due_date) : undefined
  );

  useEffect(() => {
    setSelectedDate(task.due_date ? new Date(task.due_date) : undefined);
  }, [task.due_date, open]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
        setSelectedDate(undefined);
        return;
    }
    const newDate = new Date(date);
    // Inherit time from currently selected date or default to 12:00 PM
    if (selectedDate) {
        newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
    } else {
        newDate.setHours(12, 0);
    }
    setSelectedDate(newDate);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedDate) return;
    const [hours, minutes] = e.target.value.split(':').map(Number);
    const newDate = new Date(selectedDate);
    newDate.setHours(hours, minutes);
    setSelectedDate(newDate);
  };

  const handleSave = () => {
    onDueDateChange(selectedDate);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div 
          className={cn(
            "text-xs cursor-pointer hover:bg-muted/50 p-1 rounded-md transition-colors flex items-center gap-1 min-w-[110px]", 
            isOverdue(task.due_date) && !task.completed && "text-destructive font-semibold"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <CalendarIcon className="h-3 w-3 opacity-50" />
          {task.due_date ? format(new Date(task.due_date), "MMM d, p") : <span className="text-muted-foreground italic">Set date</span>}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
        <div className="p-0">
            <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
            />
            <div className="p-3 border-t border-border bg-muted/10">
                <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Time</span>
                    <input
                        type="time"
                        className="flex-1 border rounded-md p-1.5 text-sm bg-background"
                        value={selectedDate ? format(selectedDate, 'HH:mm') : ''}
                        onChange={handleTimeChange}
                        disabled={!selectedDate}
                    />
                </div>
                <div className="flex gap-2">
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        className="flex-1 h-8"
                        onClick={() => {
                            onDueDateChange(undefined);
                            setOpen(false);
                        }}
                    >
                        Clear
                    </Button>
                    <Button 
                        size="sm" 
                        className="flex-1 h-8"
                        onClick={handleSave}
                    >
                        Save
                    </Button>
                </div>
            </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const TaskRow = ({ task, onToggleTaskCompletion, onEdit, onDelete, handleToggleReaction, setRef, isUnread, onClick, allUsers, onStatusChange, onPriorityChange, onAssigneeChange, onDueDateChange }: {
  task: ProjectTask;
  onToggleTaskCompletion: (task: ProjectTask, completed: boolean) => void;
  onEdit: (task: ProjectTask) => void;
  onDelete: (taskId: string) => void;
  handleToggleReaction: (taskId: string, emoji: string) => void;
  setRef: (el: HTMLTableRowElement | null) => void;
  isUnread: boolean;
  onClick: () => void;
  allUsers: User[];
  onStatusChange: (task: ProjectTask, newStatus: TaskStatus) => void;
  onPriorityChange: (task: ProjectTask, newPriority: string) => void;
  onAssigneeChange: (task: ProjectTask, userId: string, assigned: boolean) => void;
  onDueDateChange: (task: ProjectTask, date: Date | undefined) => void;
}) => {
  return (
    <TableRow 
      ref={setRef}
      onClick={onClick}
      className="cursor-pointer"
    >
      <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={task.completed}
          onCheckedChange={(checked) => onToggleTaskCompletion(task, !!checked)}
        />
      </TableCell>
      <TableCell className="max-w-[250px]">
        <div className="flex items-center gap-2">
          {isUnread && <div className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />}
          <div className={cn("break-words min-w-0", isUnread ? "font-semibold" : "font-normal", task.completed && "line-through text-muted-foreground")}>
            <InteractiveText text={task.title} members={allUsers} />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Link to={`/projects/${task.project_slug}`} onClick={(e) => e.stopPropagation()} className="hover:underline text-primary text-xs block whitespace-normal break-words">
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
            {TASK_STATUS_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Select value={task.priority} onValueChange={(newPriority) => onPriorityChange(task, newPriority)}>
          <SelectTrigger className="h-auto p-0 border-0 focus:ring-0 focus:ring-offset-0 w-auto bg-transparent shadow-none">
            <SelectValue>
              <Badge className={cn(getPriorityStyles(task.priority).tw, 'border-transparent font-normal hover:bg-opacity-80 transition-colors')}>
                {task.priority}
              </Badge>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <DueDateSelector task={task} onDueDateChange={(date) => onDueDateChange(task, date)} />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {task.updated_at ? format(new Date(task.updated_at), "MMM d, yyyy, p") : '-'}
      </TableCell>
      <TableCell>
        <AssigneeSelector 
          task={task} 
          allUsers={allUsers} 
          onAssigneeChange={(userId, assigned) => onAssigneeChange(task, userId, assigned)} 
        />
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
  );
};

const TasksTableView = ({ tasks, isLoading, onEdit, onDelete, onToggleTaskCompletion, onStatusChange, isToggling, sortConfig, requestSort, rowRefs, highlightedTaskId, onHighlightComplete, unreadTaskIds }: TasksTableViewProps) => {
  const isMobile = useIsMobile();
  const { onOpen: onOpenTaskDrawer } = useTaskDrawer();
  const queryClient = useQueryClient();
  const { toggleTaskReaction, updateTask } = useTaskMutations(() => queryClient.invalidateQueries({ queryKey: ['tasks'] }));
  const { data: allUsers = [] } = useProfiles();

  const handleTaskClick = async (task: ProjectTask) => {
    try {
      await markTaskAsRead(task.id);
      queryClient.invalidateQueries({ queryKey: ['unreadTaskIds'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      const projectForTask = await getProjectBySlug(task.project_slug);
      if (!projectForTask) {
        throw new Error("Project for this task could not be found.");
      }
      onOpenTaskDrawer(task, projectForTask);
    } catch (error) {
      toast.error("Could not open task details.", { description: (error as Error).message });
    }
  };

  const handlePriorityChange = (task: ProjectTask, newPriority: string) => {
    if (updateTask) {
      const mutate = typeof updateTask === 'function' ? updateTask : (updateTask as any).mutate;
      if (mutate) {
        mutate({ taskId: task.id, updates: { priority: newPriority } });
      }
    }
  };

  const handleDueDateChange = (task: ProjectTask, date: Date | undefined) => {
    if (updateTask) {
      const mutate = typeof updateTask === 'function' ? updateTask : (updateTask as any).mutate;
      if (mutate) {
        mutate({ taskId: task.id, updates: { due_date: date ? date.toISOString() : null } });
      }
    }
  };

  const handleAssigneeChange = async (task: ProjectTask, userId: string, assigned: boolean) => {
    try {
      if (assigned) {
        const { error } = await supabase.from('task_assignees').insert({ task_id: task.id, user_id: userId });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('task_assignees').delete().match({ task_id: task.id, user_id: userId });
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error) {
      console.error('Error updating assignee:', error);
      toast.error('Failed to update assignee');
    }
  };

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
            isToggling={isToggling}
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
            <SortableTableHead columnKey="updated_at" onSort={requestSort} sortConfig={sortConfig}>Last Updated</SortableTableHead>
            <TableHead>Assignees</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={9} className="text-center h-24">Loading...</TableCell></TableRow>
          ) : tasks.length === 0 ? (
            <TableRow><TableCell colSpan={9} className="text-center h-24">No tasks found.</TableCell></TableRow>
          ) : (
            tasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                onToggleTaskCompletion={onToggleTaskCompletion}
                onEdit={onEdit}
                onDelete={onDelete}
                handleToggleReaction={(taskId, emoji) => toggleTaskReaction({ taskId, emoji })}
                setRef={(el) => { if (el) rowRefs.current.set(task.id, el); else rowRefs.current.delete(task.id); }}
                isUnread={unreadTaskIds.includes(task.id)}
                onClick={() => handleTaskClick(task)}
                allUsers={allUsers}
                onStatusChange={onStatusChange}
                onPriorityChange={handlePriorityChange}
                onAssigneeChange={handleAssigneeChange}
                onDueDateChange={handleDueDateChange}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TasksTableView;