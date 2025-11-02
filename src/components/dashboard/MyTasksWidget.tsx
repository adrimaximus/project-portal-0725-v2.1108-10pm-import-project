import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ListChecks, Loader2 } from 'lucide-react';
import { Task } from '@/types';
import { format, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="h-5 w-5" />
          My Upcoming Tasks
        </CardTitle>
        <Button asChild variant="link" className="text-sm">
          <Link to="/projects?view=tasks">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : myTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            You have no upcoming tasks assigned to you. Great job!
          </p>
        ) : (
          <div className="space-y-4">
            {myTasks.map(task => (
              <div key={task.id} className="flex items-start justify-between">
                <div>
                  <Link to={`/projects/${task.project_slug}?task=${task.id}`} className="font-medium hover:underline">
                    {task.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">{task.project_name}</p>
                </div>
                {task.due_date && (
                  <p className={cn(
                    "text-xs font-semibold whitespace-nowrap",
                    isPast(new Date(task.due_date)) ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {format(new Date(task.due_date), 'MMM d')}
                  </p>
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