import { useMemo } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CalendarClock, Briefcase, ListChecks } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, differenceInDays, isToday, isTomorrow } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Project } from '@/types';

interface UpcomingDeadlinesWidgetProps {
  projects: Project[];
}

const UpcomingDeadlinesWidget = ({ projects }: UpcomingDeadlinesWidgetProps) => {
  const { data: tasksData, isLoading: isLoadingTasks } = useTasks({
    hideCompleted: true,
    sortConfig: { key: 'due_date', direction: 'asc' },
  });

  const isLoading = isLoadingTasks;

  const upcomingItems = useMemo(() => {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const upcomingProjects = (projects || [])
      .filter(p => p.due_date && !['Completed', 'Cancelled', 'Archived'].includes(p.status))
      .map(p => ({
        id: p.id,
        title: p.name,
        dueDate: new Date(p.due_date!),
        type: 'project' as 'project' | 'task',
        link: `/projects/${p.slug}`,
      }));

    const upcomingTasks = (tasksData || [])
      .filter(t => t.due_date && !t.completed)
      .map(t => ({
        id: t.id,
        title: t.title,
        dueDate: new Date(t.due_date!),
        type: 'task' as 'project' | 'task',
        link: `/projects/${t.project_slug}?view=tasks&highlight=${t.id}`,
      }));

    return [...upcomingProjects, ...upcomingTasks]
      .filter(item => item.dueDate >= today && item.dueDate <= sevenDaysFromNow)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [projects, tasksData]);

  const formatDueDate = (dueDate: Date) => {
    const today = new Date();
    if (isToday(dueDate)) return { text: 'Today', color: 'text-red-500' };
    if (isTomorrow(dueDate)) return { text: 'Tomorrow', color: 'text-orange-500' };
    const diff = differenceInDays(dueDate, today);
    if (diff <= 7) return { text: `In ${diff} days`, color: 'text-yellow-600' };
    return { text: format(dueDate, 'MMM d'), color: 'text-muted-foreground' };
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" />
          Upcoming Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : upcomingItems.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground">No deadlines in the next 7 days. Great job!</p>
          </div>
        ) : (
          <ScrollArea className="h-48">
            <div className="space-y-3 pr-4">
              {upcomingItems.map(item => {
                const { text, color } = formatDueDate(item.dueDate);
                const Icon = item.type === 'project' ? Briefcase : ListChecks;
                return (
                  <Link to={item.link} key={`${item.type}-${item.id}`} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                    </div>
                    <span className={cn("text-xs font-semibold whitespace-nowrap", color)}>{text}</span>
                  </Link>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingDeadlinesWidget;