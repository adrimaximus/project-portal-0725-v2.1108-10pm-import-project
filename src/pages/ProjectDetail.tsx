import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProjectById, getProjects, Project, Comment, Task, AssignedUser, ProjectFile } from "@/data/projects";
import { useToast } from "@/components/ui/use-toast";
import PortalLayout from "@/components/PortalLayout";
import ProjectHeader from "@/components/project-detail/ProjectHeader";
import ProjectInfoCards from "@/components/project-detail/ProjectInfoCards";
import ProjectMainContent from "@/components/project-detail/ProjectMainContent";
import ProjectProgressCard from "@/components/project-detail/ProjectProgressCard";
import { useUser } from "@/contexts/UserContext";

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUser();

  const [project, setProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (projectId) {
      const foundProject = getProjectById(projectId);
      if (foundProject) {
        setProject(foundProject);
      } else {
        navigate("/projects");
      }
    }
  }, [projectId, navigate]);

  const handleUpdateProject = (updatedProject: Partial<Project>) => {
    if (!project) return;
    setProject(prev => prev ? { ...prev, ...updatedProject } : null);
  };

  const handleSaveChanges = () => {
    // Here you would typically save to a backend
    console.log("Saving changes:", project);
    toast({
      title: "Project Updated",
      description: "Your changes have been saved.",
    });
    setIsEditing(false);
  };

  const handleAddCommentOrTicket = (comment: Comment) => {
    if (!project) return;
    const newComment: Comment = {
      ...comment,
      id: `comment-${Date.now()}`,
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar || '',
        initials: user.name.charAt(0).toUpperCase(),
      },
      date: new Date().toISOString(),
    };

    const updatedComments = [...(project.comments || []), newComment];
    let updatedTasks = project.tasks || [];

    if (newComment.isTicket) {
      const newTicketTask: Task = {
        id: `task-${Date.now()}`,
        text: newComment.text,
        completed: false,
        assignedTo: newComment.assignee ? [newComment.assignee.id] : [],
        originTicketId: newComment.id,
      };
      updatedTasks = [...updatedTasks, newTicketTask];
    }

    handleUpdateProject({ comments: updatedComments, tasks: updatedTasks });
  };

  if (!project) {
    return <PortalLayout><div>Loading...</div></PortalLayout>;
  }

  const ticketCount = project.comments?.filter(c => c.isTicket && c.ticketStatus === 'open').length || 0;

  return (
    <PortalLayout>
      <div className="space-y-6">
        <ProjectHeader
          project={project}
          isEditing={isEditing}
          onEditToggle={() => setIsEditing(!isEditing)}
          onSaveChanges={handleSaveChanges}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ProjectInfoCards project={project} />
            <ProjectMainContent
              project={project}
              isEditing={isEditing}
              onDescriptionChange={(value) => handleUpdateProject({ description: value })}
              onTeamChange={(users) => handleUpdateProject({ assignedTo: users })}
              onFilesChange={(files) => handleUpdateProject({ files: files })}
              onServicesChange={(services) => handleUpdateProject({ services: services })}
              onAddCommentOrTicket={handleAddCommentOrTicket}
              projectId={project.id}
              ticketCount={ticketCount}
              allProjects={getProjects()}
            />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <ProjectProgressCard
              project={project}
              onTasksUpdate={(tasks) => handleUpdateProject({ tasks })}
            />
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default ProjectDetail;