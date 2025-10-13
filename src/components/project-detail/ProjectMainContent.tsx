import { useState } from 'react';
import { Project } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProjectComments from '@/components/ProjectComments';
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
  const [lastViewedDiscussion, setLastViewedDiscussion] = useState(() => new Date());

  if (!user) {
    return null;
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'discussion') {
      setLastViewedDiscussion(new Date());
    }
  };

  const hasNewComments = project.comments?.some(
    comment => user && comment.author.id !== user.id && new Date(comment.timestamp) > lastViewedDiscussion
  ) ?? false;

  const uncompletedTasksCount = project.tasks?.filter(task => !task.completed).length ?? 0;

  const handleTaskAdd = (title: string, assigneeIds: string[]) => {
    if (!project || !user) return;
    mutations.addTask.mutate({ project, user, title, assigneeIds });
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

  const handleAddCommentOrTicket = async (text: string, isTicket: boolean, attachments: File[] | null, mentionedUserIds: string[]) => {
    if (!project || !user) return;
    mutations.addComment.mutate({ project, user, text, isTicket, attachments, mentionedUserIds });
  };

  const handleUpdateComment = (commentId: string, text: string, attachments: File[] | null, isConvertingToTicket: boolean, mentionedUserIds: string[]) => {
    mutations.updateComment.mutate({ commentId, text, attachments, isConvertingToTicket, mentionedUserIds });
  };

  const handleDeleteComment = (commentId: string) => {
    mutations.deleteComment.mutate(commentId);
  };

  return (
    <div className="p-4">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <LayoutGrid className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <ListChecks className="w-4 h-4 mr-2" />
            Tasks
            {uncompletedTasksCount > 0 && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs">
                {uncompletedTasksCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="discussion" className="relative">
            <MessageSquare className="w-4 h-4 mr-2" />
            Discussion
            {hasNewComments && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="w-4 h-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <ProjectOverviewTab
            project={project}
            isEditing={isEditing}
            onDescriptionChange={(value) => onFieldChange('description', value)}
            onFilesAdd={(files) => mutations.addFiles.mutate({ files, project, user })}
            onFileDelete={(fileId) => {
              const file = project.briefFiles.find(f => f.id === fileId);
              if (file) mutations.deleteFile.mutate(file);
            }}
            onServicesChange={(services) => onFieldChange('services', services)}
            onTagsChange={(tags) => onFieldChange('tags', tags)}
          />
        </TabsContent>
        <TabsContent value="tasks" className="mt-4">
          <ProjectTasks
            project={project}
            onTaskAdd={handleTaskAdd}
            onTaskAssignUsers={handleTaskAssignUsers}
            onTaskStatusChange={handleTaskStatusChange}
            onTaskDelete={handleTaskDelete}
          />
        </TabsContent>
        <TabsContent value="discussion" className="mt-4">
          <ProjectComments
            project={project}
            onAddCommentOrTicket={handleAddCommentOrTicket}
            onUpdateComment={handleUpdateComment}
            onDeleteComment={handleDeleteComment}
          />
        </TabsContent>
        <TabsContent value="activity" className="mt-4 h-[350px] overflow-y-auto pr-4">
          <ProjectActivityFeed activities={project.activities || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectMainContent;