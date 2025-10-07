import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Send, Loader2 } from 'lucide-react';
import { getAvatarUrl, getInitials } from '@/lib/utils';
import MentionInput from './MentionInput';

interface ProjectCommentsProps {
  projectId: string;
}

const useProjectMembers = (projectId: string) => {
  return useQuery({
    queryKey: ['projectMembers', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_members')
        .select('profiles(*)')
        .eq('project_id', projectId);
      if (error) throw error;
      return data.map(m => m.profiles);
    },
  });
};

const useProjectComments = (projectId: string) => {
  const { data: members } = useProjectMembers(projectId);

  return useQuery({
    queryKey: ['comments', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*, author:author_id(*)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!members,
  });
};

const ProjectComments = ({ projectId }: ProjectCommentsProps) => {
  const { user } = useAuth();
  const { data: comments, isLoading: isLoadingComments } = useProjectComments(projectId);
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  const { mutate: addComment, isPending: isAddingComment } = useMutation({
    mutationFn: async (text: string) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('comments')
        .insert([{ project_id: projectId, author_id: user.id, text }])
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['comments', projectId] });
    },
  });

  const handleSendComment = () => {
    if (newComment.trim()) {
      addComment(newComment.trim());
    }
  };

  if (isLoadingComments) {
    return <div className="flex justify-center items-center h-32"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-start gap-4 mb-4">
        <Avatar>
          <AvatarImage src={getAvatarUrl(user)} />
          <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <MentionInput
            value={newComment}
            onChange={setNewComment}
            placeholder="Add a comment... @ to mention"
            onSend={handleSendComment}
          />
          <Button onClick={handleSendComment} disabled={isAddingComment || !newComment.trim()} className="mt-2">
            {isAddingComment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        {comments?.map(c => (
          <div key={c.id} className="flex items-start gap-4">
            <Avatar>
              <AvatarImage src={getAvatarUrl(c.author)} />
              <AvatarFallback>{c.author.initials}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{c.author.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm">{c.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectComments;