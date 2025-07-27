import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { projects as initialProjects, Project, AssignedUser } from "@/data/projects";
import { PageHeader, PageHeaderHeading, PageHeaderDescription } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ChevronLeft, Edit, Save, X } from "lucide-react";
import ProjectOverviewTab from "@/components/project-detail/ProjectOverviewTab";

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [originalProject, setOriginalProject] = useState<Project | null>(null);

  useEffect(() => {
    if (id) {
      const foundProject = initialProjects.find((p) => p.id === id);
      if (foundProject) {
        setProject(foundProject);
        setOriginalProject(foundProject);
      }
    }
  }, [id]);

  const handleEditToggle = () => {
    if (isEditing && project && originalProject) {
      // Cancel changes
      setProject(originalProject);
    } else if (project) {
      // Start editing
      setOriginalProject(project);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = () => {
    if (project) {
      // Here you would typically send the updated project data to your backend
      console.log("Saving changes:", project);
      toast.success("Project updated successfully!");
      setIsEditing(false);
      setOriginalProject(project); // Update original state after saving
    }
  };

  if (!project) {
    return (
      <div className="container max-w-4xl py-6 lg:py-10 text-center">
        <p>Loading project or project not found...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-6 lg:py-10">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="pl-0">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
        <div className="flex items-center gap-2">
          <Button variant={isEditing ? "outline" : "default"} onClick={handleEditToggle}>
            {isEditing ? <X className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}
            {isEditing ? "Cancel" : "Edit Project"}
          </Button>
          {isEditing && (
            <Button onClick={handleSaveChanges}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          )}
        </div>
      </div>
      <Separator className="my-4" />
      <PageHeader className="px-0">
        <PageHeaderHeading>{project.name}</PageHeaderHeading>
        <PageHeaderDescription>
          Due by {new Date(project.deadline).toLocaleDateString()}
        </PageHeaderDescription>
      </PageHeader>

      <div className="mt-8 grid gap-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4">
            <ProjectOverviewTab
              project={project}
              isEditing={isEditing}
              onDescriptionChange={(value) => setProject(prev => prev ? { ...prev, description: value } : null)}
              onTeamChange={(selectedUsers: AssignedUser[]) => setProject(prev => prev ? { ...prev, assignedTo: selectedUsers } : null)}
              onFilesChange={(files: File[]) => setProject(prev => prev ? { ...prev, briefFiles: files } : null)}
            />
          </TabsContent>
          <TabsContent value="tasks">
            <p>Tasks will be displayed here.</p>
          </TabsContent>
          <TabsContent value="activity">
            <p>Activity feed will be displayed here.</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectDetailPage;