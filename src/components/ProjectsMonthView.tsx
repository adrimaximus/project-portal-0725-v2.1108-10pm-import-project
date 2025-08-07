import { Project } from '@/data/projects';
import { useState } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  const isSingleProject = hasProjects && projectsOnDay.length === 1;
  const singleProject = isSingleProject ? projectsOnDay[0] : null;

  if (!hasProjects) {
    return (
      <div className="border rounded-lg p-2 min-h-[7rem] flex flex-col bg-card">
        <span className={cn("font-medium text-sm", isToday(day) ? "text-primary" : "text-muted-foreground")}>
          {format(day, 'd')}
        </span>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-2 min-h-[7rem] flex flex-col bg-card hover:border-primary/50 transition-colors group">
      <span className={cn(
        "font-medium text-sm mb-1",
        isToday(day) ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground"
      )}>
        {format(day, 'd')}
      </span>

      <div className="flex-grow flex flex-col justify-start gap-1.5 overflow-hidden mt-1">
        {isSingleProject && singleProject ? (
          <Link to={`/projects/${singleProject.id}`} className="block p-1 -m-1 rounded-md hover:bg-accent">
            <div className="flex items-center gap-2">
              <div 
                className="h-2 w-2 rounded-full flex-shrink-0" 
                style={{ backgroundColor: getStatusColor(singleProject.status) }}
              />
              <p className="text-xs font-medium truncate">{singleProject.name}</p>
            </div>
            <div className="flex -space-x-1 mt-1.5 pl-4">
              {singleProject.assignedTo?.slice(0, 3).map((user: any) => (
                <Avatar key={user.id} className="h-5 w-5 border-2 border-card">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-[8px]">{user.initials}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </Link>
        ) : (
          <>
            {projectsOnDay.slice(0, 2).map((p: any) => (
              <TooltipProvider key={p.id} delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to={`/projects/${p.id}`} className="block p-1 -m-1 rounded-md hover:bg-accent">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-2 w-2 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: getStatusColor(p.status) }}
                        />
                        <p className="text-xs font-medium truncate">{p.name}</p>
                      </div>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start">
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.status}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            {projectsOnDay.length > 2 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-auto p-1 text-xs justify-start text-muted-foreground hover:text-foreground">
                    +{projectsOnDay.length - 2} lainnya
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-2 w-64 z-10">
                  <p className="font-semibold text-sm mb-2 px-2">{format(day, 'PPP', { locale: id })}</p>
                  <ul className="space-y-1 max-h-60 overflow-y-auto">
                    {projectsOnDay.map((p: any) => (
                      <li key={p.id}>
                        <Link to={`/projects/${p.id}`} className="block p-2 rounded-md hover:bg-accent">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: getStatusColor(p.status) }} />
                            <span className="text-xs font-medium truncate">{p.name}</span>
                          </div>
                          <div className="flex items-center gap-1 pl-4">
                            {p.assignedTo?.slice(0, 5).map((user: any) => (
                              <Avatar key={user.id} className="h-5 w-5 border">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback className="text-[8px]">{user.initials}</AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>
            )}
          </>
        )}
      </div>
    </div>
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