import { useState, useMemo, useEffect } from "react";
import { Project, Comment, dummyProjects, User } from "@/data/projects";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Paperclip, Send, Ticket, Folder, MessageSquare, X, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { MentionsInput, Mention, SuggestionDataItem } from 'react-mentions';
import { cn } from "@/lib/utils";
import './mentions-style.css';
import { supabase } from "@/integrations/supabase/client";

interface ProjectCommentsProps {
  project: Project;
  onAddCommentOrTicket: (text: string, isTicket: boolean, attachment: File | null) => void;
}

const ProjectComments = ({
  project,
  onAddCommentOrTicket,
}: ProjectCommentsProps) => {
  const { user: currentUser } = useAuth();
  const [newCommentText, setNewCommentText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [filter, setFilter] = useState<'all' | 'comments' | 'tickets'>('all');
  const [mentionableUsers, setMentionableUsers] = useState<any[]>([]);
  const [mentionableProjects, setMentionableProjects] = useState<any[]>([]);

  useEffect(() => {
    const fetchMentionableData = async () => {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase.from('profiles').select('id, first_name, last_name, avatar_url, email');
      if (usersData) {
        setMentionableUsers(usersData.map(u => ({
          id: u.id,
          display: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
          avatar: u.avatar_url,
          initials: `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`.toUpperCase() || 'NN',
        })));
      }

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase.from('projects').select('id, name');
      if (projectsData) {
        setMentionableProjects(projectsData.map(p => ({
          id: p.id,
          display: p.name,
        })));
      }
    };
    fetchMentionableData();
  }, []);

  const usersForMentions = project.assignedTo.map(user => ({
    id: user.id,
    display: user.name,
    avatar: user.avatar,
    initials: user.initials || user.name.slice(0, 2).toUpperCase(),
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

  const handleSubmit = (isTicketSubmit: boolean) => {
    if ((newCommentText.trim() === "" && !attachment) || !currentUser) return;

    onAddCommentOrTicket(newCommentText, isTicketSubmit, attachment);
    
    setNewCommentText("");
    setAttachment(null);
    const fileInput = document.getElementById('comment-attachment') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const suggestionsOpen = document.querySelector('.mentions__suggestions__list');
    if (e.key === 'Enter' && !e.shiftKey && !suggestionsOpen) {
      e.preventDefault();
      handleSubmit(false);
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

  const placeholderText = "Add a comment or create a ticket...";

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Discussion</h3>
        
        <div className="rounded-lg border bg-background transition-all">
          <div className="relative">
            <MentionsInput
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder={placeholderText}
              className="mentions"
              a11ySuggestionsListLabel="Suggested mentions"
              onKeyDown={handleKeyDown}
            >
              <Mention
                trigger="@"
                data={mentionableUsers}
                renderSuggestion={renderUserSuggestion}
                markup="@[__display__](__id__)"
                className="mentions__mention"
              />
              <Mention
                trigger="/"
                data={mentionableProjects}
                renderSuggestion={renderProjectSuggestion}
                markup="/[__display__](__id__)"
                className="mentions__mention"
              />
            </MentionsInput>
            <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1">
              <Button variant="ghost" size="icon" asChild>
                <Label htmlFor="comment-attachment" className="cursor-pointer h-9 w-9 flex items-center justify-center" title="Attach file">
                  <Paperclip className="h-4 w-4" />
                  <input id="comment-attachment" type="file" className="sr-only" onChange={handleFileChange} />
                </Label>
              </Button>
              <Button 
                variant="ghost"
                size="icon" 
                onClick={() => handleSubmit(true)}
                disabled={!newCommentText.trim() && !attachment}
                className="h-9 w-9 text-orange-600"
                title="Create Ticket"
              >
                <Ticket className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                onClick={() => handleSubmit(false)} 
                disabled={!newCommentText.trim() && !attachment} 
                className="h-9 w-9"
                title="Add Comment"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {attachment && (
            <div className="text-sm text-muted-foreground flex items-center gap-2 px-3 py-2 border-t">
              <Paperclip className="h-4 w-4 flex-shrink-0" />
              <span className="truncate flex-1">{attachment.name}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={handleRemoveAttachment}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
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
          {filteredItems.map(item => {
            const isTicketCompleted = item.isTicket && project.tasks?.find(t => t.originTicketId === item.id)?.completed;

            return (
              <div key={item.id} className="flex items-start space-x-3 p-3 rounded-lg">
                <Avatar>
                  <AvatarImage src={item.author.avatar} />
                  <AvatarFallback>{item.author.initials || item.author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-card-foreground flex items-center gap-2">
                      {item.author.name}
                      {item.isTicket && (
                        <>
                          {isTicketCompleted ? (
                            <span className="flex items-center gap-1 text-xs font-semibold bg-green-600 text-white px-2.5 py-1 rounded-full">
                              <CheckCircle className="h-3 w-3" />
                              Done
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-semibold bg-red-500 text-white px-2.5 py-1 rounded-full">
                              <Ticket className="h-3 w-3" />
                              Ticket
                            </span>
                          )}
                        </>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, locale: id })}
                    </p>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap" dangerouslySetInnerHTML={{
                    __html: item.text
                      .replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '<span class="bg-blue-100 text-blue-600 font-semibold rounded-sm px-1">@$1</span>')
                      .replace(/\/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="/projects/$2" class="text-blue-600 hover:underline font-medium">$1</a>')
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
            );
          })}
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