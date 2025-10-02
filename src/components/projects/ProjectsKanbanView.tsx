import React from 'react';
import { Project } from '@/types';

interface ProjectsKanbanViewProps {
  projects: Project[];
  isLoading: boolean;
  groupBy: 'status' | 'payment_status';
}

const ProjectsKanbanView = ({ projects, isLoading, groupBy }: ProjectsKanbanViewProps) => {
  if (isLoading) return <div>Loading...</div>;
  return <div>Projects Kanban View (groupBy: {groupBy}) - {projects.length} projects</div>;
};

export default ProjectsKanbanView;