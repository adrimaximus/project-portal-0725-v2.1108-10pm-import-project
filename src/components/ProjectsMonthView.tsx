import { Project } from '@/data/projects';
import { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  format, getDay, startOfMonth, endOfMonth, eachDayOfInterval, 
  parseISO, addMonths, subMonths, isToday, differenceInDays, 
  max, min, startOfWeek, endOfWeek, isSameDay, isBefore, isAfter 
} from 'date-fns';
import { id } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

const getStatusColor = (status: Project['status']): string => {
  switch (status) {
    case 'On Track': case 'Completed': case 'Done': case 'Billed': return '#22c55e';
    case 'At Risk': case 'On Hold': return '#eab308';
    case 'Off Track': case 'Cancelled': return '#ef4444';
    case 'In Progress': case 'Requested': return '#3b82f6';
    default: return '#9ca3af';
  }
};

const ProjectTooltipContent = ({ project }: { project: Project }) => (
  <div className="p-2 max-w-xs">
    <p className="font-bold text-base mb-2 truncate">{project.name}</p>
    <div className="flex items-center gap-2 mb-2">
      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: getStatusColor(project.status) }} />
      <span className="text-sm">{project.status}</span>
    </div>
    {project.paymentStatus && (
      <div className="mb-2">
        <Badge variant="outline">{project.paymentStatus}</Badge>
      </div>
    )}
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Assigned:</span>
      <div className="flex -space-x-2">
        {project.assignedTo.map(user => (
          <Avatar key={user.id} className="h-6 w-6 border-2 border-popover">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="text-[10px]">{user.initials}</AvatarFallback>
          </Avatar>
        ))}
      </div>
    </div>
  </div>
);

interface ProjectsMonthViewProps {
  projects: Project[];
}

const ProjectsMonthView = ({ projects }: ProjectsMonthViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { monthStart, monthEnd, calendarGrid } = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const firstDayOfMonth = getDay(monthStart);
    
    const calendarDays = [
      ...Array(firstDayOfMonth).fill(null),
      ...eachDayOfInterval({ start: monthStart, end: monthEnd })
    ];
    
    const grid: (Date | null)[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      grid.push(calendarDays.slice(i, i + 7));
    }
    // Ensure grid has 6 rows for consistent height
    while (grid.length < 6) {
      grid.push(Array(7).fill(null));
    }

    return { monthStart, monthEnd, calendarGrid: grid };
  }, [currentDate]);

  const eventLayout = useMemo(() => {
    const projectsWithDates = projects.map(p => ({
      project: p,
      startDate: p.startDate ? parseISO(p.startDate) : new Date(),
      dueDate: p.dueDate ? parseISO(p.dueDate) : new Date(),
    }));

    const multiDayEvents = projectsWithDates
      .filter(p => p.project.startDate && p.project.dueDate && !isSameDay(p.startDate, p.dueDate))
      .sort((a, b) => differenceInDays(b.dueDate, b.startDate) - differenceInDays(a.dueDate, a.startDate));

    const singleDayEvents = projectsWithDates
      .filter(p => p.project.startDate && p.project.dueDate && isSameDay(p.startDate, p.dueDate))
      .reduce((acc, p) => {
        const dayStr = format(p.startDate, 'yyyy-MM-dd');
        if (!acc[dayStr]) acc[dayStr] = [];
        acc[dayStr].push(p.project);
        return acc;
      }, {} as Record<string, Project[]>);

    const layout: { project: Project; weekIndex: number; startDay: number; span: number; lane: number }[] = [];
    const lanes: (Date | null)[][] = Array.from({ length: calendarGrid.length }, () => []);

    for (const item of multiDayEvents) {
      const { project, startDate, dueDate } = item;
      const eventStartInView = max([startDate, monthStart]);
      const eventEndInView = min([dueDate, monthEnd]);

      if (isAfter(eventStartInView, eventEndInView)) continue;

      let assignedLane = 0;
      while (true) {
        let isLaneFree = true;
        for (let w = 0; w < calendarGrid.length; w++) {
          const week = calendarGrid[w];
          const weekStart = week[0] ? startOfWeek(week[0], { weekStartsOn: 0 }) : null;
          if (!weekStart) continue;
          
          if (isAfter(eventStartInView, endOfWeek(weekStart, { weekStartsOn: 0 })) || isBefore(eventEndInView, weekStart)) {
            continue;
          }

          if (lanes[w][assignedLane] && isBefore(eventStartInView, lanes[w][assignedLane]!)) {
            isLaneFree = false;
            break;
          }
        }
        if (isLaneFree) break;
        assignedLane++;
      }

      for (let w = 0; w < calendarGrid.length; w++) {
        const week = calendarGrid[w];
        const weekStart = week[0] ? startOfWeek(week[0], { weekStartsOn: 0 }) : null;
        if (!weekStart) continue;

        const segmentStart = max([eventStartInView, weekStart]);
        const segmentEnd = min([eventEndInView, endOfWeek(weekStart, { weekStartsOn: 0 })]);

        if (isAfter(segmentStart, segmentEnd)) continue;

        const startDay = getDay(segmentStart);
        const span = differenceInDays(segmentEnd, segmentStart) + 1;

        layout.push({ project, weekIndex: w, startDay, span, lane: assignedLane });
        lanes[w][assignedLane] = eventEndInView;
      }
    }
    return { layout, singleDayEvents };
  }, [projects, monthStart, monthEnd, calendarGrid]);

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

      <div className="grid grid-cols-7 grid-rows-[repeat(6,minmax(0,1fr))] gap-2 flex-grow relative">
        {calendarGrid.flat().map((day, index) => (
          <div key={day ? day.toString() : `empty-${index}`} className="border rounded-lg p-2 bg-card flex flex-col overflow-hidden">
            {day && (
              <>
                <span className={cn("font-medium text-sm", isToday(day) ? "text-primary" : "text-muted-foreground")}>
                  {format(day, 'd')}
                </span>
                <div className="mt-8 space-y-1">
                  {(eventLayout.singleDayEvents[format(day, 'yyyy-MM-dd')] || []).map(p => (
                     <TooltipProvider key={p.id} delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link to={`/projects/${p.id}`} className="block -m-1 p-1 rounded-md hover:bg-accent">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: getStatusColor(p.status) }} />
                                <p className="text-xs font-medium truncate">{p.name}</p>
                              </div>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <ProjectTooltipContent project={p} />
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
        
        {eventLayout.layout.map(({ project, weekIndex, startDay, span, lane }) => {
          const topOffset = 1.75;
          const eventHeight = 1.5;
          const eventGap = 0.125;
          
          return (
            <div
              key={`${project.id}-${weekIndex}`}
              className="absolute z-10"
              style={{
                gridRowStart: weekIndex + 1,
                gridColumnStart: startDay + 1,
                gridColumnEnd: `span ${span}`,
                top: `calc(${topOffset}rem + ${lane * (eventHeight + eventGap)}rem)`,
                height: `${eventHeight}rem`,
              }}
            >
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link 
                      to={`/projects/${project.id}`} 
                      className="block w-full h-full rounded-md px-2 text-white text-xs font-medium truncate leading-tight py-0.5"
                      style={{ backgroundColor: getStatusColor(project.status) }}
                    >
                      {getDay(max([parseISO(project.startDate!), monthStart])) === startDay && (
                        <span>{project.name}</span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <ProjectTooltipContent project={project} />
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectsMonthView;