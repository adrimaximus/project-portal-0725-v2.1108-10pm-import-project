import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Project, dummyProjects } from "@/data/projects";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { List, CalendarDays, Table as TableIcon, MoreHorizontal, Trash2, CalendarPlus } from "lucide-react";
import ProjectsList from "./ProjectsList";
import ProjectsMonthView from "./ProjectsMonthView";
import { Button } from "./ui/button";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "./ui/date-picker-with-range";
import CalendarEventsList from "./CalendarEventsList";

interface ProjectsTableProps {
  projects: Project[];
}

interface CalendarEvent {
    id: string;
    summary: string;
    start: { dateTime?: string; date?: string; };
    end: { dateTime?: string; date?: string; };
    htmlLink: string;
}

type ViewMode = 'table' | 'list' | 'month' | 'calendar';

const getStatusBadgeClass = (status: Project['status']) => {
  switch (status) {
    case 'On Track':
    case 'Completed':
    case 'Done':
    case 'Billed':
      return 'bg-green-100 text-green-800';
    case 'At Risk':
    case 'On Hold':
      return 'bg-yellow-100 text-yellow-800';
    case 'Off Track':
    case 'Cancelled':
      return 'bg-red-100 text-red-800';
    case 'In Progress':
    case 'Requested':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusColor = (status: Project['status']): string => {
  switch (status) {
    case 'On Track': case 'Completed': case 'Done': case 'Billed': return '#22c55e';
    case 'At Risk': case 'On Hold': return '#eab308';
    case 'Off Track': case 'Cancelled': return '#ef4444';
    case 'In Progress': case 'Requested': return '#3b82f6';
    default: return 'transparent';
  }
};

const ProjectsTable = ({ projects }: ProjectsTableProps) => {
  const [view, setView] = useState<ViewMode>('table');
  const [localProjects, setLocalProjects] = useState<Project[]>(projects);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  useEffect(() => {
    const storedEvents = localStorage.getItem('googleCalendarEvents');
    if (storedEvents) {
      try {
        setCalendarEvents(JSON.parse(storedEvents));
      } catch (e) {
        console.error("Failed to parse calendar events from localStorage", e);
        setCalendarEvents([]);
      }
    }
    
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'googleCalendarEvents') {
            const updatedEvents = localStorage.getItem('googleCalendarEvents');
            setCalendarEvents(updatedEvents ? JSON.parse(updatedEvents) : []);
        }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const filteredProjects = useMemo(() => {
    if (!dateRange || !dateRange.from) {
      return localProjects;
    }

    const fromDate = new Date(dateRange.from);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
    toDate.setHours(23, 59, 59, 999);

    return localProjects.filter(project => {
      const projectStart = new Date(project.startDate + 'T00:00:00');
      const projectEnd = new Date(project.dueDate + 'T00:00:00');
      return projectStart <= toDate && projectEnd >= fromDate;
    });
  }, [localProjects, dateRange]);

  const handleDeleteProject = (projectId: string) => {
    const project = localProjects.find(p => p.id === projectId);
    if (project) {
      setProjectToDelete(project);
    }
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      setLocalProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      
      const index = dummyProjects.findIndex(p => p.id === projectToDelete.id);
      if (index > -1) {
        dummyProjects.splice(index, 1);
      }

      toast.success(`Project "${projectToDelete.name}" has been deleted.`);
      setProjectToDelete(null);
    }
  };

  const handleImportEvent = (event: CalendarEvent) => {
    const startDate = event.start.date || event.start.dateTime?.split('T')[0];
    const dueDate = event.end.date || event.end.dateTime?.split('T')[0] || startDate;

    if (!startDate) {
        toast.error("Cannot import event without a start date.");
        return;
    }

    const newProject: Project = {
      id: `cal-${event.id}`,
      name: event.summary || "Untitled Event",
      category: 'Imported Event',
      status: 'Requested',
      progress: 0,
      budget: 0,
      startDate: startDate,
      dueDate: dueDate,
      assignedTo: [],
      tasks: [],
      comments: [],
      description: '',
      paymentStatus: 'Proposed',
      createdBy: null,
    };

    if (localProjects.some(p => p.id === newProject.id)) {
        toast.info(`"${newProject.name}" has already been imported.`);
        return;
    }

    setLocalProjects(prev => [...prev, newProject]);
    setCalendarEvents(prev => prev.filter(e => e.id !== event.id));
    toast.success(`"${newProject.name}" imported as a new project.`);
  };

  const renderContent = () => {
    switch (view) {
      case 'table':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell style={{ borderLeft: `4px solid ${getStatusColor(project.status)}` }}>
                    <Link to={`/projects/${project.id}`} className="font-medium text-primary hover:underline">
                      {project.name}
                    </Link>
                    <div className="text-sm text-muted-foreground">{project.category}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("border-transparent", getStatusBadgeClass(project.status))}>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={project.progress} className="h-2" />
                      <span className="text-sm text-muted-foreground">{project.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex -space-x-2">
                      {project.assignedTo.map((user) => (
                        <Avatar key={user.id} className="border-2 border-background">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.initials}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${project.budget.toLocaleString()}
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
                        <DropdownMenuItem onSelect={() => handleDeleteProject(project.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Hapus Proyek</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
      case 'list':
        return <ProjectsList projects={filteredProjects} onDeleteProject={handleDeleteProject} />;
      case 'month':
        return <ProjectsMonthView projects={localProjects} />;
      case 'calendar':
        return <CalendarEventsList events={calendarEvents} onImportEvent={handleImportEvent} />;
      default:
        return null;
    }
  };

  return (
    <>
      <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the project "{projectToDelete?.name}".
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 gap-4">
          <div className="flex items-center gap-2">
            <CardTitle>Projects</CardTitle>
          </div>
          <ToggleGroup 
            type="single" 
            value={view} 
            onValueChange={(value) => {
              if (value) setView(value as ViewMode);
            }}
            aria-label="View mode"
          >
            <ToggleGroupItem value="table" aria-label="Table view">
              <TableIcon className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="month" aria-label="Month view">
              <CalendarDays className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="calendar" aria-label="Calendar Import view">
              <CalendarPlus className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </CardHeader>
        <CardContent>
          {(view === 'table' || view === 'list') && (
            <div className="py-4">
              <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
            </div>
          )}
          {renderContent()}
        </CardContent>
      </Card>
    </>
  );
};

export default ProjectsTable;