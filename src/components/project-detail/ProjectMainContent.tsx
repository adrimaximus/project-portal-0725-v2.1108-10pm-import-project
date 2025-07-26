import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectOverview from "@/components/project-detail/ProjectOverview";
import ProjectComments, { Comment } from "@/components/ProjectComments";
import { Project, AssignedUser } from '@/data/projects';

interface ProjectMainContentProps {
  project: Project;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
  onTeamChange: (selectedUsers: AssignedUser[]) => void;
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  projectId: string;
}

const ProjectMainContent = ({
  project,
  isEditing,
  onDescriptionChange,
  onTeamChange,
  comments,
  setComments,
  projectId,
}: ProjectMainContentProps) => {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2 sm:w-[400px]">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="comments">Comments & Tickets</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-4">
        <ProjectOverview 
          project={project} 
          isEditing={isEditing}
          onDescriptionChange={onDescriptionChange}
          onTeamChange={onTeamChange}
        />
      </TabsContent>
      <TabsContent value="comments" className="mt-4">
        <ProjectComments 
          comments={comments} 
          setComments={setComments} 
          projectId={projectId}
        />
      </TabsContent>
    </Tabs>
  );
};

export default ProjectMainContent;