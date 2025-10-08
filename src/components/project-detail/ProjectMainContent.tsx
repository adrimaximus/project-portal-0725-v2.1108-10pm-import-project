import { useState } from 'react';
import { Project, Task } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectComments from "@/components/ProjectComments";
import { useAuth } from '@/contexts/AuthContext';
import ProjectOverviewTab from './ProjectOverviewTab';
import ProjectTasks from './ProjectTasks';
import ProjectActivityFeed from './ProjectActivityFeed';
import { LayoutGrid, ListChecks, MessageSquare, Activity } from 'lucide-react';

interface ProjectMainContentProps {
  project: Project;
  isEditing: boolean;
  onFieldChange: (field: keyof Project, value: any) => void;
  mutations: any; // Simplified for brevity, contains all mutation functions
  defaultTab: string;
}

const ProjectMainContent = ({ project, isEditing, onFieldChange, mutations, defaultTab }: ProjectMainContentProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);

  if (!user) {
    return null;
  }

  const handleTaskAdd = (title: string) => {
    if (!project || !user) return;
    mutations.addTask.mutate({ project, user, title });
  };

  const handleTaskAssignUsers = (taskId: string, userIds: string[]) => {
    mutations.assignUsersToTask.mutate({ taskId, userIds });
  };

  const handleTaskStatusChange = (taskId: string, completed: boolean) => {
    mutations.updateTask.mutate({ taskId, updates: { completed } });
  };

  const handleTaskDelete = (taskId: string) => {
    mutations.deleteTask.mutate(taskId);
  };

  return (
    <div className="p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <LayoutGrid className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <ListChecks className="w-4 h-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="discussion">
            <MessageSquare className="w-4 h-4 mr-2" />
            Discussion
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="w-4 h-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <ProjectOverviewTab
            project={project}
            isEditing={isEditing}
            onDescriptionChange={(value) => onFieldChange('description', value)}
            onTeamChange={(users) => onFieldChange('assignedTo', users)}
            onFilesAdd={(files) => mutations.addFiles.mutate({ files, project, user })}
            onFileDelete={(fileId) => {
              const file = project.briefFiles.find(f => f.id === fileId);
              if (file) mutations.deleteFile.mutate(file);
            }}
            onServicesChange={(services) => onFieldChange('services', services)}
            onTagsChange={(tags) => onFieldChange('tags', tags)}
          />
        </TabsContent>
        <TabsContent value="tasks" className="mt-6">
          <ProjectTasks
            projectId={project.id}
          />
        </TabsContent>
        <TabsContent value="discussion" className="mt-6">
          <ProjectComments
            projectId={project.id}
          />
        </TabsContent>
        <TabsContent value="activity" className="mt-6">
          <ProjectActivityFeed activities={project.activities || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectMainContent;