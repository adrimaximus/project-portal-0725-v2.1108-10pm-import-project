"use client";

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, Ticket } from "lucide-react";
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

  const handleSendComment = (isTicket = false) => {
    if (newComment.trim() === "") return;

    const comment: Comment = {
      id: Date.now(),
      projectId: projectId,
      user: { name: "You", avatar: "https://i.pravatar.cc/150?u=currentuser" },
      text: newComment,
      timestamp: "Just now",
      isTicket: isTicket,
    };

    setComments(prev => [...prev, comment]);
    setNewComment("");
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
              <Button type="button" variant="ghost" size="icon">
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
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectComments;