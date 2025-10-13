import { useState, useRef } from 'react';
import { Project } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Paperclip, Ticket, Send, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getInitials, generatePastelColor, parseMentions } from '@/lib/utils';

interface CommentInputProps {
  project: Project;
  onAddCommentOrTicket: (text: string, isTicket: boolean, attachments: File[] | null, mentionedUserIds: string[]) => void;
}

const CommentInput = ({ onAddCommentOrTicket }: CommentInputProps) => {
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
          <Textarea
            placeholder="Add a comment or create a ticket..."
            className="w-full border-0 resize-none focus-visible:ring-0 shadow-none p-3"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
          />
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