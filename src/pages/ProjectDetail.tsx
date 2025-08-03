"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { projects as initialProjects, Project, Comment, AssignedUser, Task, Service, FileAttachment } from '@/data/projects';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import ProjectSidebar from '@/components/project-detail/ProjectSidebar';
import ProjectMainContent from '@/components/project-detail/ProjectMainContent';
import { users } from '@/data/users';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [project, setProject] = useState<Project | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedTeam, setEditedTeam] = useState<AssignedUser[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [editedServices, setEditedServices] = useState<string[]>([]);

  useEffect(() => {
    const foundProject = projects.find(p => p.id === id);
    if (foundProject) {
      setProject(foundProject);
      setEditedDescription(foundProject.description);
      setEditedTeam(foundProject.assignedUsers || []);
      setEditedServices(foundProject.services?.map(s => s.id) || []);
    }
  }, [id, projects]);

  const handleUpdateProject = useCallback((updatedProjectData: Partial<Project>) => {
    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === id ? { ...p, ...updatedProjectData } : p
      )
    );
  }, [id]);

  const handleAddCommentOrTicket = (newComment: Comment) => {
    const newCommentWithAuthor = {
      ...newComment,
      author: users[0],
    };
    handleUpdateProject({
      comments: [...(project?.comments || []), newCommentWithAuthor],
    });
  };

  const handleTasksUpdate = (updatedTasks: Task[]) => {
    handleUpdateProject({ tasks: updatedTasks });
  };

  const handleSave = () => {
    if (!project) return;

    const updatedFiles: FileAttachment[] = [
      ...(project.files || []),
      ...newFiles.map(file => ({
        id: `file-${Date.now()}-${Math.random()}`,
        name: file.name,
        url: URL.createObjectURL(file),
        size: `${(file.size / 1024).toFixed(2)} KB`,
      })),
    ];

    const updatedServices: Service[] = editedServices.map(serviceId => {
        const service = project.services?.find(s => s.id === serviceId);
        return service || { id: serviceId, name: serviceId, status: 'Active' };
    });

    handleUpdateProject({
      description: editedDescription,
      assignedUsers: editedTeam,
      files: updatedFiles,
      services: updatedServices,
    });

    setNewFiles([]);
    setIsEditing(false);
    toast({
      title: "Project Updated",
      description: "Your project details have been saved successfully.",
    });
  };

  const handleCancel = () => {
    if (project) {
      setEditedDescription(project.description);
      setEditedTeam(project.assignedUsers || []);
      setNewFiles([]);
      setEditedServices(project.services?.map(s => s.id) || []);
    }
    setIsEditing(false);
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Project not found.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <ProjectSidebar
        project={project}
        isEditing={isEditing}
        onEditToggle={() => setIsEditing(!isEditing)}
        onSave={handleSave}
        onCancel={handleCancel}
        onTeamChange={setEditedTeam}
        onFilesChange={setNewFiles}
        newFiles={newFiles}
        onServicesChange={setEditedServices}
        onTasksUpdate={handleTasksUpdate}
      />
      <ProjectMainContent project={project} />
      <Toaster />
    </div>
  );
};

export default ProjectDetail;