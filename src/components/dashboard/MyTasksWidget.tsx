import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ListChecks, Loader2, Clock, CheckCircle2 } from 'lucide-react';
import { Task } from '@/types';
import { format, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const MyTasksWidget = () => {
  const { user } = useAuth();
  const { data: tasks = [], isLoading } = useTasks({
    hideCompleted: true,
    sortConfig: { key: 'due_date', direction: 'asc' },
  });

  const myTasks = tasks.filter(task => 
    task.assignedTo?.some(assignee => assignee.id === user?.id)
  ).slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            My Tasks
          </CardTitle>
          {!isLoading && myTasks.length > 0 && <Badge variant="secondary">{myTasks.length} Upcoming</Badge>}
        </div>
        <Button asChild variant="link" className="text-sm -my-2 -mr-4">
          <Link to="/projects?view=tasks">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : myTasks.length === 0 ? (
          <div className="text-center py-10">
            <div className="mx-auto h-12 w-12 text-green-500 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-foreground">All caught up!</h3>
            <p className="mt-1 text-sm text-muted-foreground">You have no upcoming tasks.</p>
          </div>
        ) : (
          <div className="divide-y divide-border -mx-6 -mb-6">
            {myTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 px-6 py-2.5 transition-colors hover:bg-muted/50">
                <div className="flex-grow">
                  <Link to={`/projects?view=tasks&taskId=${task.id}`} className="font-medium leading-tight hover:underline text-sm">
                    {task.title}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">{task.project_name}</p>
                </div>
                {task.due_date && (
                  <div className={cn(
                    "text-xs font-medium whitespace-nowrap flex items-center gap-1.5",
                    isPast(new Date(task.due_date)) ? "text-destructive" : "text-muted-foreground"
                  )}>
                    <Clock className="h-3 w-3" />
                    <span>{format(new Date(task.due_date), 'MMM d, p')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyTasksWidget;