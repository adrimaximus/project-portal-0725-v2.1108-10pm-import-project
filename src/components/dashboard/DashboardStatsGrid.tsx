import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Project, Task, User } from '@/types';
import { Users, Briefcase, ListChecks, CheckCircle2 } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStatsGridProps {
  projects: Project[];
  tasks: Task[];
  teamMembers: User[];
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
}

const UserAvatar = ({ user }: { user: User }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
          <AvatarImage src={getAvatarUrl(user)} alt={user.name} />
          <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
        </Avatar>
      </TooltipTrigger>
      <TooltipContent>
        <p>{user.name}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

// Other imports and components...
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


const DashboardStatsGrid = ({ projects, tasks, teamMembers, timeRange, onTimeRangeChange }: DashboardStatsGridProps) => {
  const { user } = useAuth();
  const completedTasks = tasks.filter(t => t.completed).length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <ToggleGroup type="single" value={timeRange} onValueChange={onTimeRangeChange} aria-label="Time range">
          <ToggleGroupItem value="7d" aria-label="Last 7 days">7d</ToggleGroupItem>
          <ToggleGroupItem value="30d" aria-label="Last 30 days">30d</ToggleGroupItem>
          <ToggleGroupItem value="90d" aria-label="Last 90 days">90d</ToggleGroupItem>
          <ToggleGroupItem value="all" aria-label="All time">All</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              Active projects you are a part of
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Tasks across all your projects
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks} of {tasks.length} tasks completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex -space-x-2 overflow-hidden">
              {user && <UserAvatar user={user as User} />}
              {teamMembers.slice(0, 4).map(member => (
                <UserAvatar key={member.id} user={member} />
              ))}
            </div>
            {teamMembers.length > 4 && (
              <p className="text-xs text-muted-foreground mt-2">
                +{teamMembers.length - 4} more
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStatsGrid;