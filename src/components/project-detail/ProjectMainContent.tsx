import { useState, useEffect, useCallback } from 'react';
import { Project, Task, Reaction, User, Comment as CommentType } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProjectComments from '@/components/project-detail/ProjectComments';
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
import { getErrorMessage } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface ProjectMainContentProps {
  project: Project;
  isEditing: boolean;
  onFieldChange: (field: keyof Project, value: any) => void;
  mutations: any; // Simplified for brevity, contains all mutation functions
  defaultTab: string;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onToggleTaskCompletion: (task: Task, completed: boolean) => void;
  onToggleCommentReaction: (commentId: string, emoji: string) => void;
  highlightedTaskId: string | null;
  onTaskHighlightComplete: () => void;
  onSetIsEditing: (isEditing: boolean) => void;
  isUploading: boolean;
  onSaveChanges: () => void;
  onOpenTaskModal: (task?: Task | null, initialData?: Partial<UpsertTaskPayload>, project?: Project | null) => void;
  onCreateTicketFromComment: (comment: CommentType) => void;
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
  onToggleCommentReaction,
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

  const handleAddCommentOrTicket = async (text: string, isTicket: boolean, attachments: File[] | null, mentionedUserIds: string[]) => {
    if (!project || !user) return;
    mutations.addComment.mutate({ project, user, text, isTicket, attachments, mentionedUserIds, replyToId: replyTo?.id }, {
        onSuccess: async (newComment: CommentType) => {
            setReplyTo(null);
            if (isTicket && newComment) {
                try {
                    const cleanText = newComment.text?.replace(/@\[[^\]]+\]\(([^)]+)\)/g, '').trim() || 'New Ticket';
                    const taskTitle = `Ticket: ${cleanText.substring(0, 50)}${cleanText.length > 50 ? '...' : ''}`;

                    let ticketTag = allTags.find(t => t.name.toLowerCase() === 'ticket');
                    if (!ticketTag) {
                        const { data: newTag, error: tagError } = await supabase.from('tags').insert({ name: 'Ticket', color: '#DB2777', user_id: user.id }).select().single();
                        if (tagError) throw tagError;
                        ticketTag = newTag;
                        queryClient.invalidateQueries({ queryKey: ['tags'] });
                    }

                    const taskPayload: UpsertTaskPayload = {
                        project_id: project.id,
                        title: taskTitle,
                        description: cleanText,
                        origin_ticket_id: newComment.id,
                        status: 'To do',
                        priority: 'Normal',
                        assignee_ids: mentionedUserIds,
                        due_date: addHours(new Date(), 24).toISOString(),
                        tag_ids: ticketTag ? [ticketTag.id] : [],
                    };

                    upsertTask(taskPayload, {
                        onSuccess: () => {
                            toast.success("Ticket created and task automatically generated.");
                        },
                        onError: (error) => {
                            toast.error("Ticket created, but failed to auto-generate task.", { description: getErrorMessage(error) });
                        }
                    });
                } catch (error) {
                    toast.error("An error occurred while creating the ticket task.", { description: getErrorMessage(error) });
                }
            } else {
                toast.success("Comment posted.");
            }
            
            if (mentionedUserIds.length > 0) {
              const mentionedUsers = allUsers.filter(u => mentionedUserIds.includes(u.id));
              const names = mentionedUsers.map(u => u.name);
              let notificationMessage = '';
              if (names.length === 1) {
                notificationMessage = `${names[0]} will be notified.`;
              } else if (names.length === 2) {
                notificationMessage = `${names[0]} and ${names[1]} will be notified.`;
              } else if (names.length > 2) {
                const otherCount = names.length - 1;
                notificationMessage = `${names[0]} and ${otherCount} others will be notified.`;
              }
              if (notificationMessage) {
                toast.info(notificationMessage);
              }
            }
        }
    });
  };

  const handleUpdateComment = (project: Project, commentId: string, text: string, attachments: File[] | null, isConvertingToTicket: boolean, mentionedUserIds: string[]) => {
    mutations.updateComment.mutate({ project, commentId, text, attachments, isConvertingToTicket, mentionedUserIds });
  };

  const handleDeleteComment = (commentId: string) => {
    mutations.deleteComment.mutate(commentId);
  };

  const onCreateTicketFromComment = (comment: CommentType) => {
    if (!project) return;
    const mentionedUserIds = parseMentions(comment.text || '');
    mutations.updateComment.mutate({
        project,
        commentId: comment.id,
        text: comment.text || '',
        attachments: null,
        isConvertingToTicket: true,
        mentionedUserIds,
    });
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
    </div>
  );
};

export default ProjectMainContent;