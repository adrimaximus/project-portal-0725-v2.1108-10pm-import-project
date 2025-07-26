import { useState, useEffect, ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import { dummyProjects, Project } from "@/data/projects";
import { Comment, dummyComments } from "@/data/comments";
import ProjectDetailHeader from "@/components/project-detail/ProjectDetailHeader";
import ProjectSidebar from "@/components/project-detail/ProjectSidebar";
import ProjectMainContent from "@/components/project-detail/ProjectMainContent";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);

  useEffect(() => {
    const foundProject = dummyProjects.find((p) => p.id === projectId);
    if (foundProject) {
      setProject(foundProject);
      setEditedProject(foundProject);
      // In a real app, you'd fetch comments for this project
      setComments(dummyComments);
    } else {
      navigate("/"); // Or a 404 page
    }
  }, [projectId, navigate]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProject(project); // Reset changes
  };

  const handleSave = () => {
    if (editedProject) {
      // In a real app, you'd send this to an API
      const projectIndex = dummyProjects.findIndex(p => p.id === editedProject.id);
      if (projectIndex !== -1) {
        dummyProjects[projectIndex] = editedProject;
      }
      setProject(editedProject);
      setIsEditing(false);
      toast({
        title: "Project Updated",
        description: "Your changes have been saved successfully.",
      });
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (editedProject) {
      const { name, value } = e.target;
      setEditedProject({ ...editedProject, [name]: value });
    }
  };

  if (!project || !editedProject) {
    return (
      <PortalLayout>
        <div>Loading...</div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
        <ProjectDetailHeader
          project={project}
          isEditing={isEditing}
          editedProject={editedProject}
          onEdit={handleEdit}
          onSave={handleSave}
          onCancel={handleCancel}
          onInputChange={handleInputChange}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <ProjectMainContent
            project={project}
            comments={comments}
            setComments={setComments}
          />
        </div>
        <div className="md:col-span-1">
          <ProjectSidebar project={project} />
        </div>
      </div>
    </PortalLayout>
  );
}