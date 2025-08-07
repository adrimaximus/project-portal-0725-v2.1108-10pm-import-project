import { useState, useEffect } from "react";
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
import { List, CalendarDays, Calendar as CalendarIcon, Table as TableIcon, CalendarCheck, PlusCircle, RefreshCw, MoreHorizontal, Trash2 } from "lucide-react";
import ProjectsList from "./ProjectsList";
import ProjectsMonthView from "./ProjectsMonthView";
import ProjectsYearView from "./ProjectsYearView";
import GoogleCalendarEventsView from "./GoogleCalendarEventsView";
import { Button } from "./ui/button";
import ImportFromCalendarDialog from "./ImportFromCalendarDialog";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

interface ProjectsTableProps {
  projects: Project[];
}

type ViewMode = 'table' | 'list' | 'month' | 'year' | 'gcal';

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
  const [isGcalConnected, setIsGcalConnected] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [localProjects, setLocalProjects] = useState<Project[]>(projects);
  const [refreshKey, setRefreshKey] = useState(0);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  useEffect(() => {
    const checkConnection = () => {
      const storedStatus = localStorage.getItem("gcal_connected");
      setIsGcalConnected(storedStatus === "true");
    };
    checkConnection();
    
    window.addEventListener('storage', checkConnection);
    return () => {
      window.removeEventListener('storage', checkConnection);
    }
  }, []);

  const handleImport = (newProjects: Project[]) => {
    const updatedProjects = [...localProjects, ...newProjects];
    setLocalProjects(updatedProjects);
    // Also update the source dummyProjects array for global consistency in this demo app
    newProjects.forEach(p => dummyProjects.push(p));
  };

  const handleSync = () => {
    toast.info("Refreshing calendar events...");
    setRefreshKey(prev => prev + 1);
  };

  const handleDeleteProject = (projectId: string) => {
    const project = localProjects.find(p => p.id === projectId);
    if (project) {
      setProjectToDelete(project);
    }
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      // Remove from local state to update UI
      setLocalProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      
      // Remove from global dummy data source
      const index = dummyProjects.findIndex(p => p.id === projectToDelete.id);
      if (index > -1) {
        dummyProjects.splice(index, 1);
      }

      toast.success(`Project "${projectToDelete.name}" has been deleted.`);
      setProjectToDelete(null);
    }
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
              {localProjects.map((project) => (
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
        return <ProjectsList projects={localProjects} onDeleteProject={handleDeleteProject} />;
      case 'month':
        return <ProjectsMonthView projects={localProjects} refreshKey={refreshKey} />;
      case 'year':
        return <ProjectsYearView projects={localProjects} refreshKey={refreshKey} />;
      case 'gcal':
        return <GoogleCalendarEventsView refreshKey={refreshKey} />;
      default:
        return null;
    }
  };

  return (
    <>
      <ImportFromCalendarDialog 
        open={isImporting}
        onOpenChange={setIsImporting}
        onImport={handleImport}
      />
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
            {isGcalConnected && (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsImporting(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Import
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={handleSync} className="h-8 w-8">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sync Calendars</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
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
            <ToggleGroupItem value="year" aria-label="Year view">
              <CalendarIcon className="h-4 w-4" />
            </ToggleGroupItem>
            {isGcalConnected && (
              <ToggleGroupItem value="gcal" aria-label="Google Calendar view">
                <CalendarCheck className="h-4 w-4" />
              </ToggleGroupItem>
            )}
          </ToggleGroup>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </>
  );
};

export default ProjectsTable;