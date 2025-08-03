import { useState, useMemo } from "react";
import { Project, Comment, dummyProjects } from "@/data/projects";
import { useUser } from "@/contexts/UserContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Paperclip, Send, Ticket, Folder, MessageSquare, X } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { MentionsInput, Mention, SuggestionDataItem } from 'react-mentions';
import { cn } from "@/lib/utils";
import './mentions-style.css';

interface ProjectCommentsProps {
  project: Project;
  onAddCommentOrTicket: (comment: Comment) => void;
}

const ProjectComments = ({
  project,
  onAddCommentOrTicket,
}: ProjectCommentsProps) => {
  const { user: currentUser } = useUser();
  const [newCommentText, setNewCommentText] = useState("");
  const [isTicket, setIsTicket] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [filter, setFilter] = useState<'all' | 'comments' | 'tickets'>('all');

  const usersForMentions = project.assignedTo.map(user => ({
    id: user.id,
    display: user.name,
    avatar: user.avatar,
    initials: user.initials,
  }));

  const projectsForMentions = dummyProjects.map(p => ({
    id: p.id,
    display: p.name,
  }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    const fileInput = document.getElementById('comment-attachment') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleSubmit = () => {
    if (newCommentText.trim() === "" && !attachment) return;

    const newComment: Comment = {
      id: `item-${Date.now()}`,
      author: currentUser,
      text: newCommentText,
      timestamp: new Date().toISOString(),
      isTicket: isTicket,
      attachment: attachment ? { name: attachment.name, url: URL.createObjectURL(attachment) } : undefined,
    };

    onAddCommentOrTicket(newComment);
    setNewCommentText("");
    setIsTicket(false);
    setAttachment(null);
    const fileInput = document.getElementById('comment-attachment') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const renderUserSuggestion = (
    suggestion: SuggestionDataItem & { avatar?: string; initials?: string },
    search: string,
    highlightedDisplay: React.ReactNode,
    index: number,
    focused: boolean
  ) => (
    <div className={`mentions__suggestions__item ${focused ? 'mentions__suggestions__item--focused' : ''}`}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={suggestion.avatar} />
        <AvatarFallback>{suggestion.initials}</AvatarFallback>
      </Avatar>
      <span>{highlightedDisplay}</span>
    </div>
  );

  const renderProjectSuggestion = (
    suggestion: SuggestionDataItem,
    search: string,
    highlightedDisplay: React.ReactNode,
    index: number,
    focused: boolean
  ) => (
    <div className={`mentions__suggestions__item ${focused ? 'mentions__suggestions__item--focused' : ''}`}>
      <Folder className="h-5 w-5 text-muted-foreground" />
      <span>{highlightedDisplay}</span>
    </div>
  );

  const sortedItems = useMemo(() => 
    [...(project.comments || [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [project.comments]
  );

  const filteredItems = useMemo(() => {
    if (filter === 'comments') return sortedItems.filter(item => !item.isTicket);
    if (filter === 'tickets') return sortedItems.filter(item => item.isTicket);
    return sortedItems;
  }, [filter, sortedItems]);

  const placeholderText = isTicket
    ? "Create a new ticket... Describe the issue or task."
    : "Add a comment... Type '@' to mention, '/' to link.";

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Discussion</h3>
        
        <div className={cn(
          "rounded-lg border bg-background transition-all",
          isTicket && "border-orange-500/50 ring-2 ring-orange-500/20"
        )}>
          <div className="p-2">
            <MentionsInput
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder={placeholderText}
              className="mentions"
              a11ySuggestionsListLabel="Suggested mentions"
            >
              <Mention
                trigger="@"
                data={usersForMentions}
                renderSuggestion={renderUserSuggestion}
                markup="@[__display__](__id__)"
                className="mentions__mention"
              />
              <Mention
                trigger="/"
                data={projectsForMentions}
                renderSuggestion={renderProjectSuggestion}
                markup="/[__display__](__id__)"
                className="mentions__mention"
              />
            </MentionsInput>
          </div>
          {attachment && (
            <div className="text-sm text-muted-foreground flex items-center gap-2 px-3 pb-2">
              <Paperclip className="h-4 w-4 flex-shrink-0" />
              <span className="truncate flex-1">{attachment.name}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={handleRemoveAttachment}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex items-center justify-between gap-1 p-2 border-t bg-muted/50 rounded-b-lg">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" asChild>
                <Label htmlFor="comment-attachment" className="cursor-pointer">
                  <Paperclip className="h-4 w-4" />
                  <input id="comment-attachment" type="file" className="sr-only" onChange={handleFileChange} />
                </Label>
              </Button>
              <Button 
                variant={isTicket ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setIsTicket(!isTicket)}
                className={cn(isTicket && "text-orange-600")}
              >
                <Ticket className="h-4 w-4 mr-2" />
                {isTicket ? 'Creating a Ticket' : 'Create Ticket'}
              </Button>
            </div>
            <Button onClick={handleSubmit} disabled={!newCommentText.trim() && !attachment}>
              <Send className="h-4 w-4 mr-2" />
              {isTicket ? 'Create Ticket' : 'Send Comment'}
            </Button>
          </div>
        </div>
      </div>

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