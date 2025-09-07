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
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface GoalsTableViewProps {
  goals: Goal[];
  sortConfig: { key: keyof Goal | null; direction: 'ascending' | 'descending' };
  requestSort: (key: keyof Goal) => void;
  onDeleteGoal: (goalId: string) => void;
}

const GoalRow = ({ goal, onDeleteGoal }: { goal: Goal, onDeleteGoal: (goalId: string) => void }) => {
  const { percentage } = getProgress(goal);
  return (
    <TableRow key={goal.id}>
      <TableCell className="py-2 px-4">
        <Link to={`/goals/${goal.slug}`} className="flex items-center gap-3 group">
          <GoalIcon goal={goal} className="h-10 w-10 flex-shrink-0" />
          <div className="flex-grow overflow-hidden">
            <p className="font-semibold group-hover:underline whitespace-normal">{goal.title}</p>
            <p className="text-sm text-muted-foreground line-clamp-1">{goal.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
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
          </div>
        </Link>
      </TableCell>
      <TableCell className="py-2 px-4">
        <div className="flex items-center gap-2">
          <Progress value={percentage} className="h-2 w-24" indicatorStyle={{ backgroundColor: goal.color }} />
          <span className="text-sm font-medium">{percentage.toFixed(0)}%</span>
        </div>
      </TableCell>
      <TableCell className="py-2 px-4">
        <div className="flex -space-x-2">
          <TooltipProvider delayDuration={100}>
            {goal.collaborators.map(user => (
              <Tooltip key={user.id}>
                <TooltipTrigger asChild>
                  <Avatar className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} alt={user.name} />
                    <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
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
      <TableCell className="text-right py-2 px-4">
        <AlertDialog>
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
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the goal "{goal.title}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDeleteGoal(goal.id)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
};

const GoalsTableView = ({ goals, sortConfig, requestSort, onDeleteGoal }: GoalsTableViewProps) => {
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
    <div className="border rounded-lg overflow-x-auto">
      <Table className="min-w-[700px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%] px-4">
              <Button variant="ghost" onClick={() => requestSort('title')} className="w-full justify-start px-2 group">
                Goal
              </Button>
            </TableHead>
            <TableHead className="px-4">Progress</TableHead>
            <TableHead className="px-4">Team</TableHead>
            <TableHead className="text-right px-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        {teamGoals.length > 0 && (
          <TableBody>
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={4} className="font-semibold text-lg bg-muted/50">
                Team Goals
              </TableCell>
            </TableRow>
            {teamGoals.map(goal => <GoalRow key={goal.id} goal={goal} onDeleteGoal={onDeleteGoal} />)}
          </TableBody>
        )}
        {personalGoals.length > 0 && (
          <TableBody>
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={4} className="font-semibold text-lg bg-muted/50">
                Personal Goals
              </TableCell>
            </TableRow>
            {personalGoals.map(goal => <GoalRow key={goal.id} goal={goal} onDeleteGoal={onDeleteGoal} />)}
          </TableBody>
        )}
      </Table>
    </div>
  );
};

export default GoalsTableView;