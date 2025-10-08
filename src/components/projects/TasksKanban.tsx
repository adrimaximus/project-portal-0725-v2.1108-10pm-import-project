import React from 'react';
import { Task } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

type TasksKanbanProps = {
  initialTasks: Task[];
  onTaskSelect: (task: Task) => void;
};

const TasksKanban = ({ initialTasks, onTaskSelect }: TasksKanbanProps) => {
  const columns = ['To do', 'In Progress', 'Done', 'Cancelled'];

  return (
    <ScrollArea className="h-full w-full">
        <div className="p-4 flex gap-4 h-full">
        {columns.map(column => (
            <div key={column} className="w-80 bg-muted/50 p-2 rounded-lg flex-shrink-0 flex flex-col">
            <h3 className="font-bold mb-2 p-2 text-sm text-muted-foreground">{column}</h3>
            <ScrollArea className="flex-grow">
                <div className="space-y-2 pr-2">
                {initialTasks
                    .filter(t => t.status === column)
                    .map(task => (
                    <Card key={task.id} onClick={() => onTaskSelect(task)} className="cursor-pointer hover:shadow-md">
                        <CardHeader className="p-4">
                        <CardTitle className="text-base">{task.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                        {task.projects?.name}
                        </CardContent>
                    </Card>
                    ))}
                </div>
            </ScrollArea>
            </div>
        ))}
        </div>
    </ScrollArea>
  );
};

export default TasksKanban;