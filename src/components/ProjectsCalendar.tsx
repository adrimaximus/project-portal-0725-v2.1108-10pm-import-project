import { Project } from '@/data/projects';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Clock, UserPlus, CalendarOff, Send, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Helper to format dates
const formatDate = (date: Date) => {
  const day = date.toLocaleDateString('id-ID', { weekday: 'short' });
  const dayOfMonth = date.getDate().toString().padStart(2, '0');
  return { day, dayOfMonth };
};

const formatMonthYear = (date: Date) => {
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
};

const formatEndDate = (date: Date) => {
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

interface ProjectsCalendarProps {
  projects: Project[];
}

const ProjectsCalendar = ({ projects }: ProjectsCalendarProps) => {
  const navigate = useNavigate();

  const sortedProjects = projects
    .filter(p => p.startDate)
    .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());

  const groupedByDay = sortedProjects.reduce((acc, project) => {
    const dateKey = new Date(project.startDate!).toISOString().split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(project);
    return acc;
  }, {} as Record<string, Project[]>);

  let lastMonth: string | null = null;

  if (sortedProjects.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        Tidak ada proyek yang dijadwalkan.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedByDay).map(([dateStr, projectsOnDay]) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const currentMonth = formatMonthYear(date);
        const showMonthHeader = currentMonth !== lastMonth;
        lastMonth = currentMonth;

        const { day: dayOfWeek, dayOfMonth } = formatDate(date);

        return (
          <div key={dateStr}>
            {showMonthHeader && (
              <h2 className="text-lg font-semibold my-4 pl-2">{currentMonth}</h2>
            )}
            <div className="flex items-start space-x-4 md:space-x-6">
              <div className="flex flex-col items-center w-16 text-center">
                <span className="text-sm text-muted-foreground">{dayOfWeek}</span>
                <span className="text-3xl font-bold text-primary">{dayOfMonth}</span>
              </div>
              <div className="flex-1 space-y-3 pt-1">
                {projectsOnDay.map(project => {
                  const isMultiDay = project.startDate && project.dueDate && new Date(project.startDate).toDateString() !== new Date(project.dueDate).toDateString();

                  return (
                    <div 
                      key={project.id} 
                      className="bg-card border rounded-lg p-3 flex items-center justify-between hover:shadow-md transition-shadow group"
                    >
                      <div 
                        className="flex-1 flex items-center space-x-4 cursor-pointer"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <div className="w-32 text-sm text-muted-foreground hidden md:block">
                          <div className="flex items-center gap-2">
                            <Clock size={14} />
                            <span>Seharian</span>
                          </div>
                          {isMultiDay && project.dueDate && (
                            <Badge variant="outline" className="mt-1.5 font-normal text-xs">
                              Hingga {formatEndDate(new Date(project.dueDate))}
                            </Badge>
                          )}
                        </div>
                        <div className="font-medium truncate" title={project.name}>{project.name}</div>
                        <div className="flex -space-x-2 ml-auto pr-4">
                          {project.assignedTo.slice(0, 3).map((user) => (
                            <Avatar key={user.id} className="h-8 w-8 border-2 border-card">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback>{user.initials}</AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              Edit
                              <MoreHorizontal className="h-4 w-4 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Clock className="mr-2 h-4 w-4" />
                              <span>Jadwalkan ulang</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Send className="mr-2 h-4 w-4" />
                              <span>Minta penjadwalan ulang</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}`)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Edit detail</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <UserPlus className="mr-2 h-4 w-4" />
                              <span>Undang orang</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <CalendarOff className="mr-2 h-4 w-4" />
                              <span>Batalkan proyek</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProjectsCalendar;