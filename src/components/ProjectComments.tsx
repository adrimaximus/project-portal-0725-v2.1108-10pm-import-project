"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send } from "lucide-react";

// Dummy data for comments
const comments = [
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
                    {comment.user.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="grid gap-1.5 w-full">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{comment.user.name}</p>
                    <p className="text-xs text-muted-foreground">{comment.timestamp}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Comment input form */}
          <div className="flex w-full items-start space-x-4 pt-6 border-t">
             <Avatar className="h-9 w-9 border">
                <AvatarImage src="https://i.pravatar.cc/150?u=currentuser" alt="You" />
                <AvatarFallback>ME</AvatarFallback>
            </Avatar>
            <div className="relative w-full">
                <Textarea placeholder="Type your comment here..." className="min-h-[60px] pr-28"/>
                <div className="absolute top-3 right-2 flex items-center">
                    <Button type="button" variant="ghost" size="icon">
                        <Paperclip className="h-4 w-4" />
                        <span className="sr-only">Attach file</span>
                    </Button>
                    <Button type="submit" size="icon">
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send</span>
                    </Button>
                </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectComments;