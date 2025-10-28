import React, { useMemo, useState } from 'react';
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
import { MoreHorizontal, Trash2, MapPin, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getProjectStatusStyles, formatInJakarta, generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { isSameDay, subDays, isBefore, startOfToday } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ListViewProps {
  projects: Project[];
  onDeleteProject: (projectId: string) => void;
  onLoadMore: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
}

const ITEMS_PER_PAGE = 5;

const formatProjectDateRange = (startDateStr: string | null | undefined, dueDateStr: string | null | undefined): string => {
  if (!startDateStr) return '-';

  const timeZone = 'Asia/Jakarta';
  const startDate = new Date(startDateStr);
  let dueDate = dueDateStr ? new Date(dueDateStr) : startDate;

  const isExclusiveEndDate = 
    dueDateStr &&
    dueDate.getUTCHours() === 0 &&
    dueDate.getUTCMinutes() === 0 &&
    dueDate.getUTCSeconds() === 0 &&
    dueDate.getUTCMilliseconds() === 0 &&
    !isSameDay(startDate, dueDate);
  
  const zonedStartDate = toZonedTime(startDate, timeZone);
  const zonedDueDateCheck = toZonedTime(dueDate, timeZone);

  if (isExclusiveEndDate && !isSameDay(zonedStartDate, zonedDueDateCheck)) {
    dueDate = subDays(dueDate, 1);
  }

  const finalZonedStartDate = toZonedTime(startDate, timeZone);
  const finalZonedDueDate = toZonedTime(dueDate, timeZone);

  if (isSameDay(finalZonedStartDate, finalZonedDueDate)) {
    return formatInJakarta(startDate, 'd MMM yyyy');
  }

  const startMonth = new Date(finalZonedStartDate).getMonth();
  const endMonth = new Date(finalZonedDueDate).getMonth();
  const startYear = new Date(finalZonedStartDate).getFullYear();
  const endYear = new Date(finalZonedDueDate).getFullYear();

  if (startYear !== endYear) {
    return `${formatInJakarta(startDate, 'd MMM yyyy')} - ${formatInJakarta(dueDate, 'd MMM yyyy')}`;
  }

  if (startMonth !== endMonth) {
    return `${formatInJakarta(startDate, 'd MMM')} - ${formatInJakarta(dueDate, 'd MMM yyyy')}`;
  }

  return `${formatInJakarta(startDate, 'd')} - ${formatInJakarta(dueDate, 'd MMM yyyy')}`;
};

const formatVenue = (venue: string | null): { name: string; full: string } => {
  if (!venue) return { name: "-", full: "-" };

  let fullVenueString = venue;

  try {
    const venueObj = JSON.parse(venue);
    const name = venueObj.name || '';
    const address = venueObj.address || '';
    fullVenueString = [name, address].filter(Boolean).join(' - ');
  } catch (e) {
    // It's already a string, do nothing
  }

  if (!fullVenueString) {
    return { name: "-", full: "-" };
  }

  const separatorIndex = fullVenueString.indexOf(' - ');
  
  let displayName = fullVenueString;
  if (separatorIndex > 0) {
    displayName = fullVenueString.substring(0, separatorIndex).trim();
  }

  return { name: displayName, full: fullVenueString };
};

const DayEntry = ({ dateStr, projectsOnDay, showMonthHeader, onDeleteProject, navigate, isPast }: { dateStr: string, projectsOnDay: Project[], showMonthHeader: boolean, onDeleteProject: (id: string) => void, navigate: (path: string) => void, isPast?: boolean }) => {
  const date = new Date(`${dateStr}T00:00:00`);
  const dayOfWeek = formatInJakarta(date, 'EEE');
  const dayOfMonth = formatInJakarta(date, 'dd');

  return (
    <div key={dateStr}>
      {showMonthHeader && (
        <h2 className="text-lg font-semibold my-4 pl-2">{formatInJakarta(date, 'MMMM yyyy')}</h2>
      )}
      <div className="flex items-start space-x-2 sm:space-x-4">
        <div className="flex flex-col items-center w-10 sm:w-12 text-center flex-shrink-0">
          <span className="text-xs sm:text-sm text-muted-foreground">{dayOfWeek}</span>
          <span className="text-lg sm:text-xl font-bold text-primary">{dayOfMonth}</span>
        </div>
        <div className="flex-1 space-y-3 pt-1 min-w-0">
          {projectsOnDay.map((project: Project) => {
            const { name: venueName, full: fullVenue } = formatVenue(project.venue);
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
                      <span>All-day</span>
                    </div>
                    {project.start_date && project.due_date && !isSameDay(new Date(project.start_date), new Date(project.due_date)) && (
                      <Badge variant="outline" className="mt-1.5 font-normal text-xs">
                        Until {formatInJakarta(subDays(new Date(project.due_date), 1), 'd MMM')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate flex items-center gap-2" title={project.name}>
                      {project.status === 'Completed' && <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />}
                      {project.name}
                    </p>
                    {project.venue && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <MapPin size={12} />
                        <span className="truncate" title={fullVenue}>{venueName}</span>
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

const ListView = ({ projects, onDeleteProject, onLoadMore, hasNextPage, isFetchingNextPage }: ListViewProps) => {
  const navigate = useNavigate();
  const [visibleUpcomingCount, setVisibleUpcomingCount] = useState(ITEMS_PER_PAGE);
  const [visiblePastCount, setVisiblePastCount] = useState(ITEMS_PER_PAGE);

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

  const visibleUpcomingDayEntries = upcomingDayEntries.slice(0, visibleUpcomingCount);
  const hasMoreUpcoming = upcomingDayEntries.length > visibleUpcomingCount;

  const visiblePastDayEntries = pastDayEntries.slice(0, visiblePastCount);
  const hasMorePastLocally = pastDayEntries.length > visiblePastCount;

  const handleLoadMoreUpcoming = () => {
    setVisibleUpcomingCount(prev => prev + ITEMS_PER_PAGE);
  };

  const handleLoadMorePast = () => {
    if (hasMorePastLocally) {
      setVisiblePastCount(prev => prev + ITEMS_PER_PAGE);
    } else if (hasNextPage) {
      onLoadMore();
    }
  };

  let lastUpcomingMonth: string | null = null;
  let lastPastMonth: string | null = null;

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        No projects found for the selected filters.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visibleUpcomingDayEntries.map(([dateStr, projectsOnDay]) => {
        const currentMonth = formatInJakarta(new Date(`${dateStr}T00:00:00`), 'MMMM yyyy');
        const showMonthHeader = currentMonth !== lastUpcomingMonth;
        if (showMonthHeader) lastUpcomingMonth = currentMonth;
        return (
          <DayEntry key={dateStr} dateStr={dateStr} projectsOnDay={projectsOnDay} showMonthHeader={showMonthHeader} onDeleteProject={onDeleteProject} navigate={navigate} />
        );
      })}

      {hasMoreUpcoming && (
        <div className="text-center py-4">
          <Button variant="outline" onClick={handleLoadMoreUpcoming}>
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

      {visiblePastDayEntries.map(([dateStr, projectsOnDay]) => {
        const currentMonth = formatInJakarta(new Date(`${dateStr}T00:00:00`), 'MMMM yyyy');
        const showMonthHeader = currentMonth !== lastPastMonth;
        if (showMonthHeader) lastPastMonth = currentMonth;
        return (
          <DayEntry key={dateStr} dateStr={dateStr} projectsOnDay={projectsOnDay} showMonthHeader={showMonthHeader} onDeleteProject={onDeleteProject} navigate={navigate} isPast />
        );
      })}

      {(hasMorePastLocally || hasNextPage) && (
        <div className="text-center py-4">
          <Button variant="outline" onClick={handleLoadMorePast} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</>
            ) : (
              'Load More Past'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ListView;