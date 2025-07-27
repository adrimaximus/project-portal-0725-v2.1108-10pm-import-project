import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dummyProjects, Project, AssignedUser } from '@/data/projects';
import { dummyComments, Comment } from '@/data/comments';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ProjectHeader from '@/components/project-detail/ProjectHeader';
import ProjectMainContent from '@/components/project-detail/ProjectMainContent';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);

  useEffect(() => {
    const foundProject = dummyProjects.find((p) => p.id === id);
    if (foundProject) {
      const clonedProject = JSON.parse(JSON.stringify(foundProject));
      setProject(clonedProject);
      setEditedProject(clonedProject);
      const projectComments = dummyComments.filter((c) => c.projectId === id);
      setComments(projectComments);
    } else {
      navigate('/');
    }
  }, [id, navigate]);

  const handleSave = () => {
    if (editedProject) {
      const projectIndex = dummyProjects.findIndex(p => p.id === editedProject.id);
      if (projectIndex !== -1) {
        dummyProjects[projectIndex] = editedProject;
      }
      setProject(JSON.parse(JSON.stringify(editedProject)));
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedProject(project ? JSON.parse(JSON.stringify(project)) : null);
    setIsEditing(false);
  };

  const handleFieldChange = (field: keyof Project, value: any) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, [field]: value });
    }
  };

  if (!project || !editedProject) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">Project Details</h2>
      </div>
      
      <ProjectHeader 
        project={project} 
        isEditing={isEditing}
        onEditToggle={() => setIsEditing(true)}
        onSave={handleSave}
        onCancel={handleCancel}
      />
      <ProjectMainContent 
        project={project} 
        comments={comments} 
        setComments={setComments}
        isEditing={isEditing}
        editedProject={editedProject}
        onDescriptionChange={(value) => handleFieldChange('description', value)}
        onTeamChange={(value) => handleFieldChange('assignedTo', value)}
        onFilesChange={(value) => handleFieldChange('briefFiles', value)}
      />
    </div>
  );
};

export default ProjectDetail;