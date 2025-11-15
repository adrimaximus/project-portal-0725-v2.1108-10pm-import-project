import { useState, useMemo } from "react";
import { Project } from '@/types';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getProjectStatusStyles, cn, formatInJakarta, generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { isSameDay, isBefore, startOfToday, differenceInDays } from 'date-fns';
import { Progress } from "../ui/progress";
import StatusBadge from "../StatusBadge";

const DayEntry = ({ dateStr, projectsOnDay, showMonthHeader, onDeleteProject, navigate }: { dateStr: string, projectsOnDay: Project[], showMonthHeader: boolean, onDeleteProject: (id: string) => void, navigate: (path: string) => void }) => {
  const date = new Date(`${dateStr}T00:00:00`);
  const currentMonth = formatInJakarta(date, 'MMMM yyyy');
  const dayOfWeek = formatInJakarta(date, 'EEE');
  const dayOfMonth = formatInJakarta(date, 'dd');

  return (
    <div key={dateStr}>
      {showMonthHeader && (
        <h2 className="text-lg font-semibold my-4 pl-2">{currentMonth}</h2>
      )}
      <div className="flex items-start space-x-2 sm:space-x-4">
        <div className="flex flex-col items-center w-8 sm:w-12 text-center flex-shrink-0">
          <span className="text-xs sm:text-sm text-muted-foreground">{dayOfWeek}</span>
          <span className="text-base sm:text-xl font-bold text-primary">{dayOfMonth}</span>
        </div>
        <div className="flex-1 space-y-3 pt-1 min-w-0">
          {projectsOnDay.map((project: Project) => {
            const startDate = new Date(project.start_date!);
            const dueDate = project.due_date ? new Date(project.due_date) : null;
            
            // Check if the project spans more than one day
            const isMultiDay = dueDate && differenceInDays(dueDate, startDate) > 0;

            return (
              <div 
                key={project.id} 
                className="bg-card border border-l-4 rounded-lg p-2 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:shadow-md transition-shadow group"
                style={{ borderLeftColor: getProjectStatusStyles(project.status).hex }}
              >
                <div 
                  className="flex-1 flex items-center space-x-2 sm:space-x-3 cursor-pointer min-w-0"
                  onClick={() => navigate(`/projects/${project.slug}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm sm:text-base font-medium break-words" title={project.name}>
                        {project.name}
                      </p>
                      {isMultiDay && dueDate && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          Ends: {formatInJakarta(dueDate, 'dd MMM')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 break-words">
                      {project.client_company_name || project.client_name}
                    </div>
                    <div className="mt-2">
                      <Progress value={project.progress} className="h-1" />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0 pl-0 sm:pl-2 mt-2 sm:mt-0 w-full sm:w-auto justify-between">
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={project.status as any} />
                    <div className="flex items-center -space-x-2">
                      {project.assignedTo.slice(0, 3).map((user) => (
                        <Avatar key={user.id} className="h-5 w-5 sm:h-6 sm:w-6 border-2 border-card">
                          <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                          <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 sm:h-8 sm:w-8 p-0">
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
    <div className="space-y-4 pr-[10px]">
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
        return <DayEntry key={dateStr} dateStr={dateStr} projectsOnDay={projectsOnDay} showMonthHeader={showMonthHeader} onDeleteProject={onDeleteProject} navigate={navigate} />;
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