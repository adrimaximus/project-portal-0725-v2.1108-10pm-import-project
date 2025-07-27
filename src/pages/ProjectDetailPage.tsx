import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Project } from '@/data/projects';
import { Comment } from '@/components/ProjectComments';
import ProjectHeader from '@/components/project-detail/ProjectHeader';
import ProjectMainContent from '@/components/project-detail/ProjectMainContent';
import { allUsers } from '@/data/users';

interface ProjectDetailPageProps {
  projects: Project[];
  comments: Comment[];
  onAddComment: (comment: Omit<Comment, 'id' | 'timestamp'>) => void;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

const ProjectDetailPage = ({ projects, comments, onAddComment, setProjects }: ProjectDetailPageProps) => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [projectComments, setProjectComments] = useState<Comment[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);

  useEffect(() => {
    const currentProject = projects.find(p => p.id === projectId);
    if (currentProject) {
      setProject(currentProject);
      setEditedProject(JSON.parse(JSON.stringify(currentProject))); // Deep copy for editing
      const currentComments = comments.filter(c => c.projectId === projectId);
      setProjectComments(currentComments);
    } else {
      // Handle project not found, maybe navigate back or show a message
    }
  }, [projectId, projects, comments]);

  const handleSave = () => {
    if (editedProject) {
      setProjects(prevProjects => 
        prevProjects.map(p => p.id === editedProject.id ? editedProject : p)
      );
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

  const handleSelectChange = (name: 'status' | 'paymentStatus', value: string) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, [name]: value });
    }
  };

  const handleDateChange = (name: 'deadline' | 'paymentDueDate' | 'startDate', date: Date | undefined) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, [name]: date ? date.toISOString().split('T')[0] : '' });
    }
  };

  const handleBudgetChange = (value: number | undefined) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, budget: value || 0 });
    }
  };

  if (!project || !editedProject) {
    return <div>Loading project...</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <ProjectHeader
        project={project}
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onSave={handleSave}
        onCancel={handleCancel}
        onDelete={() => {
          setProjects(projects.filter(p => p.id !== projectId));
          navigate('/');
        }}
      />
      <ProjectMainContent
        project={project}
        comments={projectComments}
        setComments={setProjectComments} // This is for local filtering/sorting if needed, not for adding
        onAddComment={onAddComment}
        isEditing={isEditing}
        editedProject={editedProject}
        onFieldChange={handleFieldChange}
        onSelectChange={handleSelectChange}
        onDateChange={handleDateChange}
        onBudgetChange={handleBudgetChange}
        availableUsers={allUsers}
      />
    </div>
  );
};

export default ProjectDetailPage;