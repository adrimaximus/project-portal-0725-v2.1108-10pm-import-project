import { useState, useMemo, useEffect } from "react";
import { Project, ProjectStatusDef } from '@/types';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn, formatInJakarta, generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { isSameDay, isBefore, startOfToday, subDays } from 'date-fns';
import { Progress } from "../ui/progress";
import StatusBadge from "../StatusBadge";
import { useProjectStatuses } from "@/hooks/useProjectStatuses";

const ProjectListItem = ({
  project,
  navigate,
  onDeleteProject,
  statuses
}: {
  project: Project;
  navigate: (path: string) => void;
  onDeleteProject: (id: string) => void;
  statuses: ProjectStatusDef[];
}) => {
  const [currentStatus, setCurrentStatus] = useState(project.status);
  
  const startDate = new Date(project.start_date!);
  const dueDate = project.due_date ? new Date(project.due_date) : null;
  
  let displayDueDate = dueDate;
  if (dueDate) {
    const isExclusiveEndDate = 
      project.due_date &&
      dueDate.getUTCHours() === 0 &&
      dueDate.getUTCMinutes() === 0 &&
      dueDate.getUTCSeconds() === 0 &&
      dueDate.getUTCMilliseconds() === 0 &&
      !isSameDay(startDate, dueDate);
    
    if (isExclusiveEndDate) {
      displayDueDate = subDays(dueDate, 1);
    }
  }

  const isMultiDay = displayDueDate && !isSameDay(startDate, displayDueDate);

  const statusDef = statuses.find(s => s.name === currentStatus);
  const borderColor = statusDef?.color || '#94a3b8';
  
  const hasOpenTasks = project.tasks?.some(t => !t.completed) ?? false;

  return (
    <div 
      className="bg-card border border-l-4 rounded-lg p-2 sm:p-3 flex flex-col hover:shadow-md transition-shadow group relative w-full"
      style={{ borderLeftColor: borderColor }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between w-full">
        <div 
          className="flex-1 flex items-center space-x-2 sm:space-x-3 cursor-pointer min-w-0 w-full"
          onClick={() => navigate(`/projects/${project.slug}`)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <p className="text-sm sm:text-base font-medium break-words leading-tight" title={project.name}>
                {project.name}
              </p>
            </div>
            <div className="flex items-center flex-wrap gap-x-2 text-xs text-muted-foreground mt-1 break-words">
              <span>{project.client_company_name || project.client_name}</span>
              {isMultiDay && displayDueDate && (
                <>
                  <span className="text-muted-foreground/50">•</span>
                  <span>Ends: {formatInJakarta(displayDueDate, 'dd MMM')}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0 pl-0 sm:pl-2 mt-2 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center space-x-2">
            <StatusBadge 
              status={currentStatus as any} 
              projectId={project.id} 
              hasOpenTasks={hasOpenTasks}
              onStatusChange={(value) => setCurrentStatus(value as any)}
            />
            <div className="flex items-center -space-x-2">
              {project.assignedTo.slice(0, 3).map((user) => (
                <Avatar key={user.id} className="h-5 w-5 sm:h-6 w-6 border-2 border-card">
                  <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                  <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
          <div onClick={(e) => e.stopPropagation()} className="sm:relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity h-7 w-7 sm:h-8 sm:w-8 p-0 opacity-100">
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
      <div className="mt-2 w-full">
        <Progress value={project.progress} className="h-1" />
      </div>
    </div>
  );
};

const DayEntry = ({ 
  dateStr, 
  projectsOnDay, 
  showMonthHeader, 
  onDeleteProject, 
  navigate,
  statuses 
}: { 
  dateStr: string, 
  projectsOnDay: Project[], 
  showMonthHeader: boolean, 
  onDeleteProject: (id: string) => void, 
  navigate: (path: string) => void,
  statuses: ProjectStatusDef[]
}) => {
  const date = new Date(`${dateStr}T00:00:00`);
  const currentMonth = formatInJakarta(date, 'MMMM yyyy');
  const dayOfWeek = formatInJakarta(date, 'EEE');
  const dayOfMonth = formatInJakarta(date, 'dd');

  return (
    <div key={dateStr}>
      {showMonthHeader && (
        <h2 className="text-lg font-semibold my-4 pl-2 sticky top-0 bg-background/95 backdrop-blur z-10 py-2 border-b">{currentMonth}</h2>
      )}
      <div className="flex items-start space-x-2 sm:space-x-4">
        <div className="flex flex-col items-center w-8 sm:w-12 text-center flex-shrink-0 pt-1">
          <span className="text-xs sm:text-sm text-muted-foreground">{dayOfWeek}</span>
          <span className="text-base sm:text-xl font-bold text-primary">{dayOfMonth}</span>
        </div>
        <div className="flex-1 space-y-3 min-w-0 w-full">
          {projectsOnDay.map((project: Project) => (
            <ProjectListItem 
              key={project.id} 
              project={project} 
              navigate={navigate} 
              onDeleteProject={onDeleteProject} 
              statuses={statuses}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const ListView = ({ projects, onDeleteProject }: { projects: Project[], onDeleteProject: (projectId: string) => void }) => {
  const navigate = useNavigate();
  // Increased default counts to show more items initially, especially when filtering
  const [visibleUpcomingCount, setVisibleUpcomingCount] = useState(20);
  const [visiblePastCount, setVisiblePastCount] = useState(20);
  
  const { data: statuses = [] } = useProjectStatuses();

  // Reset visible counts when projects change (e.g. filter applied)
  useEffect(() => {
    setVisibleUpcomingCount(20);
    setVisiblePastCount(20);
  }, [projects]);

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

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground px-4">
        <p>No projects found.</p>
        <p className="text-xs">Try adjusting your filters.</p>
      </div>
    );
  }

  // If we only have past entries (common when filtering for past dates), show them more prominently
  const onlyPastProjects = upcomingDayEntries.length === 0 && pastDayEntries.length > 0;

  return (
    <div className="space-y-4 w-full px-4 pb-20">
      {/* Upcoming Section */}
      {upcomingDayEntries.length > 0 && (
        <>
          {upcomingDayEntries.slice(0, visibleUpcomingCount).map(([dateStr, projectsOnDay]) => {
            const currentMonth = formatInJakarta(new Date(`${dateStr}T00:00:00`), 'MMMM yyyy');
            const showMonthHeader = currentMonth !== lastUpcomingMonth;
            if (showMonthHeader) lastUpcomingMonth = currentMonth;
            return <DayEntry key={dateStr} dateStr={dateStr} projectsOnDay={projectsOnDay} showMonthHeader={showMonthHeader} onDeleteProject={onDeleteProject} navigate={navigate} statuses={statuses} />;
          })}

          {upcomingDayEntries.length > visibleUpcomingCount && (
            <div className="text-center mt-6">
              <Button 
                variant="outline" 
                onClick={() => setVisibleUpcomingCount(prev => prev + 20)}
                className="border-primary text-primary hover:bg-primary/10"
              >
                Load More Upcoming
              </Button>
            </div>
          )}
        </>
      )}

      {/* Past Section */}
      {pastDayEntries.length > 0 && (
        <>
          {/* Only show separator if we have upcoming projects too, or if we want to explicitly denote past */}
          {!onlyPastProjects && (
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
            return <DayEntry key={dateStr} dateStr={dateStr} projectsOnDay={projectsOnDay} showMonthHeader={showMonthHeader} onDeleteProject={onDeleteProject} navigate={navigate} statuses={statuses} />;
          })}

          {pastDayEntries.length > visiblePastCount && (
            <div className="text-center mt-6">
              <Button 
                variant="outline" 
                onClick={() => setVisiblePastCount(prev => prev + 20)}
                className="border-primary text-primary hover:bg-primary/10"
              >
                Load More Past
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ListView;