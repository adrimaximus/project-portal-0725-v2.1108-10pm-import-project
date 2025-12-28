import { useTasks } from '@/hooks/useTasks';
import { User, Task } from '@/types';
import { useMemo } from 'react';
import TaskItem from '../TaskItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { useProfiles } from '@/hooks/useProfiles';
import { Badge } from '@/components/ui/badge';
import { useTaskMutations } from '@/hooks/useTaskMutations';

interface PersonTasksProps {
  userId: string;
}

const PersonTasks = ({ userId }: PersonTasksProps) => {
  // We fetch all tasks and filter by user ID because get_project_tasks rpc doesn't support filtering by assignee yet for non-admins to see others' tasks easily in a dedicated query
  // However, useTasks uses get_project_tasks which returns tasks the CURRENT user can see. 
  // So this will show tasks assigned to 'userId' that 'currentUser' is allowed to see.
  const { data: allTasks, isLoading } = useTasks({ sortConfig: { key: 'due_date', direction: 'asc' } });
  const { data: allUsers = [] } = useProfiles();
  const { toggleTaskCompletion, isToggling } = useTaskMutations();

  const personTasks = useMemo(() => {
    if (!allTasks) return [];
    return allTasks.filter(task => task.assignedTo?.some(assignee => assignee.id === userId));
  }, [allTasks, userId]);

  const { activeTasks, completedTasks } = useMemo(() => {
    const active = personTasks.filter(t => !t.completed);
    const completed = personTasks.filter(t => t.completed);
    return { activeTasks: active, completedTasks: completed };
  }, [personTasks]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Tasks</CardTitle></CardHeader>
        <CardContent>Loading tasks...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-base flex items-center gap-2">
          <ListChecks className="h-4 w-4" />
          Assigned Tasks
        </CardTitle>
        <Badge variant="secondary">{activeTasks.length} Active</Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-4 pt-0 space-y-4">
            {activeTasks.length > 0 ? (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">Active ({activeTasks.length})</h4>
                {activeTasks.map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    allUsers={allUsers} 
                    onToggle={(t, c) => toggleTaskCompletion({ task: t, completed: c })}
                    isToggling={isToggling}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No active tasks.</p>
            )}

            {completedTasks.length > 0 && (
              <div className="space-y-1 pt-2 border-t">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">Completed ({completedTasks.length})</h4>
                {completedTasks.map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    allUsers={allUsers} 
                    onToggle={(t, c) => toggleTaskCompletion({ task: t, completed: c })}
                    isToggling={isToggling}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PersonTasks;