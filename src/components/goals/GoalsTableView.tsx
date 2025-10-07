import { Goal } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '../ui/button';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';

interface GoalsTableViewProps {
  goals: Goal[];
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
}

const GoalsTableView = ({ goals, onEdit, onDelete }: GoalsTableViewProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Goal</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Tags</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Collaborators</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {goals.map(goal => {
          const progress = 50; // Placeholder
          return (
            <TableRow key={goal.id}>
              <TableCell>
                <Link to={`/goals/${goal.slug}`} className="flex items-center gap-3 group">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: goal.color || '#ccc' }}
                  >
                    <span className="text-xl">{goal.icon}</span>
                  </div>
                  <div>
                    <p className="font-semibold group-hover:underline">{goal.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{goal.description}</p>
                  </div>
                </Link>
              </TableCell>
              <TableCell>{goal.type}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {goal.tags?.map(tag => (
                    <Badge key={tag.id} variant="secondary" style={{ backgroundColor: tag.color, color: '#fff' }}>{tag.name}</Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="w-24">
                  <Progress value={progress} />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex -space-x-2">
                  {goal.collaborators?.map(user => (
                    <TooltipProvider key={user.id}>
                      <Tooltip>
                        <TooltipTrigger>
                          <Avatar className="h-8 w-8 border-2 border-background">
                            <AvatarImage src={getAvatarUrl(user)} alt={user.name} />
                            <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{user.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onEdit(goal)}>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(goal)} className="text-red-500">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
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