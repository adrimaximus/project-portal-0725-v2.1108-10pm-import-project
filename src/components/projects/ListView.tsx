import { Project } from "@/types";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "../StatusBadge";
import { Progress } from "../ui/progress";
import { Calendar, MapPin, MoreHorizontal, Trash2 } from "lucide-react";
import { formatProjectDateRange } from "@/lib/utils";
import { differenceInCalendarDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ListViewProps {
  projects: Project[];
  isLoading: boolean;
  onDeleteProject: (projectId: string) => void;
}

const ListView = ({ projects, isLoading, onDeleteProject }: ListViewProps) => {
  if (isLoading) {
    return (
      <div className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-full mb-2"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return <p className="text-center text-muted-foreground p-8">No projects found.</p>;
  }

  return (
    <div className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((project) => {
        const startDate = project.start_date ? new Date(project.start_date) : null;
        const dueDate = project.due_date ? new Date(project.due_date) : null;
        let durationText = '';

        if (startDate && dueDate) {
          const timeZone = 'Asia/Jakarta';
          const zonedStartDate = toZonedTime(startDate, timeZone);
          const zonedDueDate = toZonedTime(dueDate, timeZone);
          const duration = differenceInCalendarDays(zonedDueDate, zonedStartDate) + 1;
          if (duration > 1) {
            durationText = `(${duration} days)`;
          }
        }

        return (
          <Link to={`/projects/${project.slug}`} key={project.id} className="flex">
            <Card className="hover:shadow-md transition-shadow h-full flex flex-col w-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    <CardTitle className="text-lg leading-tight">{project.name}</CardTitle>
                    <p className="text-sm text-muted-foreground pt-1">{project.category}</p>
                  </div>
                  <div className="flex items-center flex-shrink-0">
                    <StatusBadge status={project.status} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 ml-1"
                          onClick={(e) => e.preventDefault()}
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => onDeleteProject(project.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Hapus Proyek</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{formatProjectDateRange(project.start_date, project.due_date)}</span>
                    {durationText && <span className="ml-2 text-xs text-muted-foreground flex-shrink-0">{durationText}</span>}
                  </div>
                  {project.venue && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{project.venue}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">Progress</span>
                    <span className="text-xs font-semibold">{project.progress || 0}%</span>
                  </div>
                  <Progress value={project.progress || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};

export default ListView;