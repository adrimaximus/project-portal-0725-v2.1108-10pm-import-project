"use client";

import React, { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, Ticket, File, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { dummyProjects } from '@/data/projects';
import { AssignedUser } from '@/data/types';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';

export type Comment = {
  id: number;
  projectId: string;
  user: {
    name: string;
    avatar: string;
  };
  text: string;
  timestamp: string;
  isTicket?: boolean;
  attachment?: {
    name: string;
    url: string;
    type: 'image' | 'file';
  };
};

interface ProjectCommentsProps {
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  projectId: string;
  taggableUsers: AssignedUser[];
}

const ProjectComments: React.FC<ProjectCommentsProps> = ({ comments, setComments, projectId, taggableUsers }) => {
  const [newComment, setNewComment] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [showMentionPopover, setShowMentionPopover] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(0);

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    setNewComment(text);

    const cursorPosition = event.target.selectionStart;
    const textBeforeCursor = text.slice(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setMentionStartIndex(mentionMatch.index || 0);
      setShowMentionPopover(true);
    } else {
      setShowMentionPopover(false);
    }
  };

  const handleMentionSelect = (user: AssignedUser) => {
    const text = newComment;
    const textAfterMention = text.slice(mentionStartIndex + 1 + mentionQuery.length);
    const newText = `${text.slice(0, mentionStartIndex)}@${user.name} ${textAfterMention}`;
    
    setNewComment(newText);
    setShowMentionPopover(false);

    setTimeout(() => {
      const newCursorPosition = mentionStartIndex + user.name.length + 2; // for '@' and space
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const handleSendComment = (isTicket = false) => {
    if (newComment.trim() === "" && !attachmentFile) return;

    const comment: Comment = {
      id: Date.now(),
      projectId: projectId,
      user: { name: "You", avatar: "https://i.pravatar.cc/150?u=currentuser" },
      text: newComment,
      timestamp: "Just now",
      isTicket: isTicket,
    };

    if (attachmentFile) {
      comment.attachment = {
        name: attachmentFile.name,
        url: URL.createObjectURL(attachmentFile),
        type: attachmentFile.type.startsWith('image/') ? 'image' : 'file',
      };
    }

    setComments(prev => [...prev, comment]);

    if (isTicket) {
      const projectIndex = dummyProjects.findIndex(p => p.id === projectId);
      if (projectIndex !== -1) {
        const currentTickets = dummyProjects[projectIndex].tickets || 0;
        dummyProjects[projectIndex].tickets = currentTickets + 1;
      }
    }

    setNewComment("");
    setAttachmentFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendTicket = () => handleSendComment(true);

  const renderTextWithMentions = (text: string) => {
    const taggableNames = taggableUsers.map(u => u.name);
    const regex = new RegExp(`@(${taggableNames.join('|')})`, 'g');
    
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (index % 2 === 1 && taggableNames.includes(part)) { // Matched mentions are at odd indices
        return <strong key={index} className="text-primary font-medium">@{part}</strong>;
      }
      return part;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments & Tickets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-4">
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={comment.user.avatar} />
                <AvatarFallback>{comment.user.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{comment.user.name}</p>
                    {comment.isTicket && <Badge variant="destructive">Ticket</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{comment.timestamp}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{renderTextWithMentions(comment.text)}</p>
                {comment.attachment && (
                  <div className="mt-2">
                    <a
                      href={comment.attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-md border p-2 text-sm text-muted-foreground transition-colors hover:bg-accent"
                    >
                      {comment.attachment.type === 'image' ? (
                        <img src={comment.attachment.url} alt={comment.attachment.name} className="h-10 w-10 rounded-md object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                          <File className="h-5 w-5" />
                        </div>
                      )}
                      <span>{comment.attachment.name}</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-6 border-t">
          <Popover open={showMentionPopover} onOpenChange={setShowMentionPopover}>
            <PopoverTrigger asChild>
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="Add a comment or create a ticket... Type '@' to mention a user."
                  value={newComment}
                  onChange={handleTextChange}
                  className="pr-36"
                />
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <input type="file" ref={fileInputRef} onChange={(e) => setAttachmentFile(e.target.files ? e.target.files[0] : null)} className="hidden" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={handleSendTicket}>
                      <Ticket className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="sm" onClick={() => handleSendComment(false)}>
                    Send
                  </Button>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <Command>
                <CommandInput placeholder="Mention user..." value={mentionQuery} onValueChange={setMentionQuery} />
                <CommandList>
                  <CommandEmpty>No user found.</CommandEmpty>
                  <CommandGroup>
                    {taggableUsers
                      .filter(user => user.name.toLowerCase().includes(mentionQuery.toLowerCase()))
                      .map(user => (
                      <CommandItem key={user.id} onSelect={() => handleMentionSelect(user)} value={user.name}>
                        <Avatar className="mr-2 h-6 w-6">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name.slice(0,2)}</AvatarFallback>
                        </Avatar>
                        {user.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {attachmentFile && (
            <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2 bg-muted p-2 rounded-md">
              <File className="h-4 w-4" />
              <span className="flex-1 truncate">{attachmentFile.name}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAttachmentFile(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectComments;