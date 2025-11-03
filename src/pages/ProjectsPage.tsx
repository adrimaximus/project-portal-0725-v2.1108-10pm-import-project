import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '@/types';
import { format, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const ProjectsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const view = searchParams.get('view');
    const taskIdFromUrl = searchParams.get('taskId');

    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const taskRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

    const { data: tasks = [], isLoading } = useTasks({
        hideCompleted: false,
        sortConfig: { key: 'due_date', direction: 'asc' },
    });

    useEffect(() => {
        if (taskIdFromUrl && tasks.length > 0) {
            const taskToSelect = tasks.find(t => t.id === taskIdFromUrl);
            if (taskToSelect) {
                setSelectedTask(taskToSelect);
                const taskElement = taskRefs.current.get(taskIdFromUrl);
                setTimeout(() => {
                    taskElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    taskElement?.classList.add('bg-yellow-100', 'dark:bg-yellow-900/30', 'transition-all', 'duration-300');
                    setTimeout(() => {
                        taskElement?.classList.remove('bg-yellow-100', 'dark:bg-yellow-900/30');
                    }, 2000);
                }, 100);
            }
        }
    }, [taskIdFromUrl, tasks]);

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setSearchParams({ view: 'tasks', taskId: task.id });
    };

    const handleSheetClose = () => {
        setSelectedTask(null);
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('taskId');
        setSearchParams(newParams);
    };

    if (view !== 'tasks') {
        return (
            <PortalLayout>
                <div className="text-center py-20">
                    <h1 className="text-2xl font-bold">Projects</h1>
                    <p className="text-muted-foreground">Select a view to get started.</p>
                    <Button asChild className="mt-4">
                        <Link to="/projects?view=tasks">View Tasks</Link>
                    </Button>
                </div>
            </PortalLayout>
        );
    }

    return (
        <PortalLayout>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">All Tasks</h1>
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-20">
                        <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No tasks found</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Looks like there are no tasks to display.</p>
                    </div>
                ) : (
                    <div className="border rounded-lg">
                        <div className="divide-y divide-border">
                            {tasks.map(task => (
                                <div
                                    key={task.id}
                                    ref={el => taskRefs.current.set(task.id, el)}
                                    onClick={() => handleTaskClick(task)}
                                    className="flex items-center gap-4 px-4 py-3 transition-colors cursor-pointer hover:bg-muted/50"
                                >
                                    <div className="flex-grow">
                                        <p className="font-medium">{task.title}</p>
                                        <p className="text-sm text-muted-foreground">{task.project_name}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {task.assignedTo && task.assignedTo.length > 0 && (
                                            <div className="flex -space-x-2">
                                                {task.assignedTo.slice(0, 3).map(assignee => (
                                                    <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
                                                        <AvatarImage src={assignee.avatar_url} />
                                                        <AvatarFallback>{assignee.name?.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                ))}
                                            </div>
                                        )}
                                        {task.due_date && (
                                            <div className={cn("text-sm font-medium whitespace-nowrap flex items-center gap-1.5", isPast(new Date(task.due_date)) ? "text-destructive" : "text-muted-foreground")}>
                                                <Clock className="h-4 w-4" />
                                                <span>{format(new Date(task.due_date), 'MMM d')}</span>
                                            </div>
                                        )}
                                        <Badge variant={task.completed ? 'default' : 'outline'}>
                                            {task.completed ? 'Done' : 'To Do'}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Sheet open={!!selectedTask} onOpenChange={(open) => !open && handleSheetClose()}>
                <SheetContent className="sm:max-w-lg">
                    {selectedTask && (
                        <>
                            <SheetHeader>
                                <SheetTitle>{selectedTask.title}</SheetTitle>
                                <SheetDescription>
                                    In project <Link to={`/projects/${selectedTask.project_slug}`} className="underline">{selectedTask.project_name}</Link>
                                </SheetDescription>
                            </SheetHeader>
                            <div className="py-6 space-y-4">
                                <p>{selectedTask.description || 'No description provided.'}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Status</span>
                                    <Badge variant={selectedTask.completed ? 'default' : 'outline'}>
                                        {selectedTask.completed ? 'Completed' : 'In Progress'}
                                    </Badge>
                                </div>
                                {selectedTask.due_date && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Due Date</span>
                                        <span className={cn("text-sm", isPast(new Date(selectedTask.due_date)) ? "text-destructive" : "")}>
                                            {format(new Date(selectedTask.due_date), 'PPP p')}
                                        </span>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <span className="text-sm font-medium">Assignees</span>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedTask.assignedTo?.map(assignee => (
                                            <div key={assignee.id} className="flex items-center gap-2 bg-muted p-1 rounded-md">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={assignee.avatar_url} />
                                                    <AvatarFallback>{assignee.name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm">{assignee.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </PortalLayout>
    );
};

export default ProjectsPage;