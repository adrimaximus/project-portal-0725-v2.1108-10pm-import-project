import { Goal } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface GoalsTableViewProps {
  goals: Goal[];
  onDeleteGoal: (goalId: string) => void;
  sortConfig: { key: keyof Goal | null; direction: 'ascending' | 'descending' };
  requestSort: (key: keyof Goal) => void;
}

const GoalsTableView = ({ goals, onDeleteGoal, sortConfig, requestSort }: GoalsTableViewProps) => {
  const getProgress = (goal: Goal) => {
    if (goal.type === 'value' && goal.target_value) {
      const totalValue = goal.completions.reduce((sum, c) => sum + (c.value || 0), 0);
      return (totalValue / goal.target_value) * 100;
    }
    if (goal.type === 'quantity' && goal.target_quantity) {
      const completedCount = goal.completions.length;
      return (completedCount / goal.target_quantity) * 100;
    }
    return 0;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Goal</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Tags</TableHead>
          <TableHead>Collaborators</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {goals.map((goal) => {
          const progress = getProgress(goal);
          return (
            <TableRow key={goal.id}>
              <TableCell>
                <Link to={`/goals/${goal.slug}`} className="font-medium text-primary hover:underline">{goal.title}</Link>
              </TableCell>
              <TableCell><Badge variant="outline" className="capitalize">{goal.type}</Badge></TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={progress} className="w-24" />
                  <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  {goal.tags.map(tag => (
                    <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }}>{tag.name}</Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center -space-x-2">
                  <TooltipProvider>
                    {goal.collaborators.map((user) => (
                      <Tooltip key={user.id}>
                        <TooltipTrigger>
                          <Avatar className="h-8 w-8 border-2 border-background">
                            <AvatarImage src={getAvatarUrl(user.avatar_url) || undefined} alt={user.name} />
                            <AvatarFallback style={{ backgroundColor: generatePastelColor(user.id) }}>{user.initials}</AvatarFallback>
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
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onDeleteGoal(goal.id)} className="text-red-500">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default GoalsTableView;