import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { dummyProjects, Project, AssignedUser } from "@/data/projects";
import PortalLayout from "@/components/PortalLayout";
import ProjectHeader from "@/components/project-detail/ProjectHeader";
import ProjectInfoCards from "@/components/project-detail/ProjectInfoCards";
import ProjectMainContent from "@/components/project-detail/ProjectMainContent";
import { Comment } from "@/components/ProjectComments";
import { initialComments } from "@/data/comments";

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<Comment[]>(initialComments);

  useEffect(() => {
    const foundProject = dummyProjects.find(p => p.id === projectId);
    if (foundProject) {
      setProject(foundProject);
      setEditedProject(structuredClone(foundProject));
    } else {
      navigate('/');
    }
  }, [projectId, navigate]);

  if (!project || !editedProject) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center h-full">
          <p>Loading project...</p>
        </div>
      </PortalLayout>
    );
  }

  const handleSaveChanges = () => {
    const projectIndex = dummyProjects.findIndex(p => p.id === projectId);
    if (projectIndex !== -1 && editedProject) {
      dummyProjects[projectIndex] = editedProject;
      setProject(editedProject);
    }
    setIsEditing(false);
  };

  const handleCancelChanges = () => {
    if (project) {
      setEditedProject(structuredClone(project));
    }
    setIsEditing(false);
  };

  const handleSelectChange = (name: 'status' | 'paymentStatus', value: string) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, [name]: value as any });
    }
  };

  const handleDateChange = (name: 'deadline' | 'paymentDueDate' | 'startDate', date: Date | undefined) => {
    if (editedProject) {
      const originalDate = (project as any)[name];
      const dateString = date ? format(date, 'yyyy-MM-dd') : originalDate;
      setEditedProject({ ...editedProject, [name]: dateString });
    }
  };

  const handleBudgetChange = (value: number | undefined) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, budget: value || 0 });
    }
  };

  const handleDescriptionChange = (value: string) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, description: value });
    }
  };

  const handleTeamChange = (selectedUsers: AssignedUser[]) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, assignedTo: selectedUsers });
    }
  };

  const projectComments = comments.filter(c => c.projectId === projectId);
  const ticketCount = projectComments.filter(c => c.isTicket).length;

  return (
    <PortalLayout>
      <div className="space-y-6">
        <ProjectHeader 
          project={project} 
          isEditing={isEditing}
          onEditToggle={() => setIsEditing(!isEditing)}
          onSaveChanges={handleSaveChanges}
          onCancelChanges={handleCancelChanges}
        />
        <ProjectInfoCards 
          project={project}
          isEditing={isEditing}
          editedProject={editedProject}
          onSelectChange={handleSelectChange}
          onDateChange={handleDateChange}
          onBudgetChange={handleBudgetChange}
        />
        <ProjectMainContent
          project={editedProject}
          isEditing={isEditing}
          onDescriptionChange={handleDescriptionChange}
          onTeamChange={handleTeamChange}
          comments={projectComments}
          setComments={setComments}
          projectId={project.id}
          ticketCount={ticketCount}
        />
      </div>
    </PortalLayout>
  );
};

export default ProjectDetail;