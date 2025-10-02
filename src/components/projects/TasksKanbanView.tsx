import React from 'react';
import { Task } from '@/types';

interface TasksKanbanViewProps {
  tasks: Task[];
  isLoading: boolean;
}

const TasksKanbanView = ({ tasks, isLoading }: TasksKanbanViewProps) => {
  if (isLoading) return <div>Loading...</div>;
  return <div>Tasks Kanban View - {tasks.length} tasks</div>;
};

export default TasksKanbanView;