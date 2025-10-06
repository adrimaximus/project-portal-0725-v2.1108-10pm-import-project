import { useState } from 'react';
import { Project } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProjectComments from '@/components/ProjectComments';
import { useAuth } from '@/contexts/AuthContext';
import ProjectOverview from './ProjectOverview';
import ProjectTasks from './ProjectTasks';
import ProjectFiles from './ProjectFiles';
import ProjectActivity from './ProjectActivity';
import { LayoutGrid, ListChecks, FileText, MessageSquare, Activity } from 'lucide-react';

interface ProjectMainContentProps {
  project: Project;
}

const ProjectMainContent = ({ project }: ProjectMainContentProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  if (!user) {
    return null;
  }

  return (
    <div className="p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <LayoutGrid className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <ListChecks className="w-4 h-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="files">
            <FileText className="w-4 h-4 mr-2" />
            Files
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
          <ProjectOverview project={project} />
        </TabsContent>
        <TabsContent value="tasks" className="mt-6">
          <ProjectTasks project={project} />
        </TabsContent>
        <TabsContent value="files" className="mt-6">
          <ProjectFiles project={project} />
        </TabsContent>
        <TabsContent value="discussion" className="mt-6">
          <ProjectComments
            project={project}
          />
        </TabsContent>
        <TabsContent value="activity" className="mt-6">
          <ProjectActivity project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectMainContent;