import { useState, useEffect, useCallback } from 'react';
import { Project, Task, Reaction, User, Comment as CommentType } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProjectBrief from './ProjectBrief';
import { useAuth } from '@/contexts/AuthContext';
import ProjectOverviewTab from './ProjectOverviewTab';
import ProjectTasks from './ProjectTasks';
import ProjectActivityFeed from './ProjectActivityFeed';
import { LayoutGrid, ListChecks, MessageSquare, Activity } from 'lucide-react';
import { useProfiles } from '@/hooks/useProfiles';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { UpsertTaskPayload } from '@/types';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { addHours } from 'date-fns';
import { useTags } from '@/hooks/useTags';
import { getErrorMessage, parseMentions } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog } from '@/components/ui/dialog';
import TaskDetailCard from '@/components/projects/TaskDetailCard';
import ProjectComments from '@/components/project-detail/ProjectComments';

interface ProjectMainContentProps {
  project: Project;
  isEditing: boolean;
  onFieldChange: (field: keyof Project, value: any) => void;
  mutations: {
    addFiles: any;
    deleteFile: any;
  };
  defaultTab: string;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onToggleTaskCompletion: (task: Task, completed: boolean) => void;
  highlightedTaskId: string | null;
  onTaskHighlightComplete: () => void;
  onSetIsEditing: (isEditing: boolean) => void;
  isUploading: boolean;
  onSaveChanges: () => void;
  onOpenTaskModal: (task?: Task | null, initialData?: Partial<UpsertTaskPayload>, project?: Project | null) => void;
}

const ProjectMainContent = ({ 
  project, 
  isEditing, 
  onFieldChange, 
  mutations, 
  defaultTab,
  onEditTask,
  onDeleteTask,
  onToggleTaskCompletion,
  highlightedTaskId,
  onTaskHighlightComplete,
  onSetIsEditing,
  isUploading,
  onSaveChanges,
  onOpenTaskModal,
}: ProjectMainContentProps) => {
  const { user } = useAuth();
  const { data: allUsers = [] } = useProfiles();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [lastViewedDiscussion, setLastViewedDiscussion] = useState(() => new Date());
  const [searchParams, setSearchParams] = useSearchParams();
  const [initialMention, setInitialMention] = useState<{ id: string; name: string } | null>(null);
  const [replyTo, setReplyTo] = useState<CommentType | null>(null);
  const queryClient = useQueryClient();
  const { upsertTask } = useTaskMutations(() => {
    queryClient.invalidateQueries({ queryKey: ['project', project.slug] });
  });
  const { data: allTags = [] } = useTags();
  const [selectedTaskToView, setSelectedTaskToView] = useState<Task | null>(null);

  useEffect(() => {
    const mentionId = searchParams.get('mention');
    const mentionName = searchParams.get('mentionName');

    if (mentionId && mentionName) {
      setActiveTab('discussion');
      setInitialMention({ id: mentionId, name: mentionName });
      
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('mention');
      newSearchParams.delete('mentionName');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleMentionConsumed = useCallback(() => {
    setInitialMention(null);
  }, []);

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
    comment => user && comment.author.id !== user.id && new Date(comment.created_at) > lastViewedDiscussion
  ).length ?? 0;

  const uncompletedTasksCount = project.tasks?.filter(task => !task.completed).length ?? 0;

  const onCreateTicketFromComment = (comment: CommentType) => {
    if (!project) return;
    const cleanText = comment.text?.replace(/@\[[^\]]+\]\(([^)]+)\)/g, '').trim() || 'New Ticket';
    const taskTitle = `Ticket: ${cleanText.substring(0, 50)}${cleanText.length > 50 ? '...' : ''}`;

    onOpenTaskModal(undefined, {
      title: taskTitle,
      description: cleanText,
      project_id: project.id,
      status: 'To do',
      priority: 'Normal',
      due_date: addHours(new Date(), 24).toISOString(),
      origin_ticket_id: comment.id,
    }, project);
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
            onReactionsChange={(reactions) => onFieldChange('reactions', reactions)}
            onSetIsEditing={onSetIsEditing}
            isUploading={isUploading}
            onSaveChanges={onSaveChanges}
          />
        </TabsContent>
        <TabsContent value="tasks" className="mt-4">
          <ProjectTasks
            tasks={project.tasks || []}
            projectId={project.id}
            projectSlug={project.slug}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onToggleTaskCompletion={onToggleTaskCompletion}
            highlightedTaskId={highlightedTaskId}
            onTaskHighlightComplete={onTaskHighlightComplete}
            onTaskClick={setSelectedTaskToView}
          />
        </TabsContent>
        <TabsContent value="discussion" className="mt-4">
          <ProjectComments
            project={project}
            initialMention={initialMention}
            onMentionConsumed={handleMentionConsumed}
            allUsers={allUsers}
            onReply={setReplyTo}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            onCreateTicketFromComment={onCreateTicketFromComment}
          />
        </TabsContent>
        <TabsContent value="activity" className="mt-4 h-[350px] overflow-y-auto pr-4">
          <ProjectActivityFeed activities={project.activities || []} />
        </TabsContent>
      </Tabs>
      <Dialog open={!!selectedTaskToView} onOpenChange={(isOpen) => !isOpen && setSelectedTaskToView(null)}>
        {selectedTaskToView && (
          <TaskDetailCard
            task={selectedTaskToView}
            onClose={() => setSelectedTaskToView(null)}
            onEdit={onEditTask}
            onDelete={(task) => onDeleteTask(task)}
          />
        )}
      </Dialog>
    </div>
  );
};

export default ProjectMainContent;