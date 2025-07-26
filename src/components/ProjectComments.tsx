"use client";

import React, { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, Ticket, File, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

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
}

const ProjectComments: React.FC<ProjectCommentsProps> = ({ comments, setComments, projectId }) => {
  const [newComment, setNewComment] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setAttachmentFile(event.target.files[0]);
    }
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
    setNewComment("");
    setAttachmentFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendTicket = () => handleSendComment(true);

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
                <p className="text-sm text-muted-foreground mt-1">{comment.text}</p>
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
          <div className="relative">
            <Textarea
              placeholder="Add a comment or create a ticket..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="pr-36"
            />
            <div className="absolute top-2 right-2 flex items-center gap-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <Button type="button" variant="ghost" size="icon" onClick={handleAttachmentClick}>
                <Paperclip className="h-4 w-4" />
                <span className="sr-only">Attach file</span>
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={handleSendTicket}>
                  <Ticket className="h-4 w-4" />
                  <span className="sr-only">Create ticket</span>
              </Button>
              <Button type="button" size="sm" onClick={() => handleSendComment(false)}>
                Send
              </Button>
            </div>
          </div>
          {attachmentFile && (
            <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2 bg-muted p-2 rounded-md">
              <File className="h-4 w-4" />
              <span className="flex-1 truncate">{attachmentFile.name}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => {
                  setAttachmentFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove attachment</span>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectComments;