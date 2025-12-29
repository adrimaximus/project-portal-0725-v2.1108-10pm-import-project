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
  const [replyingTo, setReplyingTo] = useState<CommentType | null>(null);
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
      // Fetch comments with author profile, reactions, and parent comment info
      const { data, error } = await supabase
        .from('goal_comments')
        .select(`
          *,
          profiles!user_id (
            id, first_name, last_name, email, avatar_url
          ),
          goal_comment_reactions (
            id, emoji, user_id, 
            profiles (id, first_name, last_name, email)
          ),
          replied_comment:goal_comments!reply_to_comment_id (
            content,
            profiles!user_id (first_name, last_name, email)
          )
        `)
        .eq('goal_id', goalId)
        .eq('comment_date', formattedDate)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const transformedComments: CommentType[] = (data || []).map((item: any) => {
        // Map Author
        const author: User = {
          id: item.user_id,
          name: `${item.profiles?.first_name || ''} ${item.profiles?.last_name || ''}`.trim() || item.profiles?.email || 'Unknown',
          avatar_url: item.profiles?.avatar_url,
          email: item.profiles?.email,
          initials: getInitials(`${item.profiles?.first_name || ''} ${item.profiles?.last_name || ''}`.trim() || item.profiles?.email || '')
        };

        // Map Reactions
        const reactions = (item.goal_comment_reactions || []).map((r: any) => ({
          id: r.id,
          emoji: r.emoji,
          user_id: r.user_id,
          user_name: `${r.profiles?.first_name || ''} ${r.profiles?.last_name || ''}`.trim() || r.profiles?.email || 'Unknown',
          profiles: r.profiles
        }));

        // Map Replied Message
        let repliedMessage = null;
        if (item.replied_comment) {
          const replyAuthorName = `${item.replied_comment.profiles?.first_name || ''} ${item.replied_comment.profiles?.last_name || ''}`.trim() || item.replied_comment.profiles?.email || 'Unknown';
          repliedMessage = {
            content: item.replied_comment.content,
            senderName: replyAuthorName,
            isDeleted: false // Simplification
          };
        }

        return {
          id: item.id,
          text: item.content,
          created_at: item.created_at,
          author,
          reactions,
          attachments_jsonb: item.attachments_jsonb || [],
          is_ticket: item.is_ticket,
          reply_to_comment_id: item.reply_to_comment_id,
          repliedMessage
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
    
    // Subscribe to changes
    const channel = supabase
      .channel('goal-comments-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goal_comments', filter: `goal_id=eq.${goalId}` }, () => fetchComments())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goal_comment_reactions' }, () => fetchComments())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [goalId, formattedDate]);

  const handleAddComment = async (text: string, isTicket: boolean, attachments: File[] | null, mentionedUserIds: string[]) => {
    if (!user) return;

    let uploadedAttachments: any[] = [];

    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
          const filePath = `comments/${goalId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('goal_attachments')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('goal_attachments')
            .getPublicUrl(filePath);

          uploadedAttachments.push({
            type: file.type.startsWith('image/') ? 'image' : 'file',
            url: publicUrl,
            name: file.name,
            size: file.size
          });
        } catch (error) {
          console.error('Error uploading file:', error);
          toast.error(`Failed to upload ${file.name}`);
        }
      }
    }

    const { error } = await supabase
      .from('goal_comments')
      .insert({
        goal_id: goalId,
        user_id: user.id,
        comment_date: formattedDate,
        content: text.trim(),
        attachments_jsonb: uploadedAttachments,
        reply_to_comment_id: replyingTo?.id || null
      });

    if (error) {
      toast.error('Failed to post comment');
    } else {
      await fetchComments();
      setReplyingTo(null);
      if (commentInputRef.current) {
        commentInputRef.current.setText('');
      }
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
    const currentComment = comments.find(c => c.id === commentId);
    const existingReaction = currentComment?.reactions?.find(r => r.user_id === user.id && r.emoji === emoji);

    if (existingReaction) {
      // Remove reaction
      const { error } = await supabase
        .from('goal_comment_reactions')
        .delete()
        .eq('id', existingReaction.id);
      
      if (error) toast.error('Failed to remove reaction');
    } else {
      // Add reaction
      const { error } = await supabase
        .from('goal_comment_reactions')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          emoji: emoji
        });
      
      if (error) toast.error('Failed to add reaction');
    }
    // Realtime will update the UI
  };

  const handleReply = (comment: CommentType) => {
    setReplyingTo(comment);
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  const handleCreateTicket = async (comment: CommentType) => {
    if (!user) return;
    
    try {
      // 1. Get User's Personal Project ID
      const { data: projectId, error: projectError } = await supabase.rpc('get_personal_project_id');
      
      if (projectError || !projectId) {
        throw new Error('Could not find personal project');
      }

      // 2. Create Task in Personal Project
      const { error: taskError } = await supabase.from('tasks').insert({
        project_id: projectId,
        title: 'Ticket: ' + (comment.text.length > 50 ? comment.text.substring(0, 50) + '...' : comment.text),
        description: `Source Goal Comment: ${window.location.origin}/goals\n\n${comment.text}`,
        origin_ticket_id: comment.id, // Store reference to goal comment
        created_by: user.id,
        status: 'To do',
        priority: 'Normal'
      });

      if (taskError) throw taskError;

      // 3. Mark comment as ticket
      const { error: updateError } = await supabase
        .from('goal_comments')
        .update({ is_ticket: true })
        .eq('id', comment.id);

      if (updateError) throw updateError;

      toast.success('Ticket created in your personal project');
      await fetchComments();

    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    }
  };

  return (
    <div className="flex flex-col h-[450px] border-t bg-muted/10">
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
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
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
                onGoToReply={() => {}} // Could implement scroll to reply if needed
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