import { useState } from 'react';
import { Project, Task, Reaction } from "@/types";
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
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onToggleTaskCompletion: (task: Task, completed: boolean) => void;
  onToggleCommentReaction: (commentId: string, emoji: string) => void;
  highlightedTaskId: string | null;
  onTaskHighlightComplete: () => void;
}

const ProjectMainContent = ({ 
  project, 
  isEditing, 
  onFieldChange, 
  mutations, 
  defaultTab,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleTaskCompletion,
  onToggleCommentReaction,
  highlightedTaskId,
  onTaskHighlightComplete,
}: ProjectMainContentProps) => {
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

  const newCommentsCount = project.comments?.filter(
    comment => user && comment.author.id !== user.id && new Date(comment.timestamp) > lastViewedDiscussion
  ).length ?? 0;

  const uncompletedTasksCount = project.tasks?.filter(task => !task.completed).length ?? 0;

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

  const { isPending: isUpdatingComment, variables: updatedCommentVariables } = mutations.updateComment;
  const updatedCommentId = (updatedCommentVariables as any)?.commentId;

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
          <TabsTrigger value="discussion">
            <MessageSquare className="w-4 h-4 mr-2" />
            Discussion
            {newCommentsCount > 0 && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs">
                {newCommentsCount}
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
            tasks={project.tasks || []}
            projectId={project.id}
            onAddTask={onAddTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onToggleTaskCompletion={onToggleTaskCompletion}
            highlightedTaskId={highlightedTaskId}
            onHighlightComplete={onTaskHighlightComplete}
          />
        </TabsContent>
        <TabsContent value="discussion" className="mt-4">
          <ProjectComments
            project={project}
            onAddCommentOrTicket={handleAddCommentOrTicket}
            onUpdateComment={handleUpdateComment}
            onDeleteComment={handleDeleteComment}
            onToggleCommentReaction={onToggleCommentReaction}
            isUpdatingComment={isUpdatingComment}
            updatedCommentId={updatedCommentId}
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