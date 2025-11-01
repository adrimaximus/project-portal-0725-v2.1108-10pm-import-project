import { Project, Reaction } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { SmilePlus } from "lucide-react";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProjectReactionsProps {
  project: Project;
  onReactionsChange: (reactions: Reaction[]) => void;
}

const ProjectReactions = ({ project, onReactionsChange }: ProjectReactionsProps) => {
  const { user } = useAuth();
  const commonEmojis = ['👍', '❤️', '😂', '🎉', '🙏', '😢'];

  const handleEmojiSelect = async (emoji: string) => {
    if (!user) return;

    const currentReactions = project.reactions || [];
    let newReactions: Reaction[];
    const existingReactionIndex = currentReactions.findIndex(r => r.user_id === user.id);

    if (existingReactionIndex > -1) {
      if (currentReactions[existingReactionIndex].emoji === emoji) {
        newReactions = currentReactions.filter(r => r.user_id !== user.id);
      } else {
        newReactions = currentReactions.map(r => 
          r.user_id === user.id ? { ...r, emoji } : r
        );
      }
    } else {
      newReactions = [
        ...currentReactions,
        {
          id: `temp-${Date.now()}`,
          emoji,
          user_id: user.id,
          user_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'You',
        }
      ];
    }
    
    onReactionsChange(newReactions);

    const { error } = await supabase.rpc('toggle_project_reaction', {
      p_project_id: project.id,
      p_emoji: emoji,
    });

    if (error) {
      console.error("Error toggling project reaction:", error);
      toast.error("Failed to save reaction.");
      onReactionsChange(currentReactions);
    }
  };

  const groupedReactions = (project.reactions || []).reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = { users: [], userIds: [] };
    }
    acc[reaction.emoji].users.push(reaction.user_name);
    acc[reaction.emoji].userIds.push(reaction.user_id);
    return acc;
  }, {} as Record<string, { users: string[]; userIds: string[] }>);

  const stopPropagation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {Object.entries(groupedReactions).map(([emoji, { users, userIds }]) => {
        const userHasReacted = user ? userIds.includes(user.id) : false;
        return (
          <TooltipProvider key={emoji} delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant={userHasReacted ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer text-xs px-1.5 py-0.5",
                    userHasReacted && "bg-muted text-foreground"
                  )}
                  onClick={() => handleEmojiSelect(emoji)}
                >
                  {emoji} {users.length}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{users.join(', ')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
            <SmilePlus className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent onClick={stopPropagation} className="p-0 w-auto border-0">
          <EmojiPicker
            onEmojiClick={(emojiObject) => handleEmojiSelect(emojiObject.emoji)}
            emojiStyle={EmojiStyle.NATIVE}
            previewConfig={{ showPreview: false }}
            width={350}
            height={400}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ProjectReactions;