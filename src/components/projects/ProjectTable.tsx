import React from 'react';
import { Project } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

type ProjectTableProps = {
  projects: Project[];
  onProjectSelect: (project: Project) => void;
};

const ProjectTable = ({ projects, onProjectSelect }: ProjectTableProps) => {
  return (
    <ScrollArea className="h-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map(project => (
            <TableRow key={project.id} onClick={() => onProjectSelect(project)} className="cursor-pointer">
              <TableCell className="font-medium">{project.name}</TableCell>
              <TableCell>{project.status}</TableCell>
              <TableCell>{project.payment_status}</TableCell>
              <TableCell>{project.due_date ? new Date(project.due_date).toLocaleDateString() : 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};

export default ProjectTable;