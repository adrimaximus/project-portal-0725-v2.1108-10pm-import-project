import { Project } from '@/data/projects';
import { useState } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, getDay, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, parseISO, addMonths, subMonths, isToday } from 'date-fns';
import { id } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const getStatusColor = (status: Project['status']): string => {
  switch (status) {
    case 'On Track': case 'Completed': case 'Done': case 'Billed': return '#22c55e';
    case 'At Risk': case 'On Hold': return '#eab308';
    case 'Off Track': case 'Cancelled': return '#ef4444';
    case 'In Progress': case 'Requested': return '#3b82f6';
    default: return '#9ca3af';
  }
};

const DayCell = ({ day, projectsOnDay }: { day: Date, projectsOnDay?: Project[] }) => {
  const hasProjects = projectsOnDay && projectsOnDay.length > 0;

  const cellContent = (
    <div className="border rounded-lg p-2 h-28 flex flex-col bg-card hover:border-primary/50 transition-colors group">
      <span className={cn(
        "font-medium text-sm mb-1",
        isToday(day) ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground"
      )}>
        {format(day, 'd')}
      </span>
      {hasProjects && (
        <div className="flex-grow flex flex-col justify-start gap-1 overflow-hidden">
          {projectsOnDay.slice(0, 4).map((p: any) => (
            <TooltipProvider key={p.id} delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to={`/projects/${p.id}`} className="block">
                    <div 
                      className="h-2 w-full rounded-full" 
                      style={{ backgroundColor: getStatusColor(p.status) }}
                    />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" align="start">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{p.status}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {projectsOnDay.length > 4 && (
             <p className="text-xs text-center text-muted-foreground mt-1">
                +{projectsOnDay.length - 4} lainnya
             </p>
          )}
        </div>
      )}
    </div>
  );

  if (!hasProjects) {
    return (
        <div className="border rounded-lg p-2 h-28 flex flex-col bg-card">
            <span className={cn("font-medium text-sm", isToday(day) ? "text-primary" : "text-muted-foreground")}>
                {format(day, 'd')}
            </span>
        </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
            {cellContent}
        </TooltipTrigger>
        <TooltipContent className="p-0" onMouseDown={(e) => e.stopPropagation()}>
          <div className="p-2">
            <p className="font-semibold">{format(day, 'PPP', { locale: id })}</p>
            <ul className="mt-1 space-y-1 max-w-xs">
              {projectsOnDay.map((p: any) => (
                <li key={p.id}>
                  <Link to={`/projects/${p.id}`} className="block p-2 -m-2 rounded-md hover:bg-accent">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: getStatusColor(p.status) }} />
                      <span className="text-xs font-medium">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-1 pl-4">
                      {p.assignedTo?.slice(0, 5).map((user: any) => (
                        <TooltipProvider key={user.id}>
                          <Tooltip>
                            <TooltipTrigger>
                              <Avatar className="h-5 w-5 border">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback className="text-[8px]">{user.initials}</AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent><p>{user.name}</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface ProjectsMonthViewProps {
  projects: Project[];
}

const ProjectsMonthView = ({ projects }: ProjectsMonthViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const projectsByDay: Map<string, Project[]> = new Map();
  daysInMonth.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const projectsOnDay = projects.filter(p => {
          if (!p.startDate || !p.dueDate) return false;
          const projectStart = parseISO(p.startDate);
          const projectEnd = parseISO(p.dueDate);
          return isWithinInterval(day, { start: projectStart, end: projectEnd });
      });
      if (projectsOnDay.length > 0) {
          projectsByDay.set(dayStr, projectsOnDay);
      }
  });

  const firstDayOfMonth = getDay(monthStart);
  const dayHeaders = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  return (
    <div className="flex flex-col h-[85vh]">
      <div className="flex items-center justify-between mb-4 px-1 flex-shrink-0">
        <h2 className="text-xl font-semibold capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: id })}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-sm text-muted-foreground mb-2 px-1 flex-shrink-0">
        {dayHeaders.map(day => <div key={day}>{day}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-2 flex-grow overflow-y-auto">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
        {daysInMonth.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const projectsOnDay = projectsByDay.get(dayStr);
          return <DayCell key={dayStr} day={day} projectsOnDay={projectsOnDay} />;
        })}
      </div>
    </div>
  );
};

export default ProjectsMonthView;