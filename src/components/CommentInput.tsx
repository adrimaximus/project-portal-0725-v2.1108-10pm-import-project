import { useState, useRef } from 'react';
import { Project } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Paperclip, Ticket, Send, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getInitials, generatePastelColor, parseMentions, getAvatarUrl } from '@/lib/utils';
import { MentionsInput, Mention } from 'react-mentions';
import '@/styles/mentions.css';

interface CommentInputProps {
  project: Project;
  onAddCommentOrTicket: (text: string, isTicket: boolean, attachments: File[] | null, mentionedUserIds: string[]) => void;
}

const CommentInput = ({ project, onAddCommentOrTicket }: CommentInputProps) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [isTicket, setIsTicket] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setAttachments(prev => [...prev, ...Array.from(event.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!text.trim() && attachments.length === 0) return;
    const mentionedUserIds = parseMentions(text);
    onAddCommentOrTicket(text, isTicket, attachments, mentionedUserIds);
    setText('');
    setIsTicket(false);
    setAttachments([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!user) return null;
  
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;

  const mentionData = (project.assignedTo || []).map(member => ({
    id: member.id,
    display: member.name,
    ...member
  }));

  return (
    <div className="flex items-start space-x-4">
      <Avatar>
        <AvatarImage src={user.avatar_url} />
        <AvatarFallback style={generatePastelColor(user.id)}>
          {getInitials(fullName, user.email)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="border rounded-lg focus-within:ring-1 focus-within:ring-ring">
          <MentionsInput
            value={text}
            onChange={(event, newValue) => setText(newValue)}
            placeholder="Add a comment or create a ticket... Type @ to mention a team member."
            className="mentions-input"
            a11ySuggestionsListLabel={"Suggested mentions"}
          >
            <Mention
              trigger="@"
              data={mentionData}
              markup="@[__display__](__id__)"
              renderSuggestion={(suggestion, search, highlightedDisplay, index, focused) => (
                <div className={`mention-suggestion ${focused ? 'focused' : ''}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getAvatarUrl(suggestion.avatar_url, suggestion.id)} />
                    <AvatarFallback style={generatePastelColor(suggestion.id)}>
                      {suggestion.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="mention-suggestion-info">
                    <div className="font-medium">{highlightedDisplay}</div>
                    <div className="text-xs text-muted-foreground">{suggestion.email}</div>
                  </div>
                </div>
              )}
            />
          </MentionsInput>
          {attachments.length > 0 && (
            <div className="p-3 border-t">
              <p className="text-sm font-medium mb-2">Attachments</p>
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded-md">
                    <span className="truncate">{file.name}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAttachment(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="p-2 border-t flex justify-between items-center">
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Attach files</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <input
                type="file"
                ref={fileInputRef}
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setIsTicket(!isTicket)} className={isTicket ? 'bg-primary/10 text-primary' : ''}>
                      <Ticket className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isTicket ? 'Convert to comment' : 'Convert to ticket'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button onClick={handleSubmit} disabled={!text.trim() && attachments.length === 0}>
              {isTicket ? 'Create Ticket' : 'Comment'}
              <Send className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentInput;