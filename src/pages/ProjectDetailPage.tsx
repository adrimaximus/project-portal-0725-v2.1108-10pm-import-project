import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { dummyProjects, Project, Task, AssignedUser } from "@/data/projects";
import { Comment } from "@/components/ProjectComments";
import ProjectHeader from "@/components/project-detail/ProjectHeader";
import ProjectProgressCard from "@/components/project-detail/ProjectProgressCard";
import ProjectTeamCard from "@/components/project-detail/ProjectTeamCard";
import ProjectBrief from "@/components/project-detail/ProjectBrief";
import ProjectComments from "@/components/ProjectComments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock comments data, as it's not stored globally
const generateInitialComments = (projectId: string): Comment[] => {
  return [
    {
      id: 1,
      projectId: projectId,
      user: { name: "Emily Johnson", avatar: "https://i.pravatar.cc/150?u=emily" },
      text: "Just reviewed the initial designs. Looking great!",
      timestamp: "2 days ago",
    },
    {
      id: 2,
      projectId: projectId,
      user: { name: "Alex Chen", avatar: "https://i.pravatar.cc/150?u=alex" },
      text: "Hey @Dan, can you please check the latest API documentation?",
      timestamp: "1 day ago",
    },
  ];
};

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);

  useEffect(() => {
    const foundProject = dummyProjects.find((p) => p.id === id);
    if (foundProject) {
      setProject({ ...foundProject });
      setEditedProject({ ...foundProject });
      setComments(generateInitialComments(foundProject.id));
    } else {
      setProject(null);
    }
  }, [id]);

  const handleProjectUpdate = (updatedProject: Project) => {
    setProject(updatedProject);
    const projectIndex = dummyProjects.findIndex((p) => p.id === id);
    if (projectIndex !== -1) {
      dummyProjects[projectIndex] = updatedProject;
    }
  };

  const handleSaveChanges = () => {
    if (editedProject) {
      handleProjectUpdate(editedProject);
    }
    setIsEditing(false);
  };

  const handleCancelChanges = () => {
    if (project) {
      setEditedProject({ ...project });
    }
    setIsEditing(false);
  };

  const handleProjectNameChange = (name: string) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, name });
    }
  };

  const handleTasksUpdate = (tasks: Task[]) => {
    if (editedProject) {
      const newProgress = tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0;
      setEditedProject({ ...editedProject, tasks, progress: newProgress });
    }
  };

  const handleTaskCreate = (task: Task) => {
    if (editedProject) {
      const newTasks = [...(editedProject.tasks || []), task];
      handleTasksUpdate(newTasks);
    }
  };

  const handleBriefFilesChange = (files: File[]) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, briefFiles: files });
    }
  };

  const handleTeamChange = (team: AssignedUser[]) => {
    if (editedProject) {
      setEditedProject({ ...editedProject, assignedTo: team });
    }
  };

  if (!project || !editedProject) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-bold">Project Not Found</h1>
        <p className="text-muted-foreground">
          We couldn't find the project you're looking for.
        </p>
        <Button asChild>
          <Link to="/projects">Back to Projects</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <ProjectHeader
        project={project}
        isEditing={isEditing}
        projectName={editedProject.name}
        onProjectNameChange={handleProjectNameChange}
        onEditToggle={() => setIsEditing(!isEditing)}
        onSaveChanges={handleSaveChanges}
        onCancelChanges={handleCancelChanges}
      />
      <main className="flex-1 space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <ProjectProgressCard project={editedProject} onTasksUpdate={handleTasksUpdate} />
            <ProjectComments
              comments={comments}
              setComments={setComments}
              projectId={project.id}
              assignableUsers={project.assignedTo}
              allProjects={dummyProjects}
              onTaskCreate={handleTaskCreate}
            />
          </div>
          <div className="space-y-6">
            <ProjectTeamCard
              team={project.assignedTo}
              creator={project.createdBy}
              isEditing={isEditing}
              onTeamChange={handleTeamChange}
            />
            <Card>
              <CardHeader>
                <CardTitle>Brief & Files</CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectBrief
                  files={project.briefFiles || []}
                  isEditing={isEditing}
                  onFilesChange={handleBriefFilesChange}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectDetailPage;