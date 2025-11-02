import { useState, useMemo } from "react";
import { Project } from '@/types';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Clock, Trash2, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getProjectStatusStyles, cn, formatInJakarta, generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { format, isSameDay, subDays, isBefore, startOfToday } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DayEntry = ({ dateStr, projectsOnDay, showMonthHeader, onDeleteProject, navigate, isPast }: { dateStr: string, projectsOnDay: Project[], showMonthHeader: boolean, onDeleteProject: (id: string) => void, navigate: (path: string) => void, isPast?: boolean }) => {
  const date = new Date(`${dateStr}T00:00:00`);
  const currentMonth = formatInJakarta(date, 'MMMM yyyy');
  const dayOfWeek = formatInJakarta(date, 'EEE');
  const dayOfMonth = formatInJakarta(date, 'dd');

  const formatVenue = (venue: string | null): string => {
    if (!venue) return "";
    try {
      const venueObj = JSON.parse(venue);
      const name = venueObj.name || '';
      const address = venueObj.address || '';
      const parts = [name, address].filter(Boolean);
      return parts.join(', ');
    } catch (e) {
      return venue;
    }
  };

  return (
    <div key={dateStr}>
      {showMonthHeader && (
        <h2 className="text-lg font-semibold my-4 pl-2">{currentMonth}</h2>
      )}
      <div className="flex items-start space-x-2 sm:space-x-4">
        <div className="flex flex-col items-center w-10 sm:w-12 text-center flex-shrink-0">
          <span className="text-xs sm:text-sm text-muted-foreground">{dayOfWeek}</span>
          <span className="text-lg sm:text-xl font-bold text-primary">{dayOfMonth}</span>
        </div>
        <div className="flex-1 space-y-3 pt-1 min-w-0">
          {projectsOnDay.map((project: Project) => {
            const startDate = project.start_date ? new Date(project.start_date) : null;
            const dueDate = project.due_date ? new Date(project.due_date) : startDate;
            let displayDueDate = dueDate;
            let isMultiDay = false;

            if (startDate && dueDate) {
              const isExclusiveEndDate =
                project.due_date &&
                dueDate.getUTCHours() === 0 &&
                dueDate.getUTCMinutes() === 0 &&
                dueDate.getUTCSeconds() === 0 &&
                dueDate.getUTCMilliseconds() === 0 &&
                !isSameDay(startDate, dueDate);

              const adjustedDueDate = isExclusiveEndDate ? subDays(dueDate, 1) : dueDate;
              
              isMultiDay = !isSameDay(startDate, adjustedDueDate);
              displayDueDate = adjustedDueDate;
            }
            
            const formattedVenue = formatVenue(project.venue);

            return (
              <div 
                key={project.id} 
                className="bg-card border border-l-4 rounded-lg p-2 sm:p-3 flex items-center justify-between hover:shadow-md transition-shadow group"
                style={{ borderLeftColor: getProjectStatusStyles(project.status).hex }}
              >
                <div 
                  className="flex-1 flex items-center space-x-3 cursor-pointer min-w-0"
                  onClick={() => navigate(`/projects/${project.slug}`)}
                >
                  <div className="w-32 text-sm text-muted-foreground hidden md:block">
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>Seharian</span>
                    </div>
                    {isMultiDay && displayDueDate && (
                      <Badge variant="outline" className="mt-1.5 font-normal text-xs">
                        Hingga {formatInJakarta(displayDueDate, 'd MMM')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate flex items-center gap-2" title={project.name}>
                      {project.status === 'Completed' && <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />}
                      {(project.status === 'Cancelled' || project.status === 'Bid Lost') && <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />}
                      {project.name}
                    </p>
                    {project.venue && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <MapPin size={12} />
                        <span className="truncate" title={formattedVenue}>{formattedVenue}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 pl-2">
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive" onSelect={() => onDeleteProject(project.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex flex-shrink-0 -space-x-2">
                    {project.assignedTo.slice(0, 3).map((user) => (
                      <Avatar key={user.id} className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-card">
                        <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} alt={user.name} />
                        <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ListView = ({ projects, onDeleteProject }: { projects: Project[], onDeleteProject: (projectId: string) => void }) => {
  const navigate = useNavigate();
  const [visibleUpcomingCount, setVisibleUpcomingCount] = useState(10);
  const [visiblePastCount, setVisiblePastCount] = useState(5);

  const { upcomingDayEntries, pastDayEntries } = useMemo(() => {
    const today = startOfToday();
    const projectsWithDates = projects.filter(p => p.start_date);

    const upcomingProjects = projectsWithDates
      .filter(p => !isBefore(new Date(p.start_date!), today))
      .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime());

    const pastProjects = projectsWithDates
      .filter(p => isBefore(new Date(p.start_date!), today))
      .sort((a, b) => new Date(b.start_date!).getTime() - new Date(a.start_date!).getTime());

    const groupProjectsByDay = (projectList: Project[]) => {
      const grouped = projectList.reduce((acc, project) => {
        const dateKey = formatInJakarta(project.start_date!, 'yyyy-MM-dd');
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(project);
        return acc;
      }, {} as Record<string, Project[]>);
      return Object.entries(grouped);
    };

    return {
      upcomingDayEntries: groupProjectsByDay(upcomingProjects),
      pastDayEntries: groupProjectsByDay(pastProjects),
    };
  }, [projects]);

  let lastUpcomingMonth: string | null = null;
  let lastPastMonth: string | null = null;

  if (projects.length > 0 && upcomingDayEntries.length === 0 && pastDayEntries.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        Tidak ada proyek yang dijadwalkan.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {upcomingDayEntries.slice(0, visibleUpcomingCount).map(([dateStr, projectsOnDay]) => {
        const currentMonth = formatInJakarta(new Date(`${dateStr}T00:00:00`), 'MMMM yyyy');
        const showMonthHeader = currentMonth !== lastUpcomingMonth;
        if (showMonthHeader) lastUpcomingMonth = currentMonth;
        return <DayEntry key={dateStr} dateStr={dateStr} projectsOnDay={projectsOnDay} showMonthHeader={showMonthHeader} onDeleteProject={onDeleteProject} navigate={navigate} />;
      })}

      {upcomingDayEntries.length > visibleUpcomingCount && (
        <div className="text-center mt-6">
          <Button 
            variant="outline" 
            onClick={() => setVisibleUpcomingCount(upcomingDayEntries.length)}
            className="border-primary text-primary hover:bg-primary/10"
          >
            Load More Upcoming
          </Button>
        </div>
      )}

      {pastDayEntries.length > 0 && (
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-4 text-sm font-medium text-muted-foreground">
              Past Events
            </span>
          </div>
        </div>
      )}

      {pastDayEntries.slice(0, visiblePastCount).map(([dateStr, projectsOnDay]) => {
        const currentMonth = formatInJakarta(new Date(`${dateStr}T00:00:00`), 'MMMM yyyy');
        const showMonthHeader = currentMonth !== lastPastMonth;
        if (showMonthHeader) lastPastMonth = currentMonth;
        return <DayEntry key={dateStr} dateStr={dateStr} projectsOnDay={projectsOnDay} showMonthHeader={showMonthHeader} onDeleteProject={onDeleteProject} navigate={navigate} isPast />;
      })}

      {pastDayEntries.length > visiblePastCount && (
        <div className="text-center mt-6">
          <Button 
            variant="outline" 
            onClick={() => setVisiblePastCount(pastDayEntries.length)}
            className="border-primary text-primary hover:bg-primary/10"
          >
            Load More Past
          </Button>
        </div>
      )}
    </div>
  );
};

export default ListView;