import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import CommentInput, { CommentInputHandle } from '@/components/CommentInput';
import Comment from '@/components/Comment';
import { User, Comment as CommentType } from '@/types';
import { getInitials } from '@/lib/utils';

interface GoalDayCommentsProps {
  goalId: string;
  date: Date;
}

const GoalDayComments = ({ goalId, date }: GoalDayCommentsProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [replyTo, setReplyTo] = useState<CommentType | null>(null);
  const commentInputRef = useRef<CommentInputHandle>(null);
  
  const formattedDate = format(date, 'yyyy-MM-dd');

  // Fetch users for mentions
  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('profiles').select('*');
      if (data) {
        const mappedUsers: User[] = data.map((p) => ({
          id: p.id,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email || 'Unknown',
          avatar_url: p.avatar_url,
          email: p.email,
          initials: getInitials(`${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email || '')
        }));
        setAllUsers(mappedUsers);
      }
    };
    fetchUsers();
  }, []);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('goal_comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          attachments_jsonb,
          reply_to_comment_id,
          is_ticket,
          profiles (
            first_name,
            last_name,
            email,
            avatar_url
          ),
          goal_comment_reactions (
            id,
            emoji,
            user_id,
            profiles (
              id,
              first_name,
              last_name
            )
          ),
          parent:goal_comments!reply_to_comment_id (
            id,
            content,
            user_id,
            profiles (
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('goal_id', goalId)
        .eq('comment_date', formattedDate)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform goal comments to match CommentType
      const transformedComments: CommentType[] = (data || []).map((item: any) => {
        // Format reactions
        const reactions = item.goal_comment_reactions?.map((r: any) => ({
          id: r.id,
          emoji: r.emoji,
          user_id: r.user_id,
          user_name: r.profiles ? `${r.profiles.first_name || ''} ${r.profiles.last_name || ''}`.trim() : 'Unknown',
          profiles: r.profiles
        })) || [];

        // Format parent/replied message
        let repliedMessage = undefined;
        if (item.parent) {
          const parentAuthor = item.parent.profiles;
          const parentName = `${parentAuthor?.first_name || ''} ${parentAuthor?.last_name || ''}`.trim() || parentAuthor?.email || 'Unknown';
          repliedMessage = {
            content: item.parent.content,
            senderName: parentName,
            isDeleted: false
          };
        }

        return {
          id: item.id,
          text: item.content,
          created_at: item.created_at,
          author: {
            id: item.user_id,
            name: `${item.profiles?.first_name || ''} ${item.profiles?.last_name || ''}`.trim() || item.profiles?.email || 'Unknown',
            avatar_url: item.profiles?.avatar_url,
            email: item.profiles?.email,
            initials: getInitials(`${item.profiles?.first_name || ''} ${item.profiles?.last_name || ''}`.trim() || item.profiles?.email || '')
          },
          reactions: reactions,
          attachments_jsonb: item.attachments_jsonb || [],
          is_ticket: item.is_ticket || false,
          reply_to_comment_id: item.reply_to_comment_id,
          repliedMessage: repliedMessage
        };
      });

      setComments(transformedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Could not load comments');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    setIsFetching(true);
    fetchComments();
    
    // Subscribe to both comments and reactions
    const commentsChannel = supabase
      .channel('goal-comments-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goal_comments', filter: `goal_id=eq.${goalId}` }, () => fetchComments())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goal_comment_reactions' }, () => fetchComments())
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
    };
  }, [goalId, formattedDate]);

  const uploadAttachments = async (files: File[]) => {
    const uploadedAttachments = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `goal-attachments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-files') // Reusing project-files bucket for simplicity
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        toast.error(`Failed to upload ${file.name}`);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath);

      uploadedAttachments.push({
        name: file.name,
        url: publicUrl,
        type: file.type,
        size: file.size,
        storage_path: filePath
      });
    }
    
    return uploadedAttachments;
  };

  const handleAddComment = async (text: string, isTicket: boolean, attachments: File[] | null, mentionedUserIds: string[], replyToId?: string | null) => {
    if (!user) return;

    let attachmentsJson = [];
    if (attachments && attachments.length > 0) {
      attachmentsJson = await uploadAttachments(attachments);
    }

    const { error } = await supabase
      .from('goal_comments')
      .insert({
        goal_id: goalId,
        user_id: user.id,
        comment_date: formattedDate,
        content: text.trim(),
        is_ticket: isTicket,
        reply_to_comment_id: replyToId || null,
        attachments_jsonb: attachmentsJson
      });

    if (error) {
      toast.error('Failed to post comment');
    } else {
      setReplyTo(null); // Clear reply state
      await fetchComments();
    }
  };

  const handleDeleteComment = async (comment: CommentType) => {
    if (comment.author.id !== user?.id) {
      toast.error("You can only delete your own comments");
      return;
    }

    const { error } = await supabase
      .from('goal_comments')
      .delete()
      .eq('id', comment.id);

    if (error) {
      toast.error('Failed to delete comment');
    } else {
      toast.success('Comment deleted');
      await fetchComments();
    }
  };

  const handleReaction = async (commentId: string, emoji: string) => {
    if (!user) return;

    // Check if reaction exists
    const existingReaction = comments
      .find(c => c.id === commentId)
      ?.reactions?.find(r => r.user_id === user.id && r.emoji === emoji);

    if (existingReaction) {
      // Remove reaction
      const { error } = await supabase
        .from('goal_comment_reactions')
        .delete()
        .eq('id', existingReaction.id);
        
      if (error) toast.error("Failed to remove reaction");
    } else {
      // Add reaction
      const { error } = await supabase
        .from('goal_comment_reactions')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          emoji: emoji
        });
        
      if (error) toast.error("Failed to add reaction");
    }
    
    // UI will update via realtime subscription
  };

  const handleReply = (comment: CommentType) => {
    setReplyTo(comment);
    commentInputRef.current?.focus();
    commentInputRef.current?.scrollIntoView();
  };

  const handleCreateTicket = async (comment: CommentType) => {
    const { error } = await supabase
      .from('goal_comments')
      .update({ is_ticket: true })
      .eq('id', comment.id);

    if (error) {
      toast.error("Failed to convert to ticket");
    } else {
      toast.success("Converted to ticket");
      // Ideally we would also create a task here, but for now we mark it visually
    }
  };

  const handleScrollToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-primary/5');
      setTimeout(() => element.classList.remove('bg-primary/5'), 2000);
    } else {
      toast.info("Message not found in this view");
    }
  };

  return (
    <div className="flex flex-col h-[500px] border-t bg-muted/10">
      <div className="p-3 border-b bg-background/50 backdrop-blur-sm flex justify-between items-center">
        <h4 className="text-sm font-semibold text-muted-foreground">Comments & Notes</h4>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
          {format(date, 'MMM d, yyyy')}
        </span>
      </div>

      <div className="flex-shrink-0 p-3 border-b bg-background">
        <CommentInput
          ref={commentInputRef}
          onAddCommentOrTicket={handleAddComment}
          allUsers={allUsers}
          storageKey={`goal-comment-${goalId}-${formattedDate}`}
          dropUp={false}
          placeholder="Add a note... (@ to mention)"
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {isFetching ? (
            <div className="flex justify-center items-center py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading notes...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-8 italic">
              No notes yet for this day. <br/> Add a reason for missing it, or a celebration for completing it!
            </div>
          ) : (
            [...comments].reverse().map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                isEditing={false}
                editedText=""
                setEditedText={() => {}}
                handleSaveEdit={() => {}}
                handleCancelEdit={() => {}}
                onEdit={() => toast.info("Editing coming soon")}
                onDelete={(c) => handleDeleteComment(c)}
                onToggleReaction={handleReaction}
                onReply={handleReply}
                onCreateTicketFromComment={handleCreateTicket}
                newAttachments={[]}
                removeNewAttachment={() => {}}
                handleEditFileChange={() => {}}
                editFileInputRef={{ current: null }}
                onGoToReply={handleScrollToMessage}
                allUsers={allUsers}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default GoalDayComments;