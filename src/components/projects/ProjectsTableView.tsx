import React from 'react';
import { Project } from '@/types';

interface ProjectsTableViewProps {
  projects: Project[];
  isLoading: boolean;
}

const ProjectsTableView = ({ projects, isLoading }: ProjectsTableViewProps) => {
  if (isLoading) return <div>Loading...</div>;
  return <div>Projects Table View - {projects.length} projects</div>;
};

export default ProjectsTableView;