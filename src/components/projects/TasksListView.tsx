import { Task } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
};

interface TasksListViewProps {
  tasks: Task[];
  isLoading: boolean;
  sortConfig: SortConfig;
  onSortChange: (key: string) => void;
}

const SortableHeader = ({ children, columnKey, sortConfig, onSortChange }: { children: React.ReactNode, columnKey: string, sortConfig: SortConfig, onSortChange: (key: string) => void }) => {
  const isSorted = sortConfig.key === columnKey;
  const Icon = sortConfig.direction === 'asc' ? ArrowUp : ArrowDown;

  return (
    <Button variant="ghost" onClick={() => onSortChange(columnKey)} className="px-2 py-1 h-auto -ml-2">
      {children}
      {isSorted && <Icon className="ml-2 h-4 w-4" />}
    </Button>
  );
};

const TasksListView = ({ tasks, isLoading, sortConfig, onSortChange }: TasksListViewProps) => {
  if (isLoading) {
    return (
      <div className="space-y-2 bg-background p-4 rounded-lg border">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return <div className="bg-background p-8 rounded-lg border text-center text-muted-foreground">No tasks found.</div>;
  }

  return (
    <div className="border rounded-lg bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">
              <SortableHeader columnKey="title" sortConfig={sortConfig} onSortChange={onSortChange}>Task</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader columnKey="project_name" sortConfig={sortConfig} onSortChange={onSortChange}>Project</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader columnKey="status" sortConfig={sortConfig} onSortChange={onSortChange}>Status</SortableHeader>
            </TableHead>
            <TableHead>Assignees</TableHead>
            <TableHead>
              <SortableHeader columnKey="due_date" sortConfig={sortConfig} onSortChange={onSortChange}>Due Date</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader columnKey="updated_at" sortConfig={sortConfig} onSortChange={onSortChange}>Last Updated</SortableHeader>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>
                <Link to={`/projects/${task.project_slug}`} className="hover:underline">{task.project_name}</Link>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{task.status}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center -space-x-2">
                  <TooltipProvider>
                    {task.assignees.map((assignee) => (
                      <Tooltip key={assignee.id}>
                        <TooltipTrigger asChild>
                          <Avatar className="h-6 w-6 border-2 border-background">
                            <AvatarImage src={assignee.avatar_url} />
                            <AvatarFallback>{assignee.initials}</AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{assignee.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              </TableCell>
              <TableCell>
                {task.due_date ? format(parseISO(task.due_date), 'd MMM yyyy', { locale: id }) : '-'}
              </TableCell>
              <TableCell>
                {task.updated_at ? format(parseISO(task.updated_at), 'd MMM yyyy, HH:mm', { locale: id }) : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TasksListView;