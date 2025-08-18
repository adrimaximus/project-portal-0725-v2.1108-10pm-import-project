import { useState } from "react";
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
import { getStatusStyles, formatInJakarta } from '@/lib/utils';

const ListView = ({ projects, onDeleteProject }: { projects: Project[], onDeleteProject: (projectId: string) => void }) => {
  const navigate = useNavigate();
  const [visibleDays, setVisibleDays] = useState(10);

  const sortedProjects = projects
    .filter(p => p.start_date)
    .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime());

  const groupedByDay = sortedProjects.reduce((acc, project) => {
    const dateKey = formatInJakarta(project.start_date!, 'yyyy-MM-dd');
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(project);
    return acc;
  }, {} as Record<string, Project[]>);

  const dayEntries = Object.entries(groupedByDay);
  const visibleDayEntries = dayEntries.slice(0, visibleDays);

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
      {visibleDayEntries.map(([dateStr, projectsOnDay]) => {
        const date = new Date(`${dateStr}T00:00:00`);
        const currentMonth = formatInJakarta(date, 'MMMM yyyy');
        const showMonthHeader = currentMonth !== lastMonth;
        lastMonth = currentMonth;

        const dayOfWeek = formatInJakarta(date, 'EEE');
        const dayOfMonth = formatInJakarta(date, 'dd');

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
                {projectsOnDay.map(project => {
                  const isMultiDay = project.start_date && project.due_date && new Date(project.start_date).toDateString() !== new Date(project.due_date).toDateString();

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
                          {isMultiDay && project.due_date && (
                            <Badge variant="outline" className="mt-1.5 font-normal text-xs">
                              Hingga {formatInJakarta(project.due_date, 'd MMM')}
                            </Badge>
                          )}
                        </div>
                        <div className="flex-1 font-medium min-w-0" title={project.name}>{project.name}</div>
                      </div>
                      
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 pl-2">
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
                        <div className="flex flex-shrink-0 -space-x-2">
                          {project.assignedTo.slice(0, 3).map((user) => (
                            <Avatar key={user.id} className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-card">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback>{user.initials}</AvatarFallback>
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
      })}
      {dayEntries.length > visibleDays && (
        <div className="text-center mt-6">
          <Button variant="outline" onClick={() => setVisibleDays(prev => prev + 10)}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
};

export default ListView;