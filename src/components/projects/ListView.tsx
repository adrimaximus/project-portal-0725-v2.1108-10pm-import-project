import { Project } from '@/types';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getStatusStyles, formatInJakarta, generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { format, isSameDay, subDays } from 'date-fns';
import { id as indonesia } from 'date-fns/locale';
import {
  MessageSquare,
  Paperclip,
  ListChecks,
  Calendar,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  PauseCircle,
  PlayCircle,
  Archive,
} from 'lucide-react';

interface ListViewProps {
  projects: Project[];
}

const statusIcons: { [key: string]: React.ElementType } = {
  "On Track": TrendingUp,
  "At Risk": AlertCircle,
  "Off Track": Clock,
  "On Hold": PauseCircle,
  "Completed": CheckCircle,
  "Planning": PlayCircle,
  "Archived": Archive,
};

const ListView = ({ projects }: ListViewProps) => {
  const today = new Date();
  const yesterday = subDays(today, 1);

  const formatDateGroup = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isSameDay(date, today)) return "Today";
    if (isSameDay(date, yesterday)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  const groupedProjects = projects.reduce((acc, project) => {
    const dateGroup = formatDateGroup(project.created_at);
    if (!acc[dateGroup]) {
      acc[dateGroup] = [];
    }
    acc[dateGroup].push(project);
    return acc;
  }, {} as { [key: string]: Project[] });

  return (
    <div className="space-y-6">
      {Object.entries(groupedProjects).map(([dateGroup, projectsInGroup]) => (
        <div key={dateGroup}>
          <h3 className="text-lg font-semibold mb-3 px-1">{dateGroup}</h3>
          <div className="space-y-2">
            {projectsInGroup.map((project) => {
              const statusStyle = getStatusStyles(project.status);
              const Icon = statusIcons[project.status] || TrendingUp;

              return (
                <TooltipProvider key={project.id}>
                  <Link
                    to={`/projects/${project.slug}`}
                    className="bg-card border border-l-4 rounded-lg p-2 sm:p-3 flex items-center justify-between hover:shadow-md transition-shadow group"
                    style={{ borderLeftColor: statusStyle.hex }}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <Tooltip>
                        <TooltipTrigger>
                          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${statusStyle.tw.split(' ')[0].replace('bg-', 'text-')}`} />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{project.status}</p>
                        </TooltipContent>
                      </Tooltip>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate group-hover:text-primary">{project.name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{project.category}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-6 ml-4">
                      <div className="hidden md:flex items-center gap-3 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          <span className="text-sm">{project.comments?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Paperclip className="h-4 w-4" />
                          <span className="text-sm">{project.briefFiles?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ListChecks className="h-4 w-4" />
                          <span className="text-sm">{project.tasks?.length || 0}</span>
                        </div>
                      </div>

                      {project.due_date && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="hidden lg:flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(new Date(project.due_date), "d MMM", { locale: indonesia })}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Due Date: {format(new Date(project.due_date), "PPP")}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      <div className="flex items-center -space-x-2">
                        {project.assignedTo?.slice(0, 3).map((user) => (
                          <Tooltip key={user.id}>
                            <TooltipTrigger>
                              <Avatar key={user.id} className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-card">
                                <AvatarImage src={getAvatarUrl(user.avatar_url) || undefined} alt={user.name} />
                                <AvatarFallback style={{ backgroundColor: generatePastelColor(user.id) }}>{user.initials}</AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{user.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                        {project.assignedTo && project.assignedTo.length > 3 && (
                          <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-card">
                            <AvatarFallback>+{project.assignedTo.length - 3}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  </Link>
                </TooltipProvider>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListView;