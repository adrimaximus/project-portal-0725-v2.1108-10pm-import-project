import React from 'react';
import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

type ProjectListProps = {
  projects: Project[];
  onProjectSelect: (project: Project) => void;
};

const ProjectList = ({ projects, onProjectSelect }: ProjectListProps) => {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {projects.map(project => (
          <Card key={project.id} onClick={() => onProjectSelect(project)} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="truncate">{project.name}</CardTitle>
              <CardDescription>{project.category}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Status: {project.status}</div>
              <div className="text-sm text-muted-foreground">Payment: {project.payment_status}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ProjectList;