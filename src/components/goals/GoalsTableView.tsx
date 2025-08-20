import { useMemo } from 'react';
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
import { generateVibrantGradient } from '@/lib/utils';

interface GoalsTableViewProps {
  goals: Goal[];
  sortConfig: { key: keyof Goal | null; direction: 'ascending' | 'descending' };
  requestSort: (key: keyof Goal) => void;
}

const GoalRow = ({ goal }: { goal: Goal }) => {
  const { percentage } = getProgress(goal);
  return (
    <TableRow key={goal.id}>
      <TableCell className="py-2 px-2 sm:px-4">
        <Link to={`/goals/${goal.slug}`} className="flex items-center gap-3 group">
          <GoalIcon goal={goal} className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0" />
          <div className="flex-grow overflow-hidden">
            <p className="font-semibold truncate group-hover:underline text-sm sm:text-base">{goal.title}</p>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 sm:line-clamp-2 hidden sm:block">{goal.description}</p>
          </div>
        </Link>
      </TableCell>
      <TableCell className="py-2 px-2 sm:px-4">
        <div className="flex items-center gap-2">
          <Progress value={percentage} className="h-2 w-12 sm:w-24" indicatorStyle={{ backgroundColor: goal.color }} />
          <span className="text-sm sm:text-sm font-medium">{percentage.toFixed(0)}%</span>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell py-2 px-2 sm:px-4">
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
      <TableCell className="hidden lg:table-cell py-2 px-2 sm:px-4">
        <div className="flex -space-x-2">
          <TooltipProvider delayDuration={100}>
            {goal.collaborators.map(user => (
              <Tooltip key={user.id}>
                <TooltipTrigger asChild>
                  <Avatar className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback style={generateVibrantGradient(user.id)}>{user.initials}</AvatarFallback>
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
      <TableCell className="text-right py-2 px-2 sm:px-4">
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
};

const GoalsTableView = ({ goals, sortConfig, requestSort }: GoalsTableViewProps) => {
  const { teamGoals, personalGoals } = useMemo(() => {
    const specialTags = ['office', '7inked', 'betterworks.id'];
    const tGoals: Goal[] = [];
    const pGoals: Goal[] = [];

    goals.forEach(goal => {
      const hasSpecialTag = goal.tags && goal.tags.some(tag => specialTags.includes(tag.name.toLowerCase()));
      if (hasSpecialTag) {
        tGoals.push(goal);
      } else {
        pGoals.push(goal);
      }
    });
    return { teamGoals: tGoals, personalGoals: pGoals };
  }, [goals]);

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
            <TableHead className="w-[40%] px-2 sm:px-4">
              <Button variant="ghost" onClick={() => requestSort('title')} className="w-full justify-start px-2 group">
                Goal
              </Button>
            </TableHead>
            <TableHead className="px-2 sm:px-4">Progress</TableHead>
            <TableHead className="hidden md:table-cell px-2 sm:px-4">Tags</TableHead>
            <TableHead className="hidden lg:table-cell px-2 sm:px-4">Team</TableHead>
            <TableHead className="text-right px-2 sm:px-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        {teamGoals.length > 0 && (
          <TableBody>
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5} className="font-semibold text-lg bg-muted/50">
                Team Goals
              </TableCell>
            </TableRow>
            {teamGoals.map(goal => <GoalRow key={goal.id} goal={goal} />)}
          </TableBody>
        )}
        {personalGoals.length > 0 && (
          <TableBody>
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5} className="font-semibold text-lg bg-muted/50">
                Personal Goals
              </TableCell>
            </TableRow>
            {personalGoals.map(goal => <GoalRow key={goal.id} goal={goal} />)}
          </TableBody>
        )}
      </Table>
    </div>
  );
};

export default GoalsTableView;