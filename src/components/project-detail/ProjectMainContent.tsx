import React from "react";
import { Project, AssignedUser } from "@/data/projects";
import ProjectOverview from "./ProjectOverview";
import ProjectComments, { Comment } from "@/components/ProjectComments";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface ProjectMainContentProps {
    project: Project;
    isEditing: boolean;
    onDescriptionChange: (value: string) => void;
    onTeamChange: (selectedUsers: AssignedUser[]) => void;
    onServicesChange: (selectedServices: string[]) => void;
    comments: Comment[];
    setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
    projectId: string;
    ticketCount: number;
}

const ProjectMainContent = ({
    project,
    isEditing,
    onDescriptionChange,
    onTeamChange,
    onServicesChange,
    comments,
    setComments,
    projectId,
    ticketCount,
}: ProjectMainContentProps) => {
    return (
        <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="comments">
                    Comments & Tickets
                    {ticketCount > 0 && (
                        <Badge variant="secondary" className="ml-2 rounded-full px-2">
                            {ticketCount}
                        </Badge>
                    )}
                </TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6">
                <ProjectOverview
                    project={project}
                    isEditing={isEditing}
                    onDescriptionChange={onDescriptionChange}
                    onTeamChange={onTeamChange}
                    onServicesChange={onServicesChange}
                />
            </TabsContent>
            <TabsContent value="comments" className="mt-6">
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