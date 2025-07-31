import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dummyProjects } from "@/data/projects";
import { Project, Task, ProjectFile } from "@/data/projects";
import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import ProjectHeader from "@/components/project-detail/ProjectHeader";
import ProjectInfoCards from "@/components/project-detail/ProjectInfoCards";
import ProjectProgressCard from "@/components/project-detail/ProjectProgressCard";
import ProjectDetailsCard from "@/components/project-detail/ProjectDetailsCard";
import ProjectTeam from "@/components/project-detail/ProjectTeam";
import ProjectActivityFeed from "@/components/project-detail/ProjectActivityFeed";
import ProjectFiles from "@/components/project-detail/ProjectFiles";
import ProjectComments from "@/components/ProjectComments";

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const foundProject = dummyProjects.find((p) => p.id === projectId);
    if (foundProject) {
      setProject(foundProject);
    } else {
      // Handle project not found, maybe redirect
      navigate("/");
    }
  }, [projectId, navigate]);

  const handleStatusChange = (newStatus: Project['status']) => {
    if (!project) return;
    const updatedProject = { ...project, status: newStatus };
    // Here you would typically update the backend
    setProject(updatedProject);
    const projectIndex = dummyProjects.findIndex(p => p.id === project.id);
    if (projectIndex !== -1) {
      dummyProjects[projectIndex] = updatedProject;
    }
  };

  const handleTasksUpdate = (updatedTasks: Task[]) => {
    if (!project) return;
    const updatedProject = { ...project, tasks: updatedTasks };
    setProject(updatedProject);
    const projectIndex = dummyProjects.findIndex(p => p.id === project.id);
    if (projectIndex !== -1) {
      dummyProjects[projectIndex] = updatedProject;
    }
  };
  
  const handleFilesUpdate = (updatedFiles: File[]) => {
    if (!project) return;

    const newProjectFiles: ProjectFile[] = updatedFiles.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
    }));

    const updatedProject = { ...project, files: [...(project.files || []), ...newProjectFiles] };
    setProject(updatedProject);
    const projectIndex = dummyProjects.findIndex(p => p.id === project.id);
    if (projectIndex !== -1) {
      dummyProjects[projectIndex] = updatedProject;
    }
  };

  if (!project) {
    return <PortalLayout><div className="text-center">Loading project...</div></PortalLayout>;
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{project.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <ProjectHeader project={project} onStatusChange={handleStatusChange} />

        <div className="grid gap-6 md:grid-cols-3">
          <ProjectInfoCards project={project} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <ProjectProgressCard project={project} onTasksUpdate={handleTasksUpdate} />
            <ProjectFiles project={project} onFilesUpdate={handleFilesUpdate} />
            <ProjectComments project={project} setProject={setProject} />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <ProjectDetailsCard project={project} />
            <ProjectTeam project={project} />
            <ProjectActivityFeed project={project} />
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default ProjectDetailPage;