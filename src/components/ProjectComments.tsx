import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ChatInput from "@/components/ChatInput";
import { currentUser, collaborators } from "@/data/collaborators";
import { Paperclip } from "lucide-react";

export interface Comment {
  id: number;
  user: {
    name: string;
    avatar: string;
  };
  text: string;
  timestamp: string;
  attachment?: {
    name: string;
    url: string;
    type: 'image' | 'file';
  };
  isTicket?: boolean;
}

interface ProjectCommentsProps {
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
}

const renderMessageWithMentions = (text: string) => {
  const collaboratorNames = collaborators.map(c => c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const allNames = [...collaboratorNames.split('|'), 'You'].join('|');
  const mentionRegex = new RegExp(`@(${allNames})`, 'g');

  const parts = text.split(mentionRegex);

  return (
    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
      {parts.map((part, index) => {
        const isMention = index % 2 === 1;
        if (isMention) {
          return (
            <span key={index} className="text-primary font-semibold bg-primary/10 px-1 rounded-sm">
              @{part}
            </span>
          );
        }
        return part;
      })}
    </p>
  );
};


const ProjectComments = ({ comments, setComments }: ProjectCommentsProps) => {
  const handleSendMessage = (message: string, file?: File) => {
    const newComment: Comment = {
      id: Date.now(),
      user: {
        name: "You",
        avatar: currentUser.src,
      },
      text: message,
      timestamp: "Just now",
      ...(file && {
        attachment: {
          name: file.name,
          url: URL.createObjectURL(file),
          type: file.type.startsWith("image/") ? "image" : "file",
        },
      }),
    };
    setComments((prevComments) => [...prevComments, newComment]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments & Updates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {comments.length > 0 ? (
          <ul className="space-y-6">
            {comments.map((comment) => (
              <li key={comment.id} className="flex items-start gap-4">
                <Avatar className="h-9 w-9 border">
                  <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
                  <AvatarFallback>
                    {comment.user.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="grid gap-1 w-full">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{comment.user.name}</p>
                    <p className="text-xs text-muted-foreground">{comment.timestamp}</p>
                  </div>
                  {renderMessageWithMentions(comment.text)}
                  {comment.attachment && (
                     <a
                        href={comment.attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex items-center gap-3 rounded-lg border p-2 transition-colors hover:bg-muted w-fit"
                      >
                        {comment.attachment.type === 'image' ? (
                            <img src={comment.attachment.url} alt={comment.attachment.name} className="h-12 w-12 rounded-md object-cover" />
                        ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary">
                                <Paperclip className="h-6 w-6" />
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-medium text-primary">{comment.attachment.name}</p>
                            <p className="text-xs text-muted-foreground">Click to view</p>
                        </div>
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Start the conversation!
          </p>
        )}
      </CardContent>
      <ChatInput onSendMessage={handleSendMessage} />
    </Card>
  );
};

export default ProjectComments;