"use client";

import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, Ticket, File, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Project, AssignedUser, Comment } from '@/data/projects';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/UserContext';

interface ProjectCommentsProps {
  project: Project;
  onAddCommentOrTicket: (comment: Comment) => void;
  assignableUsers: AssignedUser[];
  allProjects: Project[];
}

const renderWithMentions = (text: string, allProjects: Project[]) => {
  const mentionRegex = /(@[a-zA-Z0-9\s._-]+|#\/[a-zA-Z0-9\s._-]+)/g;
  const parts = text.split(mentionRegex);

  return parts.map((part, index) => {
    if (part.match(mentionRegex)) {
      if (part.startsWith('@')) {
        return <strong key={index} className="text-primary font-medium">{part}</strong>;
      }
      if (part.startsWith('#/')) {
        const projectName = part.substring(2).trim();
        const project = allProjects.find(p => p.name === projectName);
        if (project) {
          return (
            <Link
              to={`/projects/${project.id}`}
              key={index}
              className="text-blue-600 font-semibold hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {projectName}
            </Link>
          );
        }
        return <strong key={index} className="text-blue-600 font-semibold">{projectName}</strong>;
      }
    }
    return part;
  });
};

const ProjectComments: React.FC<ProjectCommentsProps> = ({ project, onAddCommentOrTicket, assignableUsers, allProjects }) => {
  const { user: currentUser } = useUser();
  const [newComment, setNewComment] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  type SuggestionType = 'user' | 'project' | null;
  const [suggestionType, setSuggestionType] = useState<SuggestionType>(null);
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [triggerIndex, setTriggerIndex] = useState(0);

  const comments = project.comments || [];
  const tasks = project.tasks || [];

  const getTicketStatus = (commentId: string) => {
    const task = tasks.find(t => t.originTicketId === commentId);
    if (task && task.completed) {
      return 'Done';
    }
    return 'Ticket';
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    const cursorPosition = event.target.selectionStart;
    setNewComment(text);

    const textBeforeCursor = text.substring(0, cursorPosition);
    const triggerCharIndex = Math.max(textBeforeCursor.lastIndexOf('@'), textBeforeCursor.lastIndexOf('/'));

    if (triggerCharIndex === -1) {
      setSuggestionOpen(false);
      return;
    }
    
    const charBeforeTrigger = text.charAt(triggerCharIndex - 1);
    if (charBeforeTrigger && !/\s/.test(charBeforeTrigger)) {
        setSuggestionOpen(false);
        return;
    }

    const query = text.substring(triggerCharIndex + 1, cursorPosition);
    if (/\s/.test(query)) {
      setSuggestionOpen(false);
      return;
    }

    const triggerChar = text.charAt(triggerCharIndex);
    if (triggerChar === '@') {
      setSuggestionType('user');
      setSuggestionQuery(query);
      setTriggerIndex(triggerCharIndex);
      setSuggestionOpen(true);
    } else if (triggerChar === '/') {
      setSuggestionType('project');
      setSuggestionQuery(query);
      setTriggerIndex(triggerCharIndex);
      setSuggestionOpen(true);
    } else {
      setSuggestionOpen(false);
    }
  };

  const handleSuggestionSelect = (name: string) => {
    const prefix = newComment.substring(0, triggerIndex);
    const suffix = newComment.substring(triggerIndex + 1 + suggestionQuery.length);
    const mention = `${suggestionType === 'user' ? '@' : '#/'}${name} `;
    
    setNewComment(prefix + mention + suffix);
    setSuggestionOpen(false);
    
    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursorPos = (prefix + mention).length;
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleAttachmentClick = () => fileInputRef.current?.click();
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) setAttachmentFile(event.target.files[0]);
  };

  const handleSendComment = (isTicket = false) => {
    if (newComment.trim() === "" && !attachmentFile) return;

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      projectId: project.id,
      user: { 
        id: currentUser.id, 
        name: currentUser.name, 
        avatar: currentUser.avatar,
        initials: currentUser.name.slice(0, 2).toUpperCase(),
      },
      text: newComment,
      timestamp: new Date().toISOString(),
      isTicket: isTicket,
    };

    if (attachmentFile) {
      comment.attachment = {
        name: attachmentFile.name,
        url: URL.createObjectURL(attachmentFile),
      };
    }

    onAddCommentOrTicket(comment);

    setNewComment("");
    setAttachmentFile(null);
    setSuggestionOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendTicket = () => handleSendComment(true);

  const filteredUsers = assignableUsers.filter(u => u.name.toLowerCase().includes(suggestionQuery.toLowerCase()));
  const filteredProjects = allProjects.filter(p => p.id !== project.id && p.name.toLowerCase().includes(suggestionQuery.toLowerCase()));

  return (
    <Card>
      <CardHeader><CardTitle>Comments & Tickets</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-6">
          {comments.map((comment) => {
            const ticketStatus = getTicketStatus(comment.id);
            return (
              <div key={comment.id} className="flex items-start gap-4">
                <Avatar className="h-10 w-10 border"><AvatarImage src={comment.user.avatar} /><AvatarFallback>{comment.user.name.slice(0, 2)}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{comment.user.id === currentUser.id ? "You" : comment.user.name}</p>
                      {comment.isTicket && (
                        <Badge
                          variant={ticketStatus === 'Done' ? 'default' : 'destructive'}
                          className={cn(
                            ticketStatus === 'Done' && 'bg-green-500 hover:bg-green-600 text-white border-green-500'
                          )}
                        >
                          {ticketStatus}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(comment.timestamp).toLocaleString()}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{renderWithMentions(comment.text, allProjects)}</p>
                  {comment.attachment && (
                    <div className="mt-2">
                      <a href={comment.attachment.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md border p-2 text-sm text-muted-foreground transition-colors hover:bg-accent">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted"><File className="h-5 w-5" /></div>
                        <span>{comment.attachment.name}</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 pt-6 border-t">
          <div className="relative">
            <Textarea ref={textareaRef} placeholder="Add a comment or create a ticket... Type '@' to mention a user, '/' to link a project." value={newComment} onChange={handleTextChange} className="pr-36" />
            {suggestionOpen && (
              <Card className="absolute bottom-full mb-2 w-full max-h-60 overflow-y-auto shadow-lg border z-10">
                <Command>
                  <CommandList>
                    {suggestionType === 'user' && (
                      <CommandGroup heading="Mention Team Member">
                        {filteredUsers.length > 0 ? filteredUsers.map(user => <CommandItem key={user.id} value={user.name} onSelect={() => handleSuggestionSelect(user.name)} className="cursor-pointer flex items-center gap-2"><Avatar className="h-6 w-6"><AvatarImage src={user.avatar} /><AvatarFallback>{user.name.slice(0,1)}</AvatarFallback></Avatar>{user.name}</CommandItem>) : <CommandEmpty>No users found.</CommandEmpty>}
                      </CommandGroup>
                    )}
                    {suggestionType === 'project' && (
                      <CommandGroup heading="Link to Project">
                        {filteredProjects.length > 0 ? filteredProjects.map(project => <CommandItem key={project.id} value={project.name} onSelect={() => handleSuggestionSelect(project.name)} className="cursor-pointer">{project.name}</CommandItem>) : <CommandEmpty>No projects found.</CommandEmpty>}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </Card>
            )}
            <div className="absolute top-2 right-2 flex items-center gap-1">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              <Button type="button" variant="ghost" size="icon" onClick={handleAttachmentClick}><Paperclip className="h-4 w-4" /><span className="sr-only">Attach file</span></Button>
              <Button type="button" variant="ghost" size="icon" onClick={handleSendTicket}><Ticket className="h-4 w-4" /><span className="sr-only">Create ticket</span></Button>
              <Button type="button" size="sm" onClick={() => handleSendComment(false)}>Send</Button>
            </div>
          </div>
          {attachmentFile && (
            <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2 bg-muted p-2 rounded-md">
              <File className="h-4 w-4" /><span className="flex-1 truncate">{attachmentFile.name}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setAttachmentFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}><X className="h-4 w-4" /><span className="sr-only">Remove attachment</span></Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectComments;