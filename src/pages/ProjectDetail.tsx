import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { projects as allProjectsData, users as allUsersData, Project, User, Comment, Task } from "@/data/projects";
import PortalLayout from "@/components/PortalLayout";
import ProjectHeader from "@/components/project-detail/ProjectHeader";
import ProjectMainContent from "@/components/project-detail/ProjectMainContent";
import ProjectProgressCard from "@/components/project-detail/ProjectProgressCard";
import { useToast } from "@/components/ui/use-toast";

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tempDescription, setTempDescription] = useState("");
  const [tempTeam, setTempTeam] = useState<User[]>([]);
  const [tempServices, setTempServices] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  useEffect(() => {
    const foundProject = allProjectsData.find((p) => p.id === projectId);
    if (foundProject) {
      setProject(JSON.parse(JSON.stringify(foundProject))); // Deep copy to prevent mutation of original data
      setTempDescription(foundProject.description);
      setTempTeam(foundProject.assignedTo);
      setTempServices(foundProject.services);
    } else {
      navigate("/projects");
    }
  }, [projectId, navigate]);

  const handleSaveChanges = () => {
    if (!project) return;
    
    const updatedProject = {
      ...project,
      description: tempDescription,
      assignedTo: tempTeam,
      services: tempServices,
    };
    setProject(updatedProject);
    
    const projectIndex = allProjectsData.findIndex(p => p.id === project.id);
    if (projectIndex !== -1) {
        allProjectsData[projectIndex] = updatedProject;
    }

    setIsEditing(false);
    setNewFiles([]);
    toast({
      title: "Project Updated",
      description: "Your changes have been saved successfully.",
    });
  };

  const handleCancel = () => {
    if (!project) return;
    setTempDescription(project.description);
    setTempTeam(project.assignedTo);
    setTempServices(project.services);
    setNewFiles([]);
    setIsEditing(false);
  };
  
  const handleAddCommentOrTicket = (comment: Comment) => {
    if (!project) return;
    const updatedProject = {
        ...project,
        comments: [...(project.comments || []), comment],
    };
    setProject(updatedProject);
  };

  const handleTasksUpdate = (tasks: Task[]) => {
    if (!project) return;
    const updatedProject = { ...project, tasks };
    setProject(updatedProject);
  };

  if (!project) {
    return (
      <PortalLayout>
        <div>Loading project...</div>
      </PortalLayout>
    );
  }

  const ticketCount = project.comments?.filter(c => c.isTicket).length || 0;

  return (
    <PortalLayout>
      <div className="space-y-6">
        <ProjectHeader
          project={project}
          isEditing={isEditing}
          onEdit={() => setIsEditing(true)}
          onSave={handleSaveChanges}
          onCancel={handleCancel}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ProjectMainContent
              project={project}
              isEditing={isEditing}
              onDescriptionChange={setTempDescription}
              onTeamChange={setTempTeam}
              onFilesChange={setNewFiles}
              onServicesChange={setTempServices}
              onAddCommentOrTicket={handleAddCommentOrTicket}
              allProjects={allProjectsData}
              projectId={project.id}
              ticketCount={ticketCount}
            />
          </div>
          <div className="lg:col-span-1">
            <ProjectProgressCard project={project} onTasksUpdate={handleTasksUpdate} />
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default ProjectDetail;