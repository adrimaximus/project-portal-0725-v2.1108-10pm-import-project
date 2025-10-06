import { useState, useMemo } from 'react';
import { MentionsInput, Mention } from 'react-mentions';
import { Button } from './ui/button';
import { Paperclip, Send } from 'lucide-react';
import { Project, UserProfile } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface CommentInputProps {
  project: Project;
  onCommentAdded: () => void;
}

const CommentInput = ({ project, onCommentAdded }: CommentInputProps) => {
  const [comment, setComment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mentionableUsers = useMemo(() => {
    if (!project.created_by || !project.assignedTo) return [];
    const users: (UserProfile | string)[] = [project.created_by, ...project.assignedTo];
    const uniqueUsers = Array.from(new Map(users.map(u => typeof u === 'object' ? [u.id, u] : [u,u])).values()).filter(u => typeof u === 'object') as UserProfile[];
    return uniqueUsers.map(u => {
      return {
        id: u.id,
        display: u.name,
        avatar_url: u.avatar_url,
        initials: u.initials,
        email: u.email,
      };
    });
  }, [project.created_by, project.assignedTo]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!comment.trim() && !file) return;
    setIsSubmitting(true);

    let attachmentUrl: string | undefined = undefined;
    let attachmentName: string | undefined = undefined;

    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `public/project-comments/${project.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from('brief-files').upload(filePath, file);

      if (uploadError) {
        toast.error('Failed to upload file.', { description: uploadError.message });
        setIsSubmitting(false);
        return;
      }

      const { data } = supabase.storage.from('brief-files').getPublicUrl(filePath);
      attachmentUrl = data.publicUrl;
      attachmentName = file.name;
    }

    const { error } = await supabase.from('comments').insert({
      project_id: project.id,
      text: comment,
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
    });

    if (error) {
      toast.error('Failed to add comment.', { description: error.message });
    } else {
      setComment('');
      setFile(null);
      onCommentAdded();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="relative">
      <MentionsInput
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment... @ to mention"
        className="mentions"
        classNames={{
          control: 'mentions__control',
          input: 'mentions__input',
          suggestions: 'mentions__suggestions',
        }}
      >
        <Mention
          trigger="@"
          data={mentionableUsers}
          renderSuggestion={(suggestion, search, highlightedDisplay, index, focused) => (
            <div className={`user-suggestion ${focused ? 'focused' : ''}`}>
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage src={getAvatarUrl(suggestion.avatar_url, suggestion.id as string)} />
                <AvatarFallback style={generatePastelColor(suggestion.id as string)}>{suggestion.initials}</AvatarFallback>
              </Avatar>
              <span>{highlightedDisplay}</span>
              <span className="text-xs text-muted-foreground ml-2">{suggestion.email}</span>
            </div>
          )}
          displayTransform={(id, display) => `@${display}`}
        />
      </MentionsInput>
      <div className="absolute bottom-2 right-2 flex items-center gap-2">
        <label htmlFor="file-upload" className="cursor-pointer">
          <Paperclip className="h-5 w-5 text-muted-foreground hover:text-primary" />
          <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
        </label>
        <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : <Send className="h-4 w-4" />}
        </Button>
      </div>
      {file && <p className="text-xs text-muted-foreground mt-1">Selected file: {file.name}</p>}
    </div>
  );
};

export default CommentInput;