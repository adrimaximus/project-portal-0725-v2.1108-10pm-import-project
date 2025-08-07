import { Project } from '@/data/projects';
import { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  isSameDay,
  differenceInDays,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay
} from 'date-fns';
import { id } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const getProjectColorClasses = (status: Project['status']): string => {
  switch (status) {
    case 'On Track': case 'Completed': case 'Done': case 'Billed': return 'bg-green-100 border-l-green-500 text-green-800 dark:bg-green-900/30 dark:border-l-green-500 dark:text-green-200';
    case 'At Risk': case 'On Hold': return 'bg-yellow-100 border-l-yellow-500 text-yellow-800 dark:bg-yellow-900/30 dark:border-l-yellow-500 dark:text-yellow-200';
    case 'Off Track': case 'Cancelled': return 'bg-red-100 border-l-red-500 text-red-800 dark:bg-red-900/30 dark:border-l-red-500 dark:text-red-200';
    case 'In Progress': case 'Requested': return 'bg-blue-100 border-l-blue-500 text-blue-800 dark:bg-blue-900/30 dark:border-l-blue-500 dark:text-blue-200';
    default: return 'bg-gray-100 border-l-gray-500 text-gray-800 dark:bg-gray-900/30 dark:border-l-gray-500 dark:text-gray-200';
  }
};

interface ProjectsMonthViewProps {
  projects: Project[];
}

const ProjectsMonthView = ({ projects }: ProjectsMonthViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { weeks, weeklyLayouts } = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { locale: id });
    const calendarEnd = endOfWeek(endOfMonth(currentDate), { locale: id });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    const activeProjects = projects
        .filter(p => {
            if (!p.startDate || !p.dueDate) return false;
            const projectStart = startOfDay(parseISO(p.startDate));
            const projectEnd = endOfDay(parseISO(p.dueDate));
            return projectStart <= calendarEnd && projectEnd >= calendarStart;
        })
        .sort((a, b) => {
            const startDiff = new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime();
            if (startDiff !== 0) return startDiff;
            return new Date(b.dueDate!).getTime() - new Date(a.dueDate!).getTime();
        });

    const laneMatrix: (string | null)[][] = Array.from({ length: 10 }, () => Array(days.length).fill(null));

    for (const project of activeProjects) {
        const projectStart = startOfDay(parseISO(project.startDate!));
        const projectEnd = endOfDay(parseISO(project.dueDate!));

        const startIndex = Math.max(0, differenceInDays(projectStart, calendarStart));
        const endIndex = Math.min(days.length - 1, differenceInDays(projectEnd, calendarStart));

        let assignedLane = -1;
        for (let l = 0; l < laneMatrix.length; l++) {
            let isLaneFree = true;
            for (let d = startIndex; d <= endIndex; d++) {
                if (laneMatrix[l][d]) {
                    isLaneFree = false;
                    break;
                }
            }
            if (isLaneFree) {
                assignedLane = l;
                break;
            }
        }

        if (assignedLane !== -1) {
            for (let d = startIndex; d <= endIndex; d++) {
                laneMatrix[assignedLane][d] = project.id;
            }
            (project as any).lane = assignedLane;
        }
    }

    const weeklyLayouts = weeks.map((week, weekIndex) => {
        const layout: { project: Project & { lane: number }; startCol: number; span: number; isStart: boolean; isEnd: boolean }[] = [];
        const processedProjects = new Set<string>();

        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const day = week[dayIndex];
            const globalDayIndex = weekIndex * 7 + dayIndex;

            for (let laneIndex = 0; laneIndex < laneMatrix.length; laneIndex++) {
                const projectId = laneMatrix[laneIndex][globalDayIndex];
                if (projectId && !processedProjects.has(projectId)) {
                    const project = activeProjects.find(p => p.id === projectId)!;
                    processedProjects.add(projectId);

                    const projectStart = startOfDay(parseISO(project.startDate!));
                    const projectEnd = endOfDay(parseISO(project.dueDate!));

                    let span = 1;
                    for (let i = dayIndex + 1; i < 7; i++) {
                        if (laneMatrix[laneIndex][globalDayIndex + (i - dayIndex)] === projectId) {
                            span++;
                        } else {
                            break;
                        }
                    }

                    layout.push({
                        project: project as Project & { lane: number },
                        startCol: dayIndex + 1,
                        span,
                        isStart: isSameDay(projectStart, day) || isBefore(projectStart, week[0]),
                        isEnd: isSameDay(projectEnd, week[dayIndex + span - 1]) || isAfter(projectEnd, week[6])
                    });
                }
            }
        }
        return layout;
    });

    return { weeks, weeklyLayouts };
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

      <div className="grid grid-cols-7 text-center text-sm text-muted-foreground mb-2 px-1 flex-shrink-0">
        {dayHeaders.map(day => <div key={day}>{day}</div>)}
      </div>

      <div className="flex-grow relative grid grid-cols-1 auto-rows-fr border-t border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 relative">
            {week.map((day, dayIndex) => (
              <div key={day.toString()} className={cn("p-1.5 flex flex-col border-r border-gray-200 dark:border-gray-700", dayIndex === 6 && "border-r-0")}>
                <span className={cn(
                  "self-end flex items-center justify-center h-6 w-6 rounded-full text-sm",
                  !isSameMonth(day, currentDate) && "text-muted-foreground/50",
                  isToday(day) && "bg-primary text-primary-foreground"
                )}>
                  {format(day, 'd')}
                </span>
              </div>
            ))}
            <div className="absolute inset-0 pointer-events-none">
              {weeklyLayouts[weekIndex].map(({ project, startCol, span, isStart, isEnd }) => (
                <Link
                  to={`/projects/${project.id}`}
                  key={project.id}
                  className={cn(
                    "absolute flex items-center p-1.5 text-xs border-l-4 pointer-events-auto",
                    getProjectColorClasses(project.status),
                    isStart ? "rounded-l-lg" : "",
                    isEnd ? "rounded-r-lg" : "",
                  )}
                  style={{
                    top: `calc(2.25rem + ${project.lane * 2.75}rem)`,
                    left: `calc(${(startCol - 1) / 7 * 100}% + 2px)`,
                    width: `calc(${span / 7 * 100}% - 4px)`,
                    height: '2.5rem',
                  }}
                >
                  {isStart && (
                    <div className="flex items-center gap-2 truncate">
                      <div className="flex-1 truncate">
                        <p className="font-semibold truncate">{project.name}</p>
                        <div className="flex items-center justify-between">
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
                      </div>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectsMonthView;