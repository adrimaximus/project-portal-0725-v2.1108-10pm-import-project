import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import { Loader2, MessageSquare, FileText, AlertCircle, Trophy, MoreHorizontal, Trash2, Edit, Paperclip, Reply } from 'lucide-react';
import { toast } from 'sonner';
import CommentInput, { CommentInputHandle } from '@/components/CommentInput';
import { User, Comment as CommentType } from '@/types';
import { getInitials, cn, getAvatarUrl, generatePastelColor } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { MentionsInput, Mention } from 'react-mentions';
import '@/styles/mentions.css';

interface GoalDayCommentsProps {
  goalId: string;
  date: Date;
}

const feedbackTypes = [
    { id: 'comment', label: 'Comment', icon: MessageSquare, color: 'text-muted-foreground bg-muted/50 border-transparent ring-1 ring-border' },
    { id: 'report', label: 'Update', icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-200 ring-1 ring-blue-200' },
    { id: 'issue', label: 'Issue', icon: AlertCircle, color: 'text-red-600 bg-red-50 border-red-200 ring-1 ring-red-200' },
    { id: 'celebration', label: 'Celebration', icon: Trophy, color: 'text-amber-600 bg-amber-50 border-amber-200 ring-1 ring-amber-200' },
] as const;

const GoalDayComments = ({ goalId, date }: GoalDayCommentsProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [replyingTo, setReplyingTo] = useState<CommentType | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<CommentType | null>(null);
  const [feedbackType, setFeedbackType] = useState<'comment' | 'report' | 'issue' | 'celebration'>('comment');
  
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
        const authorProfile = Array.isArray(item.author) ? item.author[0] : item.author;
        const author: User = authorProfile ? {
          id: authorProfile.id,
          name: `${authorProfile.first_name || ''} ${authorProfile.last_name || ''}`.trim() || authorProfile.email || 'Unknown',
          avatar_url: authorProfile.avatar_url,
          email: authorProfile.email,
          initials: getInitials(`${authorProfile.first_name || ''} ${authorProfile.last_name || ''}`.trim() || authorProfile.email || '')
        } : { id: item.user_id, name: 'Unknown', email: '', initials: '??' };

        const reactions = (item.reactions || []).map((r: any) => {
          const reactorProfile = Array.isArray(r.user) ? r.user[0] : r.user;
          return {
            id: r.id,
            emoji: r.emoji,
            user_id: r.user_id,
            user_name: reactorProfile ? `${reactorProfile.first_name || ''} ${reactorProfile.last_name || ''}`.trim() || reactorProfile.email : 'Unknown',
            profiles: reactorProfile ? {
                id: reactorProfile.id,
                first_name: reactorProfile.first_name,
                last_name: reactorProfile.last_name,
                email: reactorProfile.email
            } : undefined
          };
        });

        let repliedMessage = null;
        if (item.reply_to_comment_id) {
            const repliedCommentRaw = Array.isArray(item.replied_comment) ? item.replied_comment[0] : item.replied_comment;

            if (repliedCommentRaw) {
              const replyAuthorProfile = Array.isArray(repliedCommentRaw.author) ? repliedCommentRaw.author[0] : repliedCommentRaw.author;
              const replyAuthorName = replyAuthorProfile
                 ? `${replyAuthorProfile.first_name || ''} ${replyAuthorProfile.last_name || ''}`.trim() || replyAuthorProfile.email
                 : 'Unknown User';
              
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

    let finalContent = text.trim();
    if (!replyToId && feedbackType !== 'comment') {
        const typeLabel = feedbackTypes.find(t => t.id === feedbackType)?.label;
        finalContent = `**[${typeLabel}]** ${finalContent}`;
    }

    let uploadedAttachments: any[] = [];
    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
          const filePath = `comments/${goalId}/${fileName}`;
          const { error: uploadError } = await supabase.storage.from('goal_attachments').upload(filePath, file);
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = supabase.storage.from('goal_attachments').getPublicUrl(filePath);
          uploadedAttachments.push({
            type: file.type.startsWith('image/') ? 'image' : 'file',
            url: publicUrl,
            name: file.name,
            size: file.size
          });
        } catch (error) {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
    }

    const parentCommentId = replyToId !== undefined ? replyToId : (replyingTo?.id || null);

    const { error } = await supabase.from('goal_comments').insert({
      goal_id: goalId,
      user_id: user.id,
      comment_date: formattedDate,
      content: finalContent,
      attachments_jsonb: uploadedAttachments,
      reply_to_comment_id: parentCommentId
    });

    if (error) {
      toast.error('Failed to post comment');
    } else {
      await fetchComments();
      setReplyingTo(null);
      setFeedbackType('comment');
      if (commentInputRef.current) {
        commentInputRef.current.setText('');
      }
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete || !user) return;
    if (commentToDelete.author.id !== user.id) {
      toast.error("You can only delete your own comments");
      setCommentToDelete(null);
      return;
    }

    const { error } = await supabase.from('goal_comments').delete().eq('id', commentToDelete.id);
    if (error) {
      toast.error('Failed to delete comment');
    } else {
      toast.success('Comment deleted');
      await fetchComments();
    }
    setCommentToDelete(null);
  };

  const handleReply = (comment: CommentType) => {
    setReplyingTo(comment);
    
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
    const { error } = await supabase.from('goal_comments').update({ content: editedText }).eq('id', editingCommentId);
    if (error) {
      toast.error("Failed to update comment");
    } else {
      toast.success("Comment updated");
      setEditingCommentId(null);
      setEditedText("");
      await fetchComments();
    }
  };

  // Helper to parse feedback type and content
  const parseFeedback = (text: string) => {
    const match = text?.match(/^\*\*\[(Comment|Update|Issue|Celebration)\]\*\*\s*(.*)/s);
    if (match) {
        const typeLabel = match[1];
        const cleanContent = match[2];
        const type = feedbackTypes.find(t => t.label === typeLabel) || feedbackTypes[0];
        return { type, content: cleanContent };
    }
    return { type: feedbackTypes[0], content: text };
  };

  return (
    <div className="flex flex-col h-[450px] border-t bg-muted/10">
      <div className="p-3 border-b bg-background/50 backdrop-blur-sm flex justify-between items-center">
        <h4 className="text-sm font-semibold text-muted-foreground">Comments & Notes</h4>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
          {format(date, 'MMM d, yyyy')}
        </span>
      </div>

      <div className="flex-shrink-0 border-b bg-background flex flex-col gap-2 p-3">
        {!replyingTo && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {feedbackTypes.map((type) => (
                    <button
                        key={type.id}
                        onClick={() => setFeedbackType(type.id as any)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
                            feedbackType === type.id 
                                ? type.color
                                : "bg-background border-border text-muted-foreground hover:bg-muted"
                        )}
                    >
                        <type.icon className="w-3.5 h-3.5" />
                        {type.label}
                    </button>
                ))}
            </div>
        )}
        <CommentInput
          ref={commentInputRef}
          onAddCommentOrTicket={handleAddComment}
          allUsers={allUsers}
          storageKey={`goal-comment-${goalId}-${formattedDate}`}
          dropUp={false}
          placeholder={
              feedbackType === 'report' ? "Share your progress update..." :
              feedbackType === 'issue' ? "What's blocking you?" :
              feedbackType === 'celebration' ? "Share the win!" :
              "Add a note... (@ to mention)"
          }
          replyTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
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
            comments.map((comment) => {
              const { type: feedbackTypeObj, content: displayContent } = parseFeedback(comment.text || '');
              const author = comment.author as User;
              const isOwner = user?.id === author.id;
              const Icon = feedbackTypeObj.icon;

              return (
                <div key={comment.id} className={cn("group relative flex gap-3 rounded-lg p-3 border shadow-sm transition-all hover:shadow-md", feedbackTypeObj.color.replace('text-', ''))}>
                  <Avatar className="h-8 w-8 flex-shrink-0 border bg-background">
                    <AvatarImage src={getAvatarUrl(author.avatar_url, author.id)} />
                    <AvatarFallback style={generatePastelColor(author.id)}>
                        {getInitials(author.name, author.email)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{author.name}</span>
                            <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleReply(comment)}>
                                <Reply className="h-3.5 w-3.5" />
                            </Button>
                            {isOwner && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                            <MoreHorizontal className="h-3.5 w-3.5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEditComment(comment)}>
                                            <Edit className="h-3.5 w-3.5 mr-2" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setCommentToDelete(comment)} className="text-destructive">
                                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>

                    {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                            <MentionsInput
                                value={editedText}
                                onChange={(e, newValue) => setEditedText(newValue)}
                                className="mentions-input min-h-[60px] text-sm bg-background border rounded-md p-2"
                                placeholder="Edit your comment..."
                            >
                                <Mention
                                    trigger="@"
                                    data={allUsers.map(u => ({ id: u.id, display: u.name }))}
                                    markup="@[__display__](__id__)"
                                />
                            </MentionsInput>
                            <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
                                <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {comment.repliedMessage && (
                                <div className="mb-2 pl-3 py-1 border-l-2 border-primary/30 bg-background/50 rounded-r text-xs text-muted-foreground">
                                    <div className="font-medium flex items-center gap-1">
                                        <Reply className="h-3 w-3" />
                                        Replying to {comment.repliedMessage.senderName}
                                    </div>
                                    <div className="line-clamp-1 opacity-80">{comment.repliedMessage.content}</div>
                                </div>
                            )}
                            <div className="text-sm leading-relaxed text-foreground/90">
                                <div className="flex items-start gap-2">
                                    <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0 opacity-70", feedbackTypeObj.id !== 'comment' ? "text-current" : "hidden")} />
                                    <div className="flex-1">
                                        <MarkdownRenderer>{displayContent}</MarkdownRenderer>
                                    </div>
                                </div>
                            </div>
                            {comment.attachments_jsonb && Array.isArray(comment.attachments_jsonb) && comment.attachments_jsonb.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {comment.attachments_jsonb.map((file: any, idx: number) => (
                                        <a 
                                            key={idx} 
                                            href={file.url} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="flex items-center gap-1.5 px-2 py-1 bg-background border rounded text-xs text-muted-foreground hover:bg-muted transition-colors"
                                        >
                                            <Paperclip className="h-3 w-3" />
                                            <span className="truncate max-w-[150px]">{file.name}</span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <AlertDialog open={!!commentToDelete} onOpenChange={() => setCommentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the comment. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleDeleteComment}>Delete</AlertDialogAction>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GoalDayComments;