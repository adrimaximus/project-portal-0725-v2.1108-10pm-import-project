import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dummyProjects, Project, ProjectFile } from '@/data/projects';
import PortalLayout from '@/components/PortalLayout';
import { ProjectHeader } from '@/components/project-detail/ProjectHeader';
import { ProjectTabs } from '@/components/project-detail/ProjectTabs';
import { ProjectOverview } from '@/components/project-detail/ProjectOverview';
import ProjectTasks from '@/components/project-detail/ProjectTasks';
import ProjectFiles from '@/components/project-detail/ProjectFiles';
import ProjectComments from '@/components/ProjectComments';
import { ProjectTeam } from '@/components/project-detail/ProjectTeam';
import { ProjectBrief } from '@/components/project-detail/ProjectBrief';
import { ProjectActivityFeed } from '@/components/project-detail/ProjectActivityFeed';
import { ProjectProgressCard } from '@/components/project-detail/ProjectProgressCard';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const foundProject = dummyProjects.find((p) => p.id === id);
    if (foundProject) {
      setProject(foundProject);
    } else {
      navigate('/404');
    }
  }, [id, navigate]);

  const handleUpdateProject = (updatedProject: Project) => {
    setProject(updatedProject);
    const projectIndex = dummyProjects.findIndex(p => p.id === updatedProject.id);
    if (projectIndex !== -1) {
      dummyProjects[projectIndex] = updatedProject;
    }
  };

  const handleFilesDrop = (acceptedFiles: File[]) => {
    if (!project) return;

    const newProjectFiles: ProjectFile[] = acceptedFiles.map(file => ({
      id: `file-${file.name}-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
    }));

    const updatedProject = {
      ...project,
      files: [...(project.files || []), ...newProjectFiles],
    };
    handleUpdateProject(updatedProject);
  };

  if (!project) {
    return <div>Loading...</div>;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <ProjectOverview project={project} onUpdate={handleUpdateProject} />;
      case 'tasks':
        return <ProjectTasks project={project} onUpdate={handleUpdateProject} />;
      case 'files':
        return <ProjectFiles project={project} onFilesDrop={handleFilesDrop} />;
      case 'discussion':
        return <ProjectComments project={project} onUpdate={handleUpdateProject} />;
      default:
        return <ProjectOverview project={project} onUpdate={handleUpdateProject} />;
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <ProjectHeader project={project} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <ProjectTabs activeTab={activeTab} setActiveTab={setActiveTab} />
              <div className="pt-6">
                {renderTabContent()}
              </div>
            </div>
          </div>
          <div className="lg:col-span-1 space-y-6">
            <ProjectProgressCard project={project} onUpdate={handleUpdateProject} />
            <ProjectBrief project={project} />
            <ProjectTeam project={project} />
            <ProjectActivityFeed project={project} />
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default ProjectDetail;