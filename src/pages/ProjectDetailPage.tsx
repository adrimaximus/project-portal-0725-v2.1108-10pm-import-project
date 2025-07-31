import { useParams } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { projects, Project } from '@/data/projects';
import NotFound from './NotFound';
import ProjectHeader from '@/components/project-detail/ProjectHeader';
import ProjectMainContent from '@/components/project-detail/ProjectMainContent';

const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const project = projects.find(p => p.id === projectId);

  if (!project) {
    return <PortalLayout><NotFound /></PortalLayout>;
  }

  return (
    <PortalLayout noPadding>
      <div className="flex h-screen">
        <main className="flex-1 flex flex-col">
          <ProjectHeader project={project} />
          <ProjectMainContent project={project} />
        </main>
      </div>
    </PortalLayout>
  );
};

export default ProjectDetailPage;