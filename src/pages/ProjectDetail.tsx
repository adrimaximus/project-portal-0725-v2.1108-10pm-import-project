import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dummyProjects, Project } from "@/data/projects";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Save, X } from "lucide-react";
import ProjectInfoCards from "@/components/project-detail/ProjectInfoCards";
import ProjectDescription from "@/components/project-detail/ProjectDescription";
import ProjectTeam from "@/components/project-detail/ProjectTeam";
import ProjectServices from "@/components/project-detail/ProjectServices";
import { format } from "date-fns";

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | undefined>(
    dummyProjects.find((p) => p.id === projectId)
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(project ? { ...project } : null);

  const handleSave = () => {
    if (editedProject) {
      const projectIndex = dummyProjects.findIndex(p => p.id === editedProject.id);
      if (projectIndex !== -1) {
        dummyProjects[projectIndex] = editedProject;
        setProject(editedProject);
      }
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProject(project ? { ...project } : null);
    setIsEditing(false);
  };

  const handleSelectChange = (name: 'status' | 'paymentStatus', value: string) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, [name]: value as any });
    }
  };

  const onDateChange = (name: 'deadline' | 'paymentDueDate' | 'startDate', date: Date | undefined) => {
    if (editedProject && date) {
      setEditedProject({ ...editedProject, [name]: format(date, "yyyy-MM-dd") });
    }
  };

  const onBudgetChange = (value: number | undefined) => {
    if (editedProject && value !== undefined) {
      setEditedProject({ ...editedProject, budget: value });
    }
  };

  if (!project || !editedProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Project not found</h2>
          <p className="text-muted-foreground mb-4">The project you are looking for does not exist.</p>
          <Button onClick={() => navigate("/")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2 -ml-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{project.name}</h1>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Project
            </Button>
          )}
        </div>
      </div>
      
      <ProjectInfoCards
        project={project}
        isEditing={isEditing}
        editedProject={editedProject}
        onSelectChange={handleSelectChange}
        onDateChange={onDateChange}
        onBudgetChange={onBudgetChange}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <ProjectDescription
            project={project}
            isEditing={isEditing}
            editedDescription={editedProject.description}
            onDescriptionChange={(value) =>
              editedProject && setEditedProject({ ...editedProject, description: value })
            }
          />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <ProjectTeam project={project} />
          <ProjectServices project={project} />
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;