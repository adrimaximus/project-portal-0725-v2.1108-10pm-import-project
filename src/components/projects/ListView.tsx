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
import { MoreHorizontal, Clock, UserPlus, CalendarOff, Send, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getStatusStyles } from '@/lib/utils';

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

interface ProjectsListProps {
  projects: Project[];
  onDeleteProject: (projectId: string) => void;
}

const ListView = ({ projects, onDeleteProject }: ProjectsListProps) => {
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
            <div className="flex items-start space-x-2 sm:space-x-4">
              <div className="flex flex-col items-center w-10 sm:w-12 text-center flex-shrink-0">
                <span className="text-xs sm:text-sm text-muted-foreground">{dayOfWeek}</span>
                <span className="text-xl sm:text-2xl font-bold text-primary">{dayOfMonth}</span>
              </div>
              <div className="flex-1 space-y-3 pt-1 min-w-0">
                {projectsOnDay.map(project => {
                  const isMultiDay = project.startDate && project.dueDate && new Date(project.startDate).toDateString() !== new Date(project.dueDate).toDateString();

                  return (
                    <div 
                      key={project.id} 
                      className="bg-card border border-l-4 rounded-lg p-2 sm:p-3 flex items-center justify-between hover:shadow-md transition-shadow group"
                      style={{ borderLeftColor: getStatusStyles(project.status).hex }}
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
                          {isMultiDay && project.dueDate && (
                            <Badge variant="outline" className="mt-1.5 font-normal text-xs">
                              Hingga {formatEndDate(new Date(project.dueDate))}
                            </Badge>
                          )}
                        </div>
                        <div className="flex-1 font-medium truncate min-w-0" title={project.name}>{project.name}</div>
                      </div>
                      
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                        <div className="flex flex-shrink-0 -space-x-2">
                          {project.assignedTo.slice(0, 3).map((user) => (
                            <Avatar key={user.id} className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-card">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback>{user.initials}</AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5">
                                <span className="hidden sm:inline">Edit</span>
                                <MoreHorizontal className="h-4 w-4 sm:ml-1" />
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
                              <DropdownMenuItem onClick={() => navigate(`/projects/${project.slug}`)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Edit detail</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <UserPlus className="mr-2 h-4 w-4" />
                                <span>Undang orang</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onSelect={() => onDeleteProject(project.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Hapus proyek</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <CalendarOff className="mr-2 h-4 w-4" />
                                <span>Batalkan proyek</span>
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
      })}
    </div>
  );
};

export default ListView;