import { Project, Comment as CommentType } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Ticket } from "lucide-react";
import { getInitials, generatePastelColor } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import CommentInput from "./CommentInput";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import remarkGfm from "remark-gfm";

interface ProjectCommentsProps {
  project: Project;
  onAddCommentOrTicket: (text: string, isTicket: boolean, attachments: File[] | null) => void;
}

const processMentions = (text: string | null | undefined) => {
  if (!text) return '';
  return text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '**@$1**');
};

const ProjectComments = ({ project, onAddCommentOrTicket }: ProjectCommentsProps) => {
  const comments = project.comments || [];
  const tasks = project.tasks || [];

  return (
    <div className="space-y-6">
      <CommentInput project={project} onAddCommentOrTicket={onAddCommentOrTicket} />

      <div className="space-y-4">
        {comments.map((comment) => {
          const author = comment.author;
          const fullName = `${author.first_name || ''} ${author.last_name || ''}`.trim() || author.email;
          const isTicket = comment.isTicket;
          const ticketTask = isTicket ? tasks.find((t) => t.originTicketId === comment.id) : null;

          return (
            <div key={comment.id} className="flex items-start space-x-4">
              <Avatar>
                <AvatarImage src={author.avatar_url} />
                <AvatarFallback style={generatePastelColor(author.id)}>
                  {getInitials(fullName, author.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{fullName}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                  </span>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none mt-1 break-words">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ node, ...props }) => {
                        const href = props.href || '';
                        if (href.startsWith('/')) {
                          return <Link to={href} {...props} className="text-primary hover:underline" />;
                        }
                        return <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" />;
                      }
                    }}
                  >
                    {processMentions(comment.text)}
                  </ReactMarkdown>
                </div>
                {isTicket && (
                  <div className="mt-2">
                    <Badge variant={ticketTask?.completed ? 'default' : 'destructive'} className={ticketTask?.completed ? 'bg-green-600 hover:bg-green-700' : ''}>
                      <Ticket className="h-3 w-3 mr-1" />
                      {ticketTask?.completed ? 'Done' : 'Ticket'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectComments;