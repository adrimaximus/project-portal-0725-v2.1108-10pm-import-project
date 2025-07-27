import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { dummyProjects, Project, Comment } from "@/data/projects";
import { allUsers } from "@/data/users";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Save, X } from "lucide-react";
import ProjectInfoCards from "@/components/project-detail/ProjectInfoCards";
import ProjectDetails from "@/components/project-detail/ProjectDetails";
import RequestComments from "@/components/request/RequestComments";

const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);

  useEffect(() => {
    const foundProject = dummyProjects.find((p) => p.id === projectId);
    if (foundProject) {
      // Ensure comments is an array
      const projectWithComments = {
        ...foundProject,
        comments: foundProject.comments || [],
      };
      setProject(projectWithComments);
      setEditedProject(JSON.parse(JSON.stringify(projectWithComments))); // Deep copy for editing
    } else {
      // Handle project not found, maybe navigate to a 404 page or back to projects list
      navigate("/projects");
    }
  }, [projectId, navigate]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset changes if canceling
      setEditedProject(JSON.parse(JSON.stringify(project)));
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = () => {
    if (editedProject) {
      const projectIndex = dummyProjects.findIndex(p => p.id === projectId);
      if (projectIndex !== -1) {
        dummyProjects[projectIndex] = editedProject;
      }
      setProject(editedProject);
      setIsEditing(false);
    }
  };

  const handleSelectChange = (name: 'status' | 'paymentStatus', value: string) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, [name]: value });
    }
  };

  const handleDateChange = (name: 'deadline' | 'paymentDueDate' | 'startDate', date: Date | undefined) => {
    if (editedProject && date) {
      setEditedProject({ ...editedProject, [name]: date.toISOString().split('T')[0] });
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

  const handleAddComment = (newComment: { content: string; isInternal: boolean }) => {
    if (!project) return;

    const currentUser = allUsers[0]; // Placeholder for the currently logged-in user
    const commentToAdd: Comment = {
      id: `comment-${Date.now()}`,
      author: currentUser,
      timestamp: new Date(),
      ...newComment,
    };

    const updatedProject = {
      ...project,
      comments: [...(project.comments || []), commentToAdd],
    };

    setProject(updatedProject);

    // Also update the dummy data source
    const projectIndex = dummyProjects.findIndex((p) => p.id === projectId);
    if (projectIndex !== -1) {
      dummyProjects[projectIndex] = updatedProject;
    }
  };

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/projects")} className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
          </Button>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleEditToggle}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleSaveChanges}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={handleEditToggle}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Project
              </Button>
            )}
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>

        <ProjectInfoCards
          project={project}
          isEditing={isEditing}
          editedProject={editedProject}
          onSelectChange={handleSelectChange}
          onDateChange={handleDateChange}
          onBudgetChange={handleBudgetChange}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <ProjectDetails
              project={project}
              isEditing={isEditing}
              editedDescription={editedProject?.description || ''}
              onDescriptionChange={handleDescriptionChange}
            />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <RequestComments
              comments={project.comments || []}
              onAddComment={handleAddComment}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsPage;