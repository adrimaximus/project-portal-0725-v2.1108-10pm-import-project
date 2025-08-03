import { useState, useMemo } from "react";
import { Project, Comment } from "@/data/projects";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Paperclip, Ticket, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from "@/lib/utils";

interface ProjectCommentsProps {
  project: Project;
}

const ProjectComments = ({
  project,
}: ProjectCommentsProps) => {
  const [filter, setFilter] = useState<'all' | 'comments' | 'tickets'>('all');

  const sortedItems = useMemo(() => 
    [...(project.comments || [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [project.comments]
  );

  const filteredItems = useMemo(() => {
    if (filter === 'comments') return sortedItems.filter(item => !item.isTicket);
    if (filter === 'tickets') return sortedItems.filter(item => item.isTicket);
    return sortedItems;
  }, [filter, sortedItems]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
            <h4 className="text-md font-semibold">History</h4>
            <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                <Button variant={filter === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('all')}>All</Button>
                <Button variant={filter === 'comments' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('comments')}>Comments</Button>
                <Button variant={filter === 'tickets' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('tickets')}>Tickets</Button>
            </div>
        </div>
        <div className="space-y-4">
          {filteredItems.map(item => (
            <div key={item.id} className={cn(
              "flex items-start space-x-3 p-3 rounded-lg",
              item.isTicket && "bg-orange-500/10 border border-orange-500/20"
            )}>
              <Avatar>
                <AvatarImage src={item.author.avatar} />
                <AvatarFallback>{item.author.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-card-foreground flex items-center gap-2">
                    {item.author.name}
                    {item.isTicket && (
                      <span className="flex items-center gap-1.5 text-xs font-semibold bg-orange-500/20 text-orange-800 px-2 py-0.5 rounded-full">
                        <Ticket className="h-3 w-3" />
                        Ticket
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, locale: id })}
                  </p>
                </div>
                <div className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap" dangerouslySetInnerHTML={{
                  __html: item.text
                    .replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '<span class="bg-primary/20 text-primary font-semibold rounded-sm px-1">@$1</span>')
                    .replace(/\/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="/projects/$2" class="text-primary hover:underline">$1</a>')
                }} />
                {item.attachment && (
                  <div className="mt-2">
                    <a href={item.attachment.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-2 bg-primary/10 px-2 py-1 rounded-md">
                      <Paperclip className="h-4 w-4" />
                      {item.attachment.name}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                <MessageSquare className="mx-auto h-12 w-12" />
                <h3 className="mt-2 text-sm font-semibold">No items to display</h3>
                <p className="mt-1 text-sm">
                    {filter === 'comments' && "There are no comments yet."}
                    {filter === 'tickets' && "There are no tickets yet."}
                    {filter === 'all' && "There are no comments or tickets yet."}
                </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectComments;