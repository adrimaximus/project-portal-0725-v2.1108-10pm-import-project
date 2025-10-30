import React, { useState } from 'react';
import { Task } from '@/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Briefcase, Calendar, Tag, User as UserIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Link } from 'react-router-dom';
import { cn, getTaskStatusStyles, getPriorityStyles, getAvatarUrl, generatePastelColor, getInitials } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TaskDetailsSectionProps {
  task: Task;
  onClose: () => void;
}

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

const TaskDetailsSection: React.FC<TaskDetailsSectionProps> = ({ task, onClose }) => {
  const [isOpen, setIsOpen] = useState(true);
  const statusStyle = getTaskStatusStyles(task.status);
  const priorityStyle = getPriorityStyles(task.priority);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border-b"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-left text-xs sm:text-sm">
        <h4 className="font-semibold">Details</h4>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-3 sm:pb-4 pt-2 space-y-3 sm:space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <TooltipProvider><Tooltip><TooltipTrigger><Briefcase className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Project</p></TooltipContent></Tooltip></TooltipProvider>
            {task.project_name && task.project_name !== 'General Tasks' ? (
              <Link to={`/projects/${task.project_slug}`} className="hover:underline text-primary break-words" onClick={onClose}>
                {task.project_name}
              </Link>
            ) : <span className="text-muted-foreground">General Tasks</span>}
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider><Tooltip><TooltipTrigger><Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Due Date</p></TooltipContent></Tooltip></TooltipProvider>
            {task.due_date ? (
              <span className={cn(getDueDateClassName(task.due_date, task.completed))}>
                {format(new Date(task.due_date), "MMM d, yyyy, p")}
              </span>
            ) : <span className="text-muted-foreground">No due date</span>}
          </div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Status</h4>
            <Badge className={cn(statusStyle.tw, 'border-transparent text-xs')}>{task.status}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Priority</h4>
            <Badge className={cn(priorityStyle.tw, 'text-xs')}>{task.priority || 'Low'}</Badge>
          </div>
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="flex items-start gap-2">
            <TooltipProvider><Tooltip><TooltipTrigger><Tag className="h-3 w-3 sm:h-4 sm:w-4 mt-1 text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Tags</p></TooltipContent></Tooltip></TooltipProvider>
            <div className="flex gap-1 flex-wrap">
              {task.tags.map(tag => (
                <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }} className="text-xs">{tag.name}</Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            {task.created_by && (
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">Created By</h4>
                <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                  <AvatarImage src={getAvatarUrl(task.created_by.avatar_url, task.created_by.id)} />
                  <AvatarFallback style={generatePastelColor(task.created_by.id)}>
                    {getInitials([task.created_by.first_name, task.created_by.last_name].filter(Boolean).join(' '), task.created_by.email || undefined)}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
          <div>
            {task.assignedTo && task.assignedTo.length > 0 && (
              <div className="flex items-center gap-2">
                <h4 className="font-semibold flex items-center gap-2 flex-shrink-0"><UserIcon className="h-3 w-3 sm:h-4 sm:w-4" /> Assignees</h4>
                <div className="flex -space-x-2">
                  {task.assignedTo.map((user) => (
                    <TooltipProvider key={user.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link to="/chat" state={{ selectedCollaborator: user }}>
                            <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-background">
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
              </div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default TaskDetailsSection;