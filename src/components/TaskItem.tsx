import { Task, User } from '@/types';
import { useTaskDrawer } from '@/contexts/TaskDrawerContext';
import { getProjectBySlug } from '@/lib/projectsApi';
import { toast } from 'sonner';
import { cn, getAvatarUrl, generatePastelColor, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import InteractiveText from './InteractiveText';

interface TaskItemProps {
  task: Task;
  onToggle?: (task: Task, completed: boolean) => void;
  isToggling?: boolean;
  allUsers: User[];
  hideProjectName?: boolean;
  showAssignees?: boolean;
}

const TaskItem = ({ 
  task, 
  onToggle, 
  isToggling, 
  allUsers, 
  hideProjectName = false,
  showAssignees = true 
}: TaskItemProps) => {
  const { onOpen: onOpenTaskDrawer } = useTaskDrawer();

  const handleTaskClick = async (e: React.MouseEvent) => {
    // Prevent opening drawer if clicking on checkbox or other interactive elements
    if ((e.target as HTMLElement).closest('.task-checkbox')) {
      return;
    }

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

  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate) && !task.completed;
  
  return (
    <div 
      onClick={handleTaskClick}
      className="group flex flex-col gap-2 p-3 rounded-xl hover:bg-accent/40 border border-transparent hover:border-border transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3">
         <div 
           className={cn(
             "mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ring-2 ring-offset-1 ring-offset-background transition-colors",
             task.completed ? "bg-muted-foreground ring-muted" : 
             task.priority === 'Urgent' ? "bg-red-500 ring-red-200 dark:ring-red-900" :
             task.priority === 'High' ? "bg-orange-500 ring-orange-200 dark:ring-orange-900" :
             "bg-blue-500 ring-blue-200 dark:ring-blue-900"
           )}
         />
         <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-2">
                <div className={cn("font-medium text-sm leading-tight break-words flex items-center gap-2", task.completed && "line-through text-muted-foreground")}>
                  <span className="truncate"><InteractiveText text={task.title} members={allUsers} /></span>
                </div>
                {dueDate && (
                    <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap", 
                        isOverdue ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : 
                        isToday(dueDate) ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
                        "bg-secondary text-muted-foreground"
                    )}>
                        {isToday(dueDate) ? 'Today' : isTomorrow(dueDate) ? 'Tomorrow' : format(dueDate, 'MMM d')}
                    </span>
                )}
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {!hideProjectName && <span className="truncate max-w-[120px]">{task.project_name}</span>}
              {showAssignees && (
                <div className="flex -space-x-2 flex-shrink-0 ml-auto">
                    {task.assignedTo?.slice(0, 3).map(user => (
                        <Avatar key={user.id} className="h-5 w-5 border-2 border-background ring-1 ring-border">
                        <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                        <AvatarFallback className="text-[8px]" style={generatePastelColor(user.id)}>
                            {getInitials([user.first_name, user.last_name].filter(Boolean).join(' '), user.email || undefined)}
                        </AvatarFallback>
                        </Avatar>
                    ))}
                </div>
              )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default TaskItem;