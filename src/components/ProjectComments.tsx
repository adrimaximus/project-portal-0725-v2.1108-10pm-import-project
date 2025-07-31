import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Project, User, Task } from "@/data/projects";
import { dummyUsers } from "@/data/users";
import { formatDistanceToNow } from "date-fns";
import { Paperclip, Send } from "lucide-react";
import { Badge } from "./ui/badge";

export interface Comment {
  id: string;
  user: User;
  text: string;
  timestamp: string;
  isPrivate: boolean;
  attachments?: File[];
}

interface ProjectCommentsProps {
  project: Project;
}

const initialComments: Comment[] = [
  {
    id: "comment-1",
    user: dummyUsers[1],
    text: "Here's the first draft of the homepage design. Let me know your thoughts!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isPrivate: false,
  },
  {
    id: "comment-2",
    user: dummyUsers[0],
    text: "This looks great! Just a few minor tweaks needed on the color palette.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    isPrivate: false,
  },
  {
    id: "comment-3",
    user: dummyUsers[2],
    text: "Internal note: we need to check the license for the stock photos.",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    isPrivate: true,
  },
];

export function ProjectComments({ project }: ProjectCommentsProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments" | "tasks">("comments");

  const handlePostComment = () => {
    if (newComment.trim() === "") return;

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      user: dummyUsers[0], // Placeholder for current user
      text: newComment,
      timestamp: new Date().toISOString(),
      isPrivate,
    };

    setComments([...comments, comment]);
    setNewComment("");
  };

  return (
    <div className="bg-card p-6 rounded-lg shadow-sm">
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "comments"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("comments")}
        >
          Comments ({comments.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "tasks"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => setActiveTab("tasks")}
        >
          Tasks ({project.tasks.length})
        </button>
      </div>

      {activeTab === "comments" ? (
        <div className="space-y-6">
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={comment.user.avatar} />
                  <AvatarFallback>{comment.user.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{comment.user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.timestamp), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p
                    className={`text-sm mt-1 p-3 rounded-lg ${
                      comment.isPrivate
                        ? "bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800/50"
                        : "bg-muted/50"
                    }`}
                  >
                    {comment.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Textarea
              placeholder="Type your comment here..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="bg-background"
            />
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Select
                  onValueChange={(value) => setIsPrivate(value === "private")}
                >
                  <SelectTrigger className="w-[120px] text-xs h-8">
                    <SelectValue placeholder="Visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handlePostComment} size="sm">
                <Send className="h-4 w-4 mr-2" />
                Post
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="font-semibold">Project Tasks</h3>
          {project.tasks.length > 0 ? (
            <ul className="space-y-2">
              {project.tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                >
                  <span
                    className={task.completed ? "line-through text-muted-foreground" : ""}
                  >
                    {task.title}
                  </span>
                  <Badge variant={task.completed ? "outline" : "default"}>
                    {task.completed ? "Done" : "To Do"}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No tasks for this project yet.</p>
          )}
        </div>
      )}
    </div>
  );
}