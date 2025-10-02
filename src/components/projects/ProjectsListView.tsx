import React from 'react';
import { Project } from '@/types';

interface ProjectsListViewProps {
  projects: Project[];
  isLoading: boolean;
}

const ProjectsListView = ({ projects, isLoading }: ProjectsListViewProps) => {
  if (isLoading) return <div>Loading...</div>;
  return <div>Projects List View - {projects.length} projects</div>;
};

export default ProjectsListView;