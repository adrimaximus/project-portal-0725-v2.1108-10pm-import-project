import { Project } from '@/data/projects';
import { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, 
  getDay, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  parseISO, 
  addMonths, 
  subMonths, 
  isToday,
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
  isSameDay,
  differenceInDays,
  max,
  min,
  isSameMonth
} from 'date-fns';
import { id } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const getProjectColor = (status: Project['status']): string => {
  switch (status) {
    case 'On Track': case 'Completed': case 'Done': case 'Billed': return 'bg-green-200/80 text-green-900 border border-green-300/80';
    case 'At Risk': case 'On Hold': return 'bg-yellow-200/80 text-yellow-900 border border-yellow-300/80';
    case 'Off Track': case 'Cancelled': return 'bg-red-200/80 text-red-900 border border-red-300/80';
    case 'In Progress': case 'Requested': return 'bg-blue-200/80 text-blue-900 border border-blue-300/80';
    default: return 'bg-gray-200/80 text-gray-900 border border-gray-300/80';
  }
};

interface ProjectsMonthViewProps {
  projects: Project[];
}

const ProjectsMonthView = ({ projects }: ProjectsMonthViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const projectLayouts = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { locale: id });
    
    const layouts: any[] = [];
    const weekLanes: boolean[][][] = Array(weeks.length).fill(0).map(() => []);

    const sortedProjects = [...projects]
      .filter(p => p.startDate && p.dueDate)
      .sort((a, b) => {
        const durationA = differenceInDays(parseISO(a.dueDate!), parseISO(a.startDate!));
        const durationB = differenceInDays(parseISO(b.dueDate!), parseISO(b.startDate!));
        if (durationA !== durationB) {
          return durationB - durationA; // Longer projects first
        }
        return new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime();
      });

    sortedProjects.forEach(project => {
      const projectStart = parseISO(project.startDate!);
      const projectEnd = parseISO(project.dueDate!);

      weeks.forEach((weekStart, weekIndex) => {
        const weekEnd = endOfWeek(weekStart, { locale: id });

        const segmentStart = max([projectStart, weekStart]);
        const segmentEnd = min([projectEnd, weekEnd]);

        if (segmentStart > segmentEnd) return;

        const startDayIndex = getDay(segmentStart); // Sunday is 0
        const endDayIndex = getDay(segmentEnd);

        let laneIndex = 0;
        let placed = false;
        while (!placed) {
          if (!weekLanes[weekIndex]) {
            weekLanes[weekIndex] = [];
          }
          if (!weekLanes[weekIndex][laneIndex]) {
            weekLanes[weekIndex][laneIndex] = Array(7).fill(false);
          }
          
          let laneIsFree = true;
          for (let i = startDayIndex; i <= endDayIndex; i++) {
            if (weekLanes[weekIndex][laneIndex][i]) {
              laneIsFree = false;
              break;
            }
          }

          if (laneIsFree) {
            for (let i = startDayIndex; i <= endDayIndex; i++) {
              weekLanes[weekIndex][laneIndex][i] = true;
            }
            
            layouts.push({
              project,
              weekIndex,
              laneIndex,
              startDay: startDayIndex,
              duration: differenceInDays(segmentEnd, segmentStart) + 1,
              isStart: isSameDay(projectStart, segmentStart),
              isEnd: isSameDay(projectEnd, segmentEnd),
            });
            placed = true;
          } else {
            laneIndex++;
          }
        }
      });
    });
    return layouts;
  }, [projects, currentDate]);

  const monthStart = startOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: id });
  const calendarEnd = endOfWeek(endOfMonth(currentDate), { locale: id });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weeks = eachWeekOfInterval({ start: monthStart, end: endOfMonth(currentDate) }, { locale: id });
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

      <div className="grid grid-cols-7 gap-2 text-center text-sm text-muted-foreground mb-2 px-1 flex-shrink-0">
        {dayHeaders.map(day => <div key={day}>{day}</div>)}
      </div>

      <div className="grid grid-cols-7 flex-grow border-t border-l border-gray-200 dark:border-gray-700 relative">
        {/* Background cells */}
        {days.map((day) => (
          <div 
            key={day.toString()} 
            className="border-r border-b border-gray-200 dark:border-gray-700 p-1.5 relative"
          >
            <span className={cn(
              "float-right flex items-center justify-center h-6 w-6 rounded-full text-sm",
              !isSameMonth(day, currentDate) && "text-muted-foreground/50",
              isToday(day) && "bg-primary text-primary-foreground"
            )}>
              {format(day, 'd')}
            </span>
          </div>
        ))}

        {/* Project bars */}
        {projectLayouts.map(({ project, weekIndex, laneIndex, startDay, duration, isStart, isEnd }) => {
          const barHeight = 28; // in pixels
          const barGap = 4; // in pixels
          const topOffset = 38; // offset for day number and padding
          
          return (
            <div
              key={`${project.id}-${weekIndex}`}
              className={cn(
                "absolute p-1 text-xs overflow-hidden flex items-center hover:opacity-80 transition-opacity",
                getProjectColor(project.status),
                isStart ? 'rounded-l-md' : '',
                isEnd ? 'rounded-r-md' : '',
                !isStart && !isEnd ? 'rounded-none' : '',
                isStart && isEnd ? 'rounded-md' : ''
              )}
              style={{
                top: `${(weekIndex * (100 / weeks.length))}%`,
                left: `calc(${(startDay / 7) * 100}% + 2px)`,
                width: `calc(${(duration / 7) * 100}% - 4px)`,
                height: `${barHeight}px`,
                transform: `translateY(${topOffset + (laneIndex * (barHeight + barGap))}px)`,
              }}
            >
              <Link to={`/projects/${project.id}`} className="block w-full h-full font-semibold truncate" title={project.name}>
                {project.name}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectsMonthView;