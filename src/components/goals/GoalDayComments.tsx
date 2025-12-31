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
  
  // Edit states
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState("");
  
  const commentInputRef = useRef<CommentInputHandle>(null);
  
  const formattedDate = format(date, 'yyyy-MM-dd');

  // Fetch users for mentions and mapping
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
      // Improved query using joins with aliases for cleaner data mapping
      const { data, error } = await supabase
        .from('goal_comments')
        .select(`
          *,
          author:profiles!goal_comments_user_id_fkey (
            id, first_name, last_name, email, avatar_url
          ),
          reactions:goal_comment_reactions (
            id, emoji, user_id,
            user:profiles (
              id, first_name, last_name, email
            )
          ),
          replied_comment:goal_comments!reply_to_comment_id (
            content,
            user_id,
            author:profiles!goal_comments_user_id_fkey (
              id, first_name, last_name, email
            )
          )
        `)
        .eq('goal_id', goalId)
        .eq('comment_date', formattedDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedComments: CommentType[] = (data || []).map((item: any) => {
        // Map Author
        const authorProfile = Array.isArray(item.author) ? item.author[0] : item.author;
        const author: User = authorProfile ? {
          id: authorProfile.id,
          name: `${authorProfile.first_name || ''} ${authorProfile.last_name || ''}`.trim() || authorProfile.email || 'Unknown',
          avatar_url: authorProfile.avatar_url,
          email: authorProfile.email,
          initials: getInitials(`${authorProfile.first_name || ''} ${authorProfile.last_name || ''}`.trim() || authorProfile.email || '')
        } : { id: item.user_id, name: 'Unknown', email: '', initials: '??' };

        // Map Reactions
        const reactions = (item.reactions || []).map((r: any) => {
          const reactorProfile = Array.isArray(r.user) ? r.user[0] : r.user;
          const reactorName = reactorProfile 
            ? `${reactorProfile.first_name || ''} ${reactorProfile.last_name || ''}`.trim() || reactorProfile.email 
            : 'Unknown';
            
          return {
            id: r.id,
            emoji: r.emoji,
            user_id: r.user_id,
            user_name: reactorName,
            profiles: reactorProfile ? {
                id: reactorProfile.id,
                first_name: reactorProfile.first_name,
                last_name: reactorProfile.last_name,
                email: reactorProfile.email
            } : undefined
          };
        });

        // Map Replied Message
        let repliedMessage = null;
        // Check if this comment is actually a reply (has reply_to_comment_id)
        if (item.reply_to_comment_id) {
            const repliedCommentRaw = Array.isArray(item.replied_comment) ? item.replied_comment[0] : item.replied_comment;

            if (repliedCommentRaw) {
              const replyAuthorProfile = Array.isArray(repliedCommentRaw.author) ? repliedCommentRaw.author[0] : repliedCommentRaw.author;
              
              const firstName = replyAuthorProfile?.first_name || '';
              const lastName = replyAuthorProfile?.last_name || '';
              const email = replyAuthorProfile?.email || '';
              
              const replyAuthorName = (firstName || lastName) 
                ? `${firstName} ${lastName}`.trim() 
                : (email || 'Unknown User');
              
              repliedMessage = {
                content: repliedCommentRaw.content,
                senderName: replyAuthorName,
                isDeleted: false
              };
            }
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
    
    const channel = supabase
      .channel('goal-comments-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goal_comments', filter: `goal_id=eq.${goalId}` }, () => fetchComments())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goal_comment_reactions' }, () => fetchComments())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [goalId, formattedDate]);

  const handleAddComment = async (text: string, isTicket: boolean, attachments: File[] | null, mentionedUserIds: string[], replyToId?: string | null) => {
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

    const parentCommentId = replyToId !== undefined ? replyToId : (replyingTo?.id || null);

    const { error } = await supabase
      .from('goal_comments')
      .insert({
        goal_id: goalId,
        user_id: user.id,
        comment_date: formattedDate,
        content: text.trim(),
        attachments_jsonb: uploadedAttachments,
        reply_to_comment_id: parentCommentId
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

    const currentComment = comments.find(c => c.id === commentId);
    const existingReaction = currentComment?.reactions?.find(r => r.user_id === user.id && r.emoji === emoji);

    if (existingReaction) {
      const { error } = await supabase
        .from('goal_comment_reactions')
        .delete()
        .eq('id', existingReaction.id);
      
      if (error) toast.error('Failed to remove reaction');
    } else {
      const { error } = await supabase
        .from('goal_comment_reactions')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          emoji: emoji
        });
      
      if (error) toast.error('Failed to add reaction');
    }
  };

  const handleReply = (comment: CommentType) => {
    const replyContext: CommentType = {
      ...comment,
      repliedMessage: null,
      reply_to_comment_id: null
    };
    
    setReplyingTo(replyContext);
    
    if (commentInputRef.current) {
      const mentionText = `@[${comment.author.name}](${comment.author.id}) `;
      commentInputRef.current.scrollIntoView();
      setTimeout(() => {
        if (commentInputRef.current) {
          commentInputRef.current.setText(mentionText, true);
          commentInputRef.current.focus();
        }
      }, 100);
    }
  };

  const handleCreateTicket = async (comment: CommentType) => {
    if (!user) return;
    
    try {
      const { data: projectId, error: projectError } = await supabase.rpc('get_personal_project_id');
      
      if (projectError || !projectId) {
        throw new Error('Could not find personal project');
      }

      const { error: taskError } = await supabase.from('tasks').insert({
        project_id: projectId,
        title: 'Ticket: ' + (comment.text ? (comment.text.length > 50 ? comment.text.substring(0, 50) + '...' : comment.text) : 'New Ticket'),
        description: `Source Goal Comment: ${window.location.origin}/goals\n\n${comment.text}`,
        origin_ticket_id: comment.id,
        created_by: user.id,
        status: 'To do',
        priority: 'Normal'
      });

      if (taskError) throw taskError;

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

  const handleGoToReply = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('bg-accent/20');
        setTimeout(() => element.classList.remove('bg-accent/20'), 2000);
    } else {
        toast.info("Original comment not found in current view");
    }
  };

  const handleEditComment = (comment: CommentType) => {
    setEditingCommentId(comment.id);
    setEditedText(comment.text || "");
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedText("");
  };

  const handleSaveEdit = async () => {
    if (!editingCommentId) return;

    const { error } = await supabase
      .from('goal_comments')
      .update({ content: editedText })
      .eq('id', editingCommentId);

    if (error) {
      toast.error("Failed to update comment");
    } else {
      toast.success("Comment updated");
      setEditingCommentId(null);
      setEditedText("");
      await fetchComments();
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
          dropUp={false} // Important: Set to false so suggestions drop down
          placeholder="Add a note... (@ to mention)"
          replyTo={replyingTo}
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
            comments.map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                isEditing={editingCommentId === comment.id}
                editedText={editedText}
                setEditedText={setEditedText}
                handleSaveEdit={handleSaveEdit}
                handleCancelEdit={handleCancelEdit}
                onEdit={handleEditComment}
                onDelete={(c) => handleDeleteComment(c)}
                onToggleReaction={handleReaction}
                onReply={handleReply}
                onCreateTicketFromComment={handleCreateTicket}
                newAttachments={[]}
                removeNewAttachment={() => {}}
                handleEditFileChange={() => {}}
                editFileInputRef={{ current: null }}
                onGoToReply={handleGoToReply}
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