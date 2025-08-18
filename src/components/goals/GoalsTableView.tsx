import { Goal } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getProgress } from '@/lib/progress';
import { Link } from 'react-router-dom';
import GoalIcon from './GoalIcon';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';

interface GoalsTableViewProps {
  goals: Goal[];
}

const GoalsTableView = ({ goals }: GoalsTableViewProps) => {
  if (goals.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>You haven't created any goals yet.</p>
        <p>Click "New Goal" to get started!</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Goal</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {goals.map((goal) => {
            const { percentage } = getProgress(goal);
            return (
              <TableRow key={goal.id}>
                <TableCell>
                  <Link to={`/goals/${goal.slug}`} className="flex items-center gap-3 group">
                    <GoalIcon goal={goal} className="h-10 w-10 flex-shrink-0" />
                    <div className="flex-grow overflow-hidden">
                      <p className="font-semibold truncate group-hover:underline">{goal.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{goal.description}</p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={percentage} className="h-2 w-24" indicatorStyle={{ backgroundColor: goal.color }} />
                    <span className="text-sm font-medium">{percentage.toFixed(0)}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {goal.tags.slice(0, 2).map(tag => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="text-xs"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          borderColor: tag.color,
                          color: tag.color,
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                    {goal.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">+{goal.tags.length - 2}</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex -space-x-2">
                    <TooltipProvider delayDuration={100}>
                      {goal.collaborators.map(user => (
                        <Tooltip key={user.id}>
                          <TooltipTrigger asChild>
                            <Avatar className="h-8 w-8 border-2 border-background">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{user.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/goals/${goal.slug}`}>View Details</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default GoalsTableView;