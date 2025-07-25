"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, X } from "lucide-react";

// Dummy data for initial comments
const initialComments = [
  {
    id: 1,
    user: {
      name: "Sophia Davis",
      avatar: "https://i.pravatar.cc/150?u=sophia",
    },
    text: "Great progress on the mockups! Just one suggestion: can we try a different color palette for the main CTA button?",
    timestamp: "2 days ago",
  },
  {
    id: 2,
    user: {
      name: "Liam Brown",
      avatar: "https://i.pravatar.cc/150?u=liam",
    },
    text: "Sure, I'll prepare a few alternatives. I've also attached the latest wireframes for the user dashboard.",
    timestamp: "1 day ago",
  },
];

const ProjectComments = () => {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveAttachment = () => {
    setAttachedFile(null);
    if(fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() === "" && !attachedFile) return;

    let commentText = newComment;
    if (attachedFile) {
      commentText += `\n\n📎 Attached: ${attachedFile.name}`;
    }

    const newCommentObject = {
      id: comments.length + 1,
      user: {
        name: "You",
        avatar: "https://i.pravatar.cc/150?u=currentuser",
      },
      text: commentText,
      timestamp: "Just now",
    };

    setComments([...comments, newCommentObject]);
    setNewComment("");
    handleRemoveAttachment();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* List of comments */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-4">
                <Avatar className="h-9 w-9 border">
                  <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
                  <AvatarFallback>
                    {comment.user.name === "You" ? "ME" : comment.user.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="grid gap-1.5 w-full">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{comment.user.name}</p>
                    <p className="text-xs text-muted-foreground">{comment.timestamp}</p>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Comment input form */}
          <form onSubmit={handleSendComment} className="flex w-full items-start space-x-4 pt-6 border-t">
             <Avatar className="h-9 w-9 border">
                <AvatarImage src="https://i.pravatar.cc/150?u=currentuser" alt="You" />
                <AvatarFallback>ME</AvatarFallback>
            </Avatar>
            <div className="w-full">
              <div className="relative">
                  <Textarea 
                    placeholder="Type your comment here..." 
                    className="min-h-[60px] pr-28"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <div className="absolute top-3 right-2 flex items-center">
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                      <Button type="button" variant="ghost" size="icon" onClick={handleAttachClick}>
                          <Paperclip className="h-4 w-4" />
                          <span className="sr-only">Attach file</span>
                      </Button>
                      <Button type="submit" size="icon">
                          <Send className="h-4 w-4" />
                          <span className="sr-only">Send</span>
                      </Button>
                  </div>
              </div>
              {attachedFile && (
                <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground bg-muted p-2 rounded-md">
                  <span className="truncate pr-2">{attachedFile.name}</span>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={handleRemoveAttachment}>
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove attachment</span>
                  </Button>
                </div>
              )}
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectComments;