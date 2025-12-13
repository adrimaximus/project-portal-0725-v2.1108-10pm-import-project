import React, { useMemo, useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Project, ProjectStatus, ProjectStatusDef, PaymentStatus } from '@/types';
import { Link } from "react-router-dom";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import StatusBadge from "../StatusBadge";
import { getProjectStatusStyles, cn, formatInJakarta, getPaymentStatusStyles } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { getMonth, getYear, isSameDay, subDays, isBefore, startOfToday } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProjectStatuses } from "@/hooks/useProjectStatuses";
import PaymentStatusBadge from "../PaymentStatusBadge";

interface TableViewProps {
  projects: Project[];
  isLoading: boolean;
  onDeleteProject: (projectId: string) => void;
  sortConfig: { key: keyof Project | null; direction: 'asc' | 'desc' };
  requestSort: (key: keyof Project) => void;
  rowRefs: React.MutableRefObject<Map<string, HTMLTableRowElement>>;
  onStatusChange: (projectId: string, newStatus: ProjectStatus) => void;
  onPaymentStatusChange: (projectId: string, newStatus: PaymentStatus) => void;
}

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

  const startMonth = getMonth(finalZonedStartDate);
  const endMonth = getMonth(finalZonedDueDate);
  const startYear = getYear(finalZonedStartDate);
  const endYear = getYear(finalZonedDueDate);

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

  // Try to parse as JSON to get a clean full string representation
  try {
    const parsed = JSON.parse(venue);
    if (parsed.name && parsed.address) {
      fullVenueString = `${parsed.name} - ${parsed.address}`;
    }
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

interface ProjectRowProps {
  project: Project;
  onDeleteProject: (projectId: string) => void;
  rowRefs: React.MutableRefObject<Map<string, HTMLTableRowElement>>;
  onStatusChange: (projectId: string, newStatus: ProjectStatus) => void;
  onPaymentStatusChange: (projectId: string, newStatus: PaymentStatus) => void;
  statuses: ProjectStatusDef[];
}

const ProjectRow = ({ 
  project, 
  onDeleteProject, 
  rowRefs, 
  onStatusChange, 
  onPaymentStatusChange,
  statuses 
}: ProjectRowProps) => {
  const [currentStatus, setCurrentStatus] = useState<ProjectStatus>(project.status);

  // Sync local state if prop changes (e.g. from refresh)
  useEffect(() => {
    setCurrentStatus(project.status);
  }, [project.status]);

  const { name: venueName, full: fullVenue } = formatVenue(project.venue);
  const hasOpenTasks = useMemo(() => project.tasks?.some(task => !task.completed) ?? false, [project.tasks]);

  const displayVenueName = venueName.length > 20 ? venueName.substring(0, 20) + '....' : venueName;

  let displayStatus = currentStatus;
  
  // Logic to check if it should be "Billing Process" automatically based on date
  if (!displayStatus) {
    const now = new Date();
    const dueDate = project.due_date ? new Date(project.due_date) : null;
    if (dueDate && isBefore(dueDate, now)) {
      // TypeScript might complain here if "Billing Process" isn't in ProjectStatus
      // Casting for now as it seems to be a dynamic status in logic
      displayStatus = "Billing Process" as ProjectStatus;
    } else {
      displayStatus = "On Track";
    }
  }

  // Determine border color based on dynamic status definition
  const statusDef = statuses.find(s => s.name === displayStatus);
  const borderColor = statusDef?.color || getProjectStatusStyles(displayStatus).hex;

  const handleLocalStatusChange = (newStatus: string) => {
    const typedStatus = newStatus as ProjectStatus;
    setCurrentStatus(typedStatus);
    onStatusChange(project.id, typedStatus);
  };

  const handleLocalPaymentStatusChange = (newStatus: string) => {
    onPaymentStatusChange(project.id, newStatus as PaymentStatus);
  };

  return (
    <TableRow 
      ref={el => {
        if (el) rowRefs.current.set(project.id, el);
        else rowRefs.current.delete(project.id);
      }}
    >
      <TableCell style={{ borderLeft: `4px solid ${borderColor}` }}>
        <Link to={`/projects/${project.slug}`} className="font-medium text-primary hover:underline">
          {project.name}
        </Link>
        <div className="text-sm text-muted-foreground">{project.category}</div>
      </TableCell>
      <TableCell>
        <StatusBadge 
          status={displayStatus} 
          onStatusChange={handleLocalStatusChange} 
          hasOpenTasks={hasOpenTasks} 
        />
      </TableCell>
      <TableCell>
        <PaymentStatusBadge 
          status={project.payment_status} 
          onStatusChange={handleLocalPaymentStatusChange} 
        />
      </TableCell>
      <TableCell>
        <Link to={`/projects/${project.slug}?tab=tasks`} className="flex items-center gap-2 group">
          <Progress value={project.progress} className="h-2" />
          <span className="text-sm text-muted-foreground group-hover:text-primary">{project.progress}%</span>
        </Link>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {formatProjectDateRange(project.start_date, project.due_date)}
      </TableCell>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span>{displayVenueName}</span>
            </TooltipTrigger>
            {(fullVenue !== venueName || venueName.length > 20) && fullVenue !== '-' && (
              <TooltipContent>
                <p>{fullVenue}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onDeleteProject(project.id)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Hapus Proyek</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

const TableView = ({ projects, isLoading, onDeleteProject, sortConfig, requestSort, rowRefs, onStatusChange, onPaymentStatusChange }: TableViewProps) => {
  const [visibleUpcomingCount, setVisibleUpcomingCount] = useState(10);
  const [visiblePastCount, setVisiblePastCount] = useState(15);
  const { data: statuses = [] } = useProjectStatuses();

  const sortedProjects = useMemo(() => {
    if (sortConfig.key === 'venue') {
      const sorted = [...projects].sort((a, b) => {
        const nameA = formatVenue(a.venue).name.toLowerCase();
        const nameB = formatVenue(b.venue).name.toLowerCase();
        if (nameA < nameB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (nameA > nameB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
      return sorted;
    }
    return projects;
  }, [projects, sortConfig]);

  const { upcomingProjects, pastProjects } = useMemo(() => {
    if (sortConfig.key) {
      return { upcomingProjects: sortedProjects, pastProjects: [] };
    }
    const today = startOfToday();
    const firstPastIndex = sortedProjects.findIndex(p => p.start_date && isBefore(new Date(p.start_date), today));
    
    if (firstPastIndex === -1) {
      return { upcomingProjects: sortedProjects, pastProjects: [] };
    }
    
    return {
      upcomingProjects: sortedProjects.slice(0, firstPastIndex),
      pastProjects: sortedProjects.slice(firstPastIndex),
    };
  }, [sortedProjects, sortConfig.key]);

  const visibleUpcomingProjects = upcomingProjects.slice(0, visibleUpcomingCount);
  const hasMoreUpcoming = upcomingProjects.length > visibleUpcomingCount;

  const visiblePastProjects = pastProjects.slice(0, visiblePastCount);
  const hasMorePast = pastProjects.length > visiblePastCount;

  const handleLoadMoreUpcoming = () => {
    setVisibleUpcomingCount(upcomingProjects.length);
  };

  const handleLoadMorePast = () => {
    setVisiblePastCount(pastProjects.length);
  };

  let lastUpcomingMonth: string | null = null;
  let lastPastMonth: string | null = null;
  const isDateSorted = sortConfig.key === null || sortConfig.key === 'start_date';

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead className="w-[300px] p-2">
              <Button variant="ghost" onClick={() => requestSort('name')} className="w-full justify-start px-2 group">
                Project
              </Button>
            </TableHead>
            <TableHead className="w-[140px] p-2">
              <Button variant="ghost" onClick={() => requestSort('status')} className="w-full justify-start px-2 group">
                Status
              </Button>
            </TableHead>
            <TableHead className="w-[120px] p-2">
              <Button variant="ghost" onClick={() => requestSort('payment_status')} className="w-full justify-start px-2 group">
                Payment
              </Button>
            </TableHead>
            <TableHead className="w-[150px] p-2">
              <Button variant="ghost" onClick={() => requestSort('progress')} className="w-full justify-start px-2 group">
                Progress
              </Button>
            </TableHead>
            <TableHead className="w-[180px] p-2">
              <Button variant="ghost" onClick={() => requestSort('start_date')} className="w-full justify-start px-2 group">
                Date
              </Button>
            </TableHead>
            <TableHead className="w-[200px] p-2">
              <Button variant="ghost" onClick={() => requestSort('venue')} className="w-full justify-start px-2 group">
                Lokasi
              </Button>
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                Loading projects...
              </TableCell>
            </TableRow>
          ) : (
            <>
              {visibleUpcomingProjects.map(project => {
                const projectMonthYear = project.start_date ? formatInJakarta(new Date(project.start_date), 'MMMM yyyy') : null;
                let showMonthSeparator = false;
                if (isDateSorted && projectMonthYear && projectMonthYear !== lastUpcomingMonth) {
                  showMonthSeparator = true;
                  lastUpcomingMonth = projectMonthYear;
                }

                return (
                  <React.Fragment key={project.id}>
                    {showMonthSeparator && (
                      <TableRow className="border-none hover:bg-transparent">
                        <TableCell colSpan={7} className="pt-6 pb-2 px-4 text-sm font-semibold text-foreground">
                          {projectMonthYear}
                        </TableCell>
                      </TableRow>
                    )}
                    <ProjectRow 
                      project={project} 
                      onDeleteProject={onDeleteProject} 
                      rowRefs={rowRefs} 
                      onStatusChange={onStatusChange} 
                      onPaymentStatusChange={onPaymentStatusChange}
                      statuses={statuses} 
                    />
                  </React.Fragment>
                );
              })}

              {hasMoreUpcoming && (
                <TableRow className="border-none hover:bg-transparent">
                  <TableCell colSpan={7} className="py-2 text-center">
                    <Button variant="outline" onClick={handleLoadMoreUpcoming}>
                      Load More Upcoming
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {pastProjects.length > 0 && (
                <TableRow className="border-none hover:bg-transparent">
                  <TableCell colSpan={7} className="py-4">
                    <div className="flex items-center">
                      <div className="flex-grow border-t"></div>
                      <span className="flex-shrink mx-4 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Past Events
                      </span>
                      <div className="flex-grow border-t"></div>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {visiblePastProjects.map(project => {
                const projectMonthYear = project.start_date ? formatInJakarta(new Date(project.start_date), 'MMMM yyyy') : null;
                let showMonthSeparator = false;
                if (isDateSorted && projectMonthYear && projectMonthYear !== lastPastMonth) {
                  showMonthSeparator = true;
                  lastPastMonth = projectMonthYear;
                }

                return (
                  <React.Fragment key={project.id}>
                    {showMonthSeparator && (
                      <TableRow className="border-none hover:bg-transparent">
                        <TableCell colSpan={7} className="pt-6 pb-2 px-4 text-sm font-semibold text-foreground">
                          {projectMonthYear}
                        </TableCell>
                      </TableRow>
                    )}
                    <ProjectRow 
                      project={project} 
                      onDeleteProject={onDeleteProject} 
                      rowRefs={rowRefs} 
                      onStatusChange={onStatusChange} 
                      onPaymentStatusChange={onPaymentStatusChange}
                      statuses={statuses} 
                    />
                  </React.Fragment>
                );
              })}

              {hasMorePast && (
                <TableRow className="border-none hover:bg-transparent">
                  <TableCell colSpan={7} className="py-2 text-center">
                    <Button variant="outline" onClick={handleLoadMorePast}>
                      Load More Past
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TableView;