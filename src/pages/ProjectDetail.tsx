import { useState } from "react";
import { useParams } from "react-router-dom";
import { dummyProjects, Project } from "@/data/projects";
import PortalLayout from "@/components/PortalLayout";
import { Comment } from "@/components/ProjectComments";
import ProjectDetailHeader from "@/components/project-detail/ProjectDetailHeader";
import ProjectInfoCards from "@/components/project-detail/ProjectInfoCards";
import ProjectMainContent from "@/components/project-detail/ProjectMainContent";
import ProjectSidebar from "@/components/project-detail/ProjectSidebar";

const initialComments: Comment[] = [
  { id: 1, user: { name: "Sophia Davis", avatar: "https://i.pravatar.cc/150?u=sophia" }, text: "Great progress on the mockups! Just one suggestion: can we try a different color palette for the main CTA button?", timestamp: "2 days ago" },
  { id: 2, user: { name: "Liam Brown", avatar: "https://i.pravatar.cc/150?u=liam" }, text: "Sure, I'll prepare a few alternatives. I've also attached the latest wireframes for the user dashboard.", timestamp: "1 day ago", attachment: { name: "dashboard-wireframe.png", url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=2070&auto=format&fit=crop", type: 'image' } },
];

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const projectData = dummyProjects.find((p) => p.id === projectId);

  const [project, setProject] = useState<Project | undefined>(projectData);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<Comment[]>(initialComments);

  const ticketCount = comments.filter(comment => comment.isTicket).length;

  if (!project) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-lg text-muted-foreground">Project not found.</p>
        </div>
      </PortalLayout>
    );
  }

  const handleEdit = () => {
    setEditedProject({ ...project });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProject(null);
  };

  const handleSave = () => {
    if (editedProject) {
      setProject(editedProject);
      // In a real app, you would make an API call here to save the data
      const projectIndex = dummyProjects.findIndex(p => p.id === editedProject.id);
      if (projectIndex !== -1) {
        dummyProjects[projectIndex] = editedProject;
      }
    }
    setIsEditing(false);
    setEditedProject(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editedProject) return;
    const { name, value } = e.target;
    setEditedProject({ ...editedProject, [name]: value });
  };

  const handleSelectChange = (name: 'status' | 'paymentStatus', value: string) => {
    if (!editedProject) return;
    setEditedProject({ ...editedProject, [name]: value as any });
  };

  const handleDateChange = (name: 'deadline' | 'paymentDueDate', date: Date | undefined) => {
    if (!editedProject || !date) return;
    setEditedProject({ ...editedProject, [name]: date.toISOString().split('T')[0] });
  };

  const handleBudgetChange = (value: number | undefined) => {
    if (!editedProject) return;
    setEditedProject({ ...editedProject, budget: value || 0 });
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <ProjectDetailHeader
          project={project}
          isEditing={isEditing}
          editedProject={editedProject}
          onEdit={handleEdit}
          onSave={handleSave}
          onCancel={handleCancel}
          onInputChange={handleInputChange}
        />

        <ProjectInfoCards
          project={project}
          isEditing={isEditing}
          editedProject={editedProject}
          ticketCount={ticketCount}
          onSelectChange={handleSelectChange}
          onDateChange={handleDateChange}
          onBudgetChange={handleBudgetChange}
        />

        <div className="grid gap-6 md:grid-cols-3">
          <ProjectMainContent
            project={project}
            comments={comments}
            setComments={setComments}
          />
          <ProjectSidebar project={project} />
        </div>
      </div>
    </PortalLayout>
  );
};

export default ProjectDetail;