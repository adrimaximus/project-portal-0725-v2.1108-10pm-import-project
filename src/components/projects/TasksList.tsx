import React from 'react';
import { Task } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

type TasksListProps = {
  tasks: Task[];
  onTaskSelect: (task: Task) => void;
};

const TasksList = ({ tasks, onTaskSelect }: TasksListProps) => {
  return (
    <ScrollArea className="h-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map(task => (
            <TableRow key={task.id} onClick={() => onTaskSelect(task)} className="cursor-pointer">
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>{task.projects?.name}</TableCell>
              <TableCell>{task.status}</TableCell>
              <TableCell>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};

export default TasksList;