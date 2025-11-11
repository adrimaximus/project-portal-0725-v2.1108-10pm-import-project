import { useState, useEffect, useCallback, useRef } from 'react';
import { Project, Task, Reaction, User, Comment as CommentType, UpsertTaskPayload } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProjectOverviewTab from './ProjectOverviewTab';
import ProjectTasks from '../projects/ProjectTasks';
import ProjectActivityFeed from './ProjectActivityFeed';
import { LayoutGrid, ListChecks, MessageSquare, Activity } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { addHours } from 'date-fns';
import { toast } from 'sonner';
import { useCommentManager } from '@/hooks/useCommentManager';
import ProjectComments from '@/components/project-detail/ProjectComments';
import { useProfiles } from '@/hooks/useProfiles';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CommentInputHandle } from '../CommentInput';

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
  onHighlightComplete: () => void;
  highlightedCommentId?: string | null;
  onCommentHighlightComplete?: () => void;
  onSetIsEditing: (isEditing: boolean) => void;
  isUploading: boolean;
  onSaveChanges: () => void;
  onOpenTaskModal: (task?: Task | null, initialData?: Partial<UpsertTaskPayload>, project?: Project | null) => void;
  unreadTaskIds: string[];
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
  onHighlightComplete,
  highlightedCommentId,
  onCommentHighlightComplete,
  onSetIsEditing,
  isUploading,
  onSaveChanges,
  onOpenTaskModal,
  unreadTaskIds,
}: ProjectMainContentProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [lastViewedDiscussion, setLastViewedDiscussion] = useState(() => new Date());
  const [searchParams, setSearchParams] = useSearchParams();
  const [initialMention, setInitialMention] = useState<{ id: string; name: string } | null>(null);
  const [replyTo, setReplyTo] = useState<CommentType | null>(null);
  const { user } = useAuth();
  const commentInputRef = useRef<CommentInputHandle>(null);

  // Comment Management Logic
  const { 
    comments, 
    isLoadingComments,
    addComment, 
    updateComment, 
    deleteComment, 
    toggleReaction 
  } = useCommentManager({ scope: { projectId: project.id } });

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const { data: allUsers = [] } = useProfiles();

  const handleAddCommentOrTicket = (text: string, isTicket: boolean, attachments: File[] | null, mentionedUserIds: string[]) => {
    addComment.mutate({ text, isTicket, attachments, mentionedUserIds, replyToId: replyTo?.id }, {
      onSuccess: (result) => {
        setReplyTo(null);
      }
    });
  };

  const handleEditClick = (comment: CommentType) => {
    setEditingCommentId(comment.id);
    setEditedText(comment.text || '');
    setNewAttachments([]);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedText('');
    setNewAttachments([]);
  };

  const handleSaveEdit = () => {
    if (editingCommentId) {
      updateComment.mutate({ commentId: editingCommentId, text: editedText, attachments: newAttachments });
    }
    handleCancelEdit();
  };

  const handleEditFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setNewAttachments(prev => [...prev, ...Array.from(event.target.files!)]);
    }
  };

  const removeNewAttachment = (index: number) => {
    setNewAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const onCreateTicketFromComment = async (comment: CommentType) => {
    updateComment.mutate({ commentId: comment.id, text: comment.text || '', isTicket: true }, {
      onSuccess: () => {
        toast.success("Comment converted to ticket.");
      }
    });
  };

  const handleReply = (comment: CommentType) => {
    setReplyTo(comment);
    if (commentInputRef.current) {
      const author = comment.author as User;
      const authorName = [author.first_name, author.last_name].filter(Boolean).join(' ') || author.email;
      const mentionText = `@[${authorName}](${author.id}) `;
      commentInputRef.current.scrollIntoView();
      setTimeout(() => {
        if (commentInputRef.current) {
          commentInputRef.current.setText(mentionText, true);
          commentInputRef.current.focus();
        }
      }, 300);
    }
  };

  const handleMentionConsumed = useCallback(() => {
    setInitialMention(null);
  }, []);

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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'discussion') {
      setLastViewedDiscussion(new Date());
    }
  };

  const newCommentsCount = comments?.filter(
    comment => user && comment.author.id !== user.id && new Date(comment.created_at) > lastViewedDiscussion
  ).length ?? 0;

  const uncompletedTasksCount = project.tasks?.filter(task => !task.completed).length ?? 0;

  const handleScrollToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-primary/10', 'rounded-md');
      setTimeout(() => {
        element.classList.remove('bg-primary/10', 'rounded-md');
      }, 1500);
    }
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
            project={project}
            tasks={project.tasks || []}
            projectId={project.id}
            projectSlug={project.slug}
            onEditTask={(task) => onOpenTaskModal(task, undefined, project)}
            onDeleteTask={onDeleteTask}
            onToggleTaskCompletion={onToggleTaskCompletion}
            highlightedTaskId={searchParams.get('task')}
            onHighlightComplete={() => {
              const newParams = new URLSearchParams(searchParams);
              newParams.delete('task');
              setSearchParams(newParams, { replace: true });
            }}
            unreadTaskIds={unreadTaskIds}
          />
        </TabsContent>
        <TabsContent value="discussion" className="mt-4">
          <ProjectComments
            ref={commentInputRef}
            project={project}
            comments={comments}
            isLoadingComments={isLoadingComments}
            onAddCommentOrTicket={handleAddCommentOrTicket}
            onDeleteComment={(comment: CommentType) => deleteComment.mutate(comment.id)}
            onToggleCommentReaction={(commentId: string, emoji: string) => toggleReaction.mutate({ commentId, emoji })}
            editingCommentId={editingCommentId}
            editedText={editedText}
            setEditedText={setEditedText}
            handleSaveEdit={handleSaveEdit}
            handleCancelEdit={handleCancelEdit}
            onEdit={handleEditClick}
            onReply={handleReply}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            onCreateTicketFromComment={onCreateTicketFromComment}
            newAttachments={newAttachments}
            removeNewAttachment={removeNewAttachment}
            handleEditFileChange={handleEditFileChange}
            editFileInputRef={editFileInputRef}
            initialMention={initialMention}
            onMentionConsumed={handleMentionConsumed}
            allUsers={allUsers}
            onGoToReply={handleScrollToMessage}
            highlightedCommentId={highlightedCommentId}
            onHighlightComplete={onCommentHighlightComplete}
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