import React from 'react';
import { Project } from '@/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

type ProjectSheetProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  project: Project | null;
};

const ProjectSheet = ({ isOpen, onOpenChange, project }: ProjectSheetProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl">
        <ScrollArea className="h-full pr-6">
          <SheetHeader>
            <SheetTitle>{project ? 'Edit Project' : 'New Project'}</SheetTitle>
            <SheetDescription>
              {project ? `Editing details for ${project.name}` : 'Create a new project to get started.'}
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <p>Project form will be implemented here.</p>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default ProjectSheet;