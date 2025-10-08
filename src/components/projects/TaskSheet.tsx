import React from 'react';
import { Task, Project } from '@/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

type TaskSheetProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  task: Task | null;
  projects: Project[];
};

const TaskSheet = ({ isOpen, onOpenChange, task, projects }: TaskSheetProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <ScrollArea className="h-full pr-6">
          <SheetHeader>
            <SheetTitle>{task ? 'Edit Task' : 'New Task'}</SheetTitle>
            <SheetDescription>
              {task ? `Editing details for ${task.title}` : 'Create a new task.'}
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <p>Task form will be implemented here.</p>
            <p>Available projects: {projects.length}</p>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default TaskSheet;