import React from 'react';
import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

type ProjectKanbanProps = {
  initialProjects: Project[];
  groupBy: 'status' | 'payment_status';
  onProjectSelect: (project: Project) => void;
};

const ProjectKanban = ({ initialProjects, groupBy, onProjectSelect }: ProjectKanbanProps) => {
  const columns = Array.from(new Set(initialProjects.map(p => p[groupBy])));

  return (
    <ScrollArea className="h-full w-full">
        <div className="p-4 flex gap-4 h-full">
        {columns.map(column => (
            <div key={String(column)} className="w-80 bg-muted/50 p-2 rounded-lg flex-shrink-0 flex flex-col">
            <h3 className="font-bold mb-2 p-2 text-sm text-muted-foreground">{column}</h3>
            <ScrollArea className="flex-grow">
                <div className="space-y-2 pr-2">
                {initialProjects
                    .filter(p => p[groupBy] === column)
                    .map(project => (
                    <Card key={project.id} onClick={() => onProjectSelect(project)} className="cursor-pointer hover:shadow-md">
                        <CardHeader className="p-4">
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        </CardHeader>
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

export default ProjectKanban;