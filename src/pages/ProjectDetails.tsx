import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { dummyProjects, Project, Comment } from "@/data/projects";
import ProjectComments from "@/components/project-detail/ProjectComments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const ProjectDetails = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const foundProject = dummyProjects.find((p) => p.id === projectId);
    if (foundProject) {
      setProject(foundProject);
    }
  }, [projectId]);

  const handleCommentPost = (newComment: Comment) => {
    if (project) {
      const updatedProject = {
        ...project,
        comments: [...(project.comments || []), newComment],
      };
      setProject(updatedProject);
      
      const projectIndex = dummyProjects.findIndex(p => p.id === project.id);
      if (projectIndex !== -1) {
        dummyProjects[projectIndex] = updatedProject;
      }
    }
  };

  if (!project) {
    return <div className="p-6">Loading project details...</div>;
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{project.name}</CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
            <Badge>{project.status}</Badge>
            <span>
              Due by {format(new Date(project.deadline), "PPP")}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: project.description }}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-3 lg:col-span-1">
          <CardHeader>
            <CardTitle>Project Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.assignedTo.map(user => (
              <div key={user.id} className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="col-span-3 lg:col-span-2">
          <ProjectComments
            comments={project.comments || []}
            onCommentPost={handleCommentPost}
          />
        </div>
      </div>
    </main>
  );
};

export default ProjectDetails;