import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import { dummyProjects, Project } from "@/data/projects";
import ProjectHeader from "@/components/project-detail/ProjectHeader";
import ProjectInfoCards from "@/components/project-detail/ProjectInfoCards";
import ProjectComments, { Comment } from "@/components/project-detail/ProjectComments";
import { useToast } from "@/components/ui/use-toast";

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    const foundProject = dummyProjects.find((p) => p.id === id);
    if (foundProject) {
      setProject(foundProject);
      setEditedProject({ ...foundProject });
      // Initialize with some dummy comments for demonstration
      setComments([
        { id: 'c1', author: 'Client', avatar: 'https://i.pravatar.cc/150?u=client', text: 'Can we get an update on the homepage design?', timestamp: '2 hours ago' },
        { id: 'c2', author: 'Ethan Carter', avatar: 'https://i.pravatar.cc/150?u=ethan', text: 'Sure, I\'ve just pushed the latest version. Please check the staging link.', timestamp: '1 hour ago' },
        { id: 'c3', author: 'Client', avatar: 'https://i.pravatar.cc/150?u=client', text: 'Looks great! One small feedback, can we make the logo bigger?', timestamp: '30 minutes ago' },
      ]);
    } else {
      navigate("/projects");
    }
  }, [id, navigate]);

  const handleSaveChanges = () => {
    if (editedProject) {
      const projectIndex = dummyProjects.findIndex(p => p.id === editedProject.id);
      if (projectIndex !== -1) {
        dummyProjects[projectIndex] = editedProject;
        setProject(editedProject);
      }
      setIsEditing(false);
      toast({
        title: "Project Updated",
        description: "Your project details have been saved.",
      });
    }
  };

  const handleSelectChange = (name: 'status' | 'paymentStatus', value: string) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, [name]: value as any });
    }
  };

  const handleDateChange = (name: 'deadline' | 'paymentDueDate', date: Date | undefined) => {
    if (editedProject && date) {
      setEditedProject({ ...editedProject, [name]: date.toISOString().split('T')[0] });
    }
  };

  const handleBudgetChange = (value: number | undefined) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, budget: value || 0 });
    }
  };

  const handleAddComment = (text: string) => {
    const newComment: Comment = {
      id: `c${Date.now()}`,
      author: 'You',
      avatar: 'https://github.com/shadcn.png',
      text,
      timestamp: 'Just now',
    };
    setComments(prevComments => [...prevComments, newComment]);
  };

  if (!project || !editedProject) {
    return (
      <PortalLayout>
        <div className="text-center py-10">Loading project...</div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <ProjectHeader 
        project={project} 
        isEditing={isEditing}
        onEditToggle={() => setIsEditing(!isEditing)}
        onSaveChanges={handleSaveChanges}
        onCancel={() => {
          setEditedProject({ ...project });
          setIsEditing(false);
        }}
      />
      <div className="mt-6">
        <ProjectInfoCards
          project={project}
          isEditing={isEditing}
          editedProject={editedProject}
          ticketCount={comments.length}
          onSelectChange={handleSelectChange}
          onDateChange={handleDateChange}
          onBudgetChange={handleBudgetChange}
        />
      </div>
      <div className="mt-6">
        <ProjectComments 
          comments={comments}
          onAddComment={handleAddComment}
        />
      </div>
    </PortalLayout>
  );
};

export default ProjectDetail;