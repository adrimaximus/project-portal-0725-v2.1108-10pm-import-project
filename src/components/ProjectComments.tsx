import { useMemo, useState } from "react";
import { Project } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Paperclip, Ticket, MessageSquare, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { Badge } from "./ui/badge";
import CommentRenderer from "./CommentRenderer";
import CommentInput from "./CommentInput";

interface ProjectCommentsProps {
  project: Project;
  onAddCommentOrTicket: (text: string, isTicket: boolean, attachment: File | null) => void;
}

const ProjectComments = ({ project, onAddCommentOrTicket }: ProjectCommentsProps) => {
  const [showTickets, setShowTickets] = useState(false);

  const sortedItems = useMemo(() => 
    [...(project.comments || [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [project.comments]
  );

  const filteredItems = useMemo(() => {
    if (showTickets) {
      return sortedItems.filter(item => item.isTicket);
    }
    return sortedItems;
  }, [sortedItems, showTickets]);

  const allProjectMembers = useMemo(() => [project.created_by, ...project.assignedTo], [project.created_by, project.assignedTo]);

  const openTicketCount = useMemo(() => {
    return sortedItems.filter(item => {
      if (!item.isTicket) return false;
      const correspondingTask = project.tasks?.find(t => t.originTicketId === item.id);
      return !correspondingTask || !correspondingTask.completed;
    }).length;
  }, [sortedItems, project.tasks]);

  return (
    <div className="space-y-6">
      <CommentInput project={project} onAddCommentOrTicket={onAddCommentOrTicket} />

      <div>
        <div className="flex items-center gap-4 mb-4 border-b">
          <Button variant="ghost" onClick={() => setShowTickets(false)} className={`rounded-none ${!showTickets ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
            <MessageSquare className="mr-2 h-4 w-4" /> All Comments ({sortedItems.length})
          </Button>
          <Button variant="ghost" onClick={() => setShowTickets(true)} className={`rounded-none ${showTickets ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
            <Ticket className="mr-2 h-4 w-4" /> Tickets 
            {openTicketCount > 0 && <Badge variant="secondary" className="ml-2">{openTicketCount}</Badge>}
          </Button>
        </div>

        <div className="space-y-6">
          {filteredItems.length > 0 ? filteredItems.map(item => {
            const isTicketCompleted = item.isTicket && project.tasks?.find(t => t.originTicketId === item.id)?.completed;
            return (
              <div key={item.id} className="flex items-start space-x-4">
                <Avatar>
                  <AvatarImage src={item.author.avatar} />
                  <AvatarFallback>{item.author.initials || item.author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-card-foreground flex items-center gap-2">
                      {item.author.name}
                      {item.isTicket && (
                        <Badge variant={isTicketCompleted ? "default" : "secondary"} className={isTicketCompleted ? "bg-green-100 text-green-800 border-green-300" : ""}>
                          <Ticket className="mr-1.5 h-3 w-3" />
                          Ticket
                          {isTicketCompleted && <CheckCircle2 className="ml-1.5 h-3 w-3" />}
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, locale: id })}
                    </p>
                  </div>
                  <div className="mt-1 prose prose-sm max-w-none text-muted-foreground">
                    <CommentRenderer text={item.text || ''} members={allProjectMembers} />
                  </div>
                  {item.attachment_url && (
                    <div className="mt-2">
                      <a href={item.attachment_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-2 bg-primary/10 px-2 py-1 rounded-md max-w-xs truncate">
                        <Paperclip className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{item.attachment_name || 'View Attachment'}</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )
          }) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              {showTickets ? "No tickets yet." : "No comments yet. Start the conversation!"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectComments;