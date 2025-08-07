import { Project } from '@/data/projects';
import { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  parseISO, 
  addMonths, 
  subMonths, 
  isToday,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isWithinInterval,
  startOfDay,
  endOfDay
} from 'date-fns';
import { id } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const getProjectColorClasses = (status: Project['status']): string => {
  switch (status) {
    case 'On Track': case 'Completed': case 'Done': case 'Billed': return 'bg-green-50 border-l-green-500 text-green-800 dark:bg-green-900/20 dark:border-l-green-500 dark:text-green-300';
    case 'At Risk': case 'On Hold': return 'bg-yellow-50 border-l-yellow-500 text-yellow-800 dark:bg-yellow-900/20 dark:border-l-yellow-500 dark:text-yellow-300';
    case 'Off Track': case 'Cancelled': return 'bg-red-50 border-l-red-500 text-red-800 dark:bg-red-900/20 dark:border-l-red-500 dark:text-red-300';
    case 'In Progress': case 'Requested': return 'bg-blue-50 border-l-blue-500 text-blue-800 dark:bg-blue-900/20 dark:border-l-blue-500 dark:text-blue-300';
    default: return 'bg-gray-50 border-l-gray-500 text-gray-800 dark:bg-gray-900/20 dark:border-l-gray-500 dark:text-gray-300';
  }
};

interface ProjectsMonthViewProps {
  projects: Project[];
}

const ProjectsMonthView = ({ projects }: ProjectsMonthViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const VISIBLE_PROJECTS_LIMIT = 2;

  const { days, projectsByDay } = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { locale: id });
    const calendarEnd = endOfWeek(endOfMonth(currentDate), { locale: id });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const projectsByDay = new Map<string, Project[]>();

    days.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const activeProjects = projects.filter(p => {
        if (!p.startDate || !p.dueDate) return false;
        const projectStart = startOfDay(parseISO(p.startDate));
        const projectEnd = endOfDay(parseISO(p.dueDate));
        return isWithinInterval(day, { start: projectStart, end: projectEnd });
      });
      projectsByDay.set(dayKey, activeProjects);
    });

    return { days, projectsByDay };
  }, [projects, currentDate]);

  const dayHeaders = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  return (
    <div className="flex flex-col h-[85vh]">
      <div className="flex items-center justify-between mb-4 px-1 flex-shrink-0">
        <h2 className="text-xl font-semibold capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: id })}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Hari Ini</Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-x-2 text-center text-sm text-muted-foreground mb-2 px-1 flex-shrink-0">
        {dayHeaders.map(day => <div key={day}>{day}</div>)}
      </div>

      <div className="grid grid-cols-7 grid-rows-5 flex-grow border-t border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
        {days.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const projectsOnDay = projectsByDay.get(dayKey) || [];
          const visibleProjects = projectsOnDay.slice(0, VISIBLE_PROJECTS_LIMIT);
          const hiddenProjectsCount = projectsOnDay.length - VISIBLE_PROJECTS_LIMIT;

          return (
            <div 
              key={day.toString()} 
              className="border-r border-b border-gray-200 dark:border-gray-700 p-1.5 flex flex-col min-h-[120px]"
            >
              <span className={cn(
                "self-end flex items-center justify-center h-6 w-6 rounded-full text-sm",
                !isSameMonth(day, currentDate) && "text-muted-foreground/50",
                isToday(day) && "bg-primary text-primary-foreground"
              )}>
                {format(day, 'd')}
              </span>
              <div className="flex-grow space-y-1 mt-1">
                {visibleProjects.map(project => (
                  <Link to={`/projects/${project.id}`} key={project.id} className={cn(
                    "block p-1.5 rounded-md border-l-4 text-xs",
                    getProjectColorClasses(project.status)
                  )}>
                    <p className="font-semibold truncate">{project.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-muted-foreground">Seharian</span>
                      <div className="flex -space-x-2">
                        {project.assignedTo.slice(0, 2).map(user => (
                          <Avatar key={user.id} className="h-4 w-4 border border-background">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="text-[8px]">{user.initials}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
                {hiddenProjectsCount > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" className="h-auto w-full justify-start p-1.5 text-xs text-primary">
                        + {hiddenProjectsCount} lainnya
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 z-50">
                      <div className="font-semibold text-sm mb-2 px-1">
                        Proyek pada {format(day, 'd MMM', { locale: id })}
                      </div>
                      <ul className="space-y-1">
                        {projectsOnDay.map(p => (
                          <li key={p.id}>
                            <Link to={`/projects/${p.id}`} className={cn("block hover:bg-accent p-2 rounded-md border-l-4", getProjectColorClasses(p.status))}>
                              <span className="text-sm font-medium truncate">{p.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectsMonthView;