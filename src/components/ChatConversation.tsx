import React, { useRef, useEffect, useState } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Paperclip, Send, Smile, X, Info } from 'lucide-react';
import { getAvatarUrl, generatePastelColor } from '@/lib/utils';
import { Message } from '@/types';
import MentionInput, { UserSuggestion, ProjectSuggestion } from './MentionInput';
import { useQuery } from '@tanstack/react-query';
import { searchUsers, searchProjects } from '@/lib/searchApi';
import { format } from 'date-fns';
import { Skeleton } from './ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const ChatConversation = () => {
  const { selectedConversation, messages, sendMessage, isLoadingMessages } = useChatContext();
  const { user: currentUser } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [userSuggestions, setUserSuggestions] = useState<UserSuggestion[]>([]);
  const [projectSuggestions, setProjectSuggestions] = useState<ProjectSuggestion[]>([]);
  const [mentionTrigger, setMentionTrigger] = useState<'@' | '/' | null>(null);
  const [mentionTerm, setMentionTerm] = useState('');

  const { data: searchedUsers } = useQuery({
    queryKey: ['user-search', mentionTerm],
    queryFn: () => searchUsers(mentionTerm),
    enabled: mentionTrigger === '@' && mentionTerm.length > 0,
  });

  const { data: searchedProjects } = useQuery({
    queryKey: ['project-search', mentionTerm],
    queryFn: () => searchProjects(mentionTerm),
    enabled: mentionTrigger === '/' && mentionTerm.length > 0,
  });

  useEffect(() => {
    if (searchedUsers) setUserSuggestions(searchedUsers);
  }, [searchedUsers]);

  useEffect(() => {
    if (searchedProjects) setProjectSuggestions(searchedProjects);
  }, [searchedProjects]);

  const handleMentionSearch = (trigger: '@' | '/' | null, term: string) => {
    setMentionTrigger(trigger);
    setMentionTerm(term);
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (!selectedConversation || !currentUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground bg-gray-50 dark:bg-gray-900/50 p-4">
        <img src="/placeholder-chat.svg" alt="Select a chat" className="w-48 h-48 mb-4" />
        <h2 className="text-xl font-semibold">Welcome to Chat</h2>
        <p>Select a conversation from the list to start messaging.</p>
      </div>
    );
  }

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;
    sendMessage(newMessage, null);
    setNewMessage('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const members = selectedConversation.members || [];
  const otherMembers = members.filter(m => m.id !== currentUser.id);
  const conversationName = selectedConversation.isGroup ? selectedConversation.groupName : otherMembers[0]?.name || 'Chat';
  const conversationAvatar = selectedConversation.isGroup ? selectedConversation.avatarUrl : otherMembers[0]?.avatar_url;
  const conversationAvatarId = selectedConversation.isGroup ? selectedConversation.id : otherMembers[0]?.id;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="p-3 border-b flex items-center justify-between space-x-3 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={getAvatarUrl(conversationAvatar, conversationAvatarId)} />
            <AvatarFallback style={generatePastelColor(conversationAvatarId || '')}>
              {conversationName?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{conversationName}</h2>
            <p className="text-xs text-muted-foreground">{selectedConversation.isGroup ? `${members.length} members` : 'Direct Message'}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <Info className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 relative">
        <div ref={scrollContainerRef} className="absolute inset-0 overflow-y-auto p-4 space-y-4">
          {isLoadingMessages ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-16 w-1/2 ml-auto" />
              <Skeleton className="h-8 w-2/3" />
            </div>
          ) : (
            messages.map((message) => {
              const isCurrentUser = message.sender.id === currentUser.id;
              const sender = members.find(m => m.id === message.sender.id) || message.sender;
              return (
                <div key={message.id} className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  {!isCurrentUser && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getAvatarUrl(sender.avatar_url, sender.id)} />
                      <AvatarFallback style={generatePastelColor(sender.id || '')}>{sender.initials}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-md lg:max-w-lg px-3 py-2 rounded-xl ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    {!isCurrentUser && <p className="text-xs font-semibold mb-1">{sender.name}</p>}
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <div className={`text-xs mt-1 ${isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{format(new Date(message.timestamp), 'p')}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{format(new Date(message.timestamp), 'PPpp')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {message.isOptimistic && <span className="ml-1">(sending...)</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="p-2 md:p-4 border-t bg-gray-50 dark:bg-gray-900/50 dark:border-gray-700">
        <div className="relative">
          <MentionInput
            ref={inputRef}
            value={newMessage}
            onChange={setNewMessage}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="pr-28 pl-10 bg-white dark:bg-gray-800"
            userSuggestions={userSuggestions}
            projectSuggestions={projectSuggestions}
            onSearchTermChange={handleMentionSearch}
          />
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center">
            <Button variant="ghost" size="icon"><Paperclip className="h-5 w-5 text-muted-foreground" /></Button>
          </div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
            <Button variant="ghost" size="icon"><Smile className="h-5 w-5 text-muted-foreground" /></Button>
            <Button onClick={handleSendMessage} size="icon" className="rounded-full">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatConversation;