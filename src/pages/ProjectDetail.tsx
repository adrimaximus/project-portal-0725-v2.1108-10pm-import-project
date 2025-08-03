import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { dummyProjects, Project, AssignedUser, Task, ProjectFile, Comment } from '@/data/projects';
import { User } from '@/data/users';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, GripVertical } from 'lucide-react';
import ProjectMainContent from '@/components/project-detail/ProjectMainContent';
import ProjectSidebar from '@/components/project-detail/ProjectSidebar';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const projectData = dummyProjects.find(p => p.id === projectId);
    if (projectData) {
      setProject(projectData);
    }
    setIsLoading(false);
  }, [projectId]);

  const handleDescriptionChange = (newDescription: string) => {
    if (project) {
      setProject({ ...project, description: newDescription });
    }
  };

  const handleBudgetChange = (newBudget: number) => {
    if (project) {
      setProject({ ...project, budget: newBudget });
    }
  };

  const handleTeamChange = (newTeam: AssignedUser[]) => {
    if (project) {
      setProject({ ...project, assignedTo: newTeam });
    }
  };

  const handleFilesChange = (newFiles: File[]) => {
    if (project) {
      const newProjectFiles: ProjectFile[] = newFiles.map(f => ({ name: f.name, size: `${(f.size / 1024).toFixed(2)} KB`, url: '#' }));
      setProject({ ...project, briefFiles: [...(project.briefFiles || []), ...newProjectFiles] });
    }
  };

  const handleServicesChange = (newServices: string[]) => {
    if (project) {
      setProject({ ...project, services: newServices });
    }
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    if (project && project.tasks) {
      const newTasks = project.tasks.map(task => task.id === updatedTask.id ? updatedTask : task);
      setProject({ ...project, tasks: newTasks });
    }
  };

  const handleCommentAdd = (newComment: Comment) => {
    if (project) {
      setProject({ ...project, comments: [...(project.comments || []), newComment] });
    }
  };

  if (isLoading) {
    return <PortalLayout><div>Loading...</div></PortalLayout>;
  }

  if (!project) {
    return (
      <PortalLayout>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
          <Button asChild><Link to="/projects"><ArrowLeft className="mr-2 h-4 w-4" />Back to Projects</Link></Button>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/projects"><ArrowLeft className="mr-2 h-4 w-4" />Back to Projects</Link>
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{isEditing ? 'Editing Mode' : 'Read-only Mode'}</span>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
            <Edit className="mr-2 h-4 w-4" />
            {isEditing ? 'Save' : 'Edit'}
          </Button>
        </div>
      </div>
      <ResizablePanelGroup direction="horizontal" className="rounded-lg border">
        <ResizablePanel defaultSize={65}>
          <ProjectMainContent
            project={project}
            isEditing={isEditing}
            onDescriptionChange={handleDescriptionChange}
            onTeamChange={handleTeamChange}
            onFilesChange={handleFilesChange}
            onServicesChange={handleServicesChange}
            onTaskUpdate={handleTaskUpdate}
            onCommentAdd={handleCommentAdd}
          />
        </ResizablePanel>
        <ResizableHandle withHandle>
          <GripVertical />
        </ResizableHandle>
        <ResizablePanel defaultSize={35}>
          <ProjectSidebar project={project} isEditing={isEditing} onBudgetChange={handleBudgetChange} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </PortalLayout>
  );
};

export default ProjectDetail;