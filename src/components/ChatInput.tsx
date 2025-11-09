import React, { useState, useEffect, useRef } from 'react';
import MentionInput, { UserSuggestion, ProjectSuggestion } from './MentionInput';
import { Button } from './ui/button';
import { Paperclip, Send, X, Check, CornerUpLeft, Pencil } from 'lucide-react';
import { useChatContext } from '@/contexts/ChatContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const ChatInput = () => {
  const [text, setText] = useState('');
  const { 
    sendMessage, 
    updateMessage,
    editingMessage, 
    setEditingMessage,
    replyingTo,
    setReplyingTo 
  } = useChatContext();
  const [userSuggestions, setUserSuggestions] = useState<UserSuggestion[]>([]);
  const [projectSuggestions, setProjectSuggestions] = useState<ProjectSuggestion[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text || editingMessage.content || '');
      setReplyingTo(null);
      textareaRef.current?.focus();
    }
  }, [editingMessage, setReplyingTo]);

  const handleSearchTermChange = async (trigger: '@' | '/' | null, term: string) => {
    if (trigger === '@') {
      const { data } = await supabase.from('profiles').select('id, first_name, last_name, avatar_url').limit(10);
      setUserSuggestions(data?.map(u => ({
        id: u.id,
        display: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        avatar_url: u.avatar_url,
        initials: `${(u.first_name || ' ')[0]}${(u.last_name || ' ')[0]}`
      })) || []);
    } else if (trigger === '/') {
      const { data } = await supabase.rpc('search_projects', { p_search_term: term }).limit(5);
      setProjectSuggestions(data?.map(p => ({
        id: p.id,
        display: p.name,
        slug: p.slug,
      })) || []);
    }
  };

  const handleSend = () => {
    if (text.trim() === '') return;
    if (editingMessage) {
      updateMessage(editingMessage.id, text);
    } else {
      sendMessage(text);
    }
    setText('');
  };

  const handleCancel = () => {
    if (editingMessage) {
      setEditingMessage(null);
    }
    if (replyingTo) {
      setReplyingTo(null);
    }
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const messageToPreview = editingMessage || replyingTo;
  const isEditing = !!editingMessage;

  return (
    <div className="p-4 border-t bg-background">
      {messageToPreview && (
        <div className="flex items-center justify-between bg-muted p-2 rounded-t-md border-b">
          <div className="flex items-center gap-2 text-sm overflow-hidden">
            {isEditing ? <Pencil className="h-4 w-4 flex-shrink-0" /> : <CornerUpLeft className="h-4 w-4 flex-shrink-0" />}
            <div className="flex-1 overflow-hidden">
              <p className="font-semibold truncate">{isEditing ? 'Edit Message' : `Reply to ${messageToPreview.sender.name}`}</p>
              <p className="text-xs text-muted-foreground truncate">{messageToPreview.text || messageToPreview.content || 'Attachment'}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Paperclip className="h-5 w-5" />
        </Button>
        <MentionInput
          ref={textareaRef}
          value={text}
          onChange={setText}
          onKeyDown={handleKeyDown}
          userSuggestions={userSuggestions}
          projectSuggestions={projectSuggestions}
          onSearchTermChange={handleSearchTermChange}
          placeholder="Type a message..."
          className={cn("flex-1 resize-none", messageToPreview ? "rounded-t-none" : "")}
        />
        <Button 
          size="icon" 
          onClick={handleSend} 
          className={cn("rounded-full h-9 w-9", isEditing && "bg-green-500 hover:bg-green-600")}
        >
          {isEditing ? <Check className="h-5 w-5" /> : <Send className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;