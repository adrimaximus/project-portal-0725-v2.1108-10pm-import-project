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
  const commentInputRef = useRef<CommentInputHandle>(null);
  
  // Use local date formatting to match the calendar day exactly
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
          profiles (
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('goal_id', goalId)
        .eq('comment_date', formattedDate)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform goal comments to match CommentType
      const transformedComments: CommentType[] = (data || []).map((item: any) => ({
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
        reactions: [], 
        attachments_jsonb: item.attachments_jsonb || [],
        is_ticket: false
      }));

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
      .channel('goal-comments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goal_comments',
          filter: `goal_id=eq.${goalId}`, 
        },
        () => {
          fetchComments();
        }
      )
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
        attachments_jsonb: uploadedAttachments
      });

    if (error) {
      toast.error('Failed to post comment');
    } else {
      await fetchComments();
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

  const handleReaction = (id: string, emoji: string) => {
    toast.info("Reactions coming soon for goals!");
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
                onReply={() => {}}
                onCreateTicketFromComment={() => {}}
                newAttachments={[]}
                removeNewAttachment={() => {}}
                handleEditFileChange={() => {}}
                editFileInputRef={{ current: null }}
                onGoToReply={() => {}}
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