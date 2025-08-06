import { Project } from '@/data/projects';
import { useState } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, getDay, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, parseISO, isAfter, startOfDay } from 'date-fns';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface ProjectsYearViewProps {
  projects: Project[];
}

const getStatusColor = (status: Project['status']): string => {
  switch (status) {
    case 'On Track':
    case 'Completed':
    case 'Done':
    case 'Billed':
      return '#22c55e'; // green-500
    case 'At Risk':
    case 'On Hold':
      return '#eab308'; // yellow-500
    case 'Off Track':
    case 'Cancelled':
      return '#ef4444'; // red-500
    case 'In Progress':
    case 'Requested':
      return '#3b82f6'; // blue-500
    default:
      return '#9ca3af'; // gray-400
  }
};

const getPriorityStatusColor = (projects: Project[]): string => {
    const statuses = projects.map(p => p.status);
    if (statuses.includes('Off Track') || statuses.includes('Cancelled')) return getStatusColor('Off Track');
    if (statuses.includes('At Risk') || statuses.includes('On Hold')) return getStatusColor('At Risk');
    if (statuses.includes('In Progress') || statuses.includes('Requested')) return getStatusColor('In Progress');
    if (statuses.includes('On Track') || statuses.includes('Completed') || statuses.includes('Done') || statuses.includes('Billed')) return getStatusColor('On Track');
    return getStatusColor(projects[0]?.status);
};

const MonthCalendarCard = ({ month, year, projects }: { month: number, year: number, projects: Project[] }) => {
    const monthName = new Date(year, month).toLocaleString('id-ID', { month: 'long' });
    const monthStart = startOfMonth(new Date(year, month));
    const monthEnd = endOfMonth(monthStart);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const today = startOfDay(new Date());

    const projectsByDay: Map<string, Project[]> = new Map();
    daysInMonth.forEach(day => {
        const projectsOnDay = projects.filter(p => {
            if (!p.startDate || !p.dueDate) return false;
            const projectStart = parseISO(p.startDate);
            const projectEnd = parseISO(p.dueDate);
            return isWithinInterval(day, { start: projectStart, end: projectEnd });
        });
        if (projectsOnDay.length > 0) {
            projectsByDay.set(format(day, 'yyyy-MM-dd'), projectsOnDay);
        }
    });

    const firstDayOfMonth = getDay(monthStart); // Sunday is 0

    return (
        <div className="p-3 border rounded-lg">
            <h3 className="font-semibold mb-3 text-center">{monthName}</h3>
            <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                {daysInMonth.map(day => {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const projectsOnDay = projectsByDay.get(dayStr);
                    const hasProject = projectsOnDay && projectsOnDay.length > 0;
                    const isFutureDay = isAfter(day, today);

                    const style: React.CSSProperties = {};
                    let classes = "w-full h-3 rounded-sm transition-colors";

                    if (isFutureDay) {
                        style.backgroundColor = 'hsl(var(--muted))';
                        style.opacity = 0.5;
                    } else if (hasProject) {
                        style.backgroundColor = getPriorityStatusColor(projectsOnDay!);
                    } else {
                        style.backgroundColor = 'transparent';
                        style.border = `1px solid hsl(var(--border))`;
                        classes += ' box-border';
                    }

                    return (
                        <TooltipProvider key={dayStr} delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className={classes} style={style} />
                                </TooltipTrigger>
                                <TooltipContent className="p-0" onMouseDown={(e) => e.stopPropagation()}>
                                    <div className="p-2">
                                        <p className="font-semibold">{format(day, 'PPP')}</p>
                                        {hasProject ? (
                                            <ul className="mt-1 space-y-1">
                                                {projectsOnDay!.map((p: any) => (
                                                    <li key={p.id}>
                                                        <Link to={`/projects/${p.id}`} className="block p-2 -m-2 rounded-md hover:bg-accent">
                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: getStatusColor(p.status) }} />
                                                                <span className="text-xs font-medium truncate">{p.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 pl-4">
                                                                {p.owner && (
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger>
                                                                                <Avatar className="h-5 w-5 border">
                                                                                    <AvatarImage src={p.owner.avatar} alt={p.owner.name} />
                                                                                    <AvatarFallback className="text-[8px]">{p.owner.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                                                </Avatar>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent><p>{p.owner.name}</p></TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                )}
                                                                {p.collaborators?.map((c: any) => (
                                                                    <TooltipProvider key={c.id}>
                                                                        <Tooltip>
                                                                            <TooltipTrigger>
                                                                                <Avatar className="h-5 w-5 border">
                                                                                    <AvatarImage src={c.avatar} alt={c.name} />
                                                                                    <AvatarFallback className="text-[8px]">{c.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                                                </Avatar>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent><p>{c.name}</p></TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                ))}
                                                            </div>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">Tidak ada proyek</p>
                                        )}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                })}
            </div>
        </div>
    );
};

const ProjectsYearView = ({ projects }: ProjectsYearViewProps) => {
  const [year, setYear] = useState(new Date().getFullYear());

  const projectsForYear = projects.filter(p => {
    if (!p.startDate || !p.dueDate) return false;
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);
    const projectStart = parseISO(p.startDate);
    const projectEnd = parseISO(p.dueDate);
    return projectStart <= yearEnd && projectEnd >= yearStart;
  });

  return (
    <div>
      <div className="flex items-center justify-center mb-4">
        <Button variant="outline" size="icon" onClick={() => setYear(year - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold mx-4 w-24 text-center">{year}</h2>
        <Button variant="outline" size="icon" onClick={() => setYear(year + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <MonthCalendarCard key={i} year={year} month={i} projects={projectsForYear} />
        ))}
      </div>
    </div>
  );
};

export default ProjectsYearView;