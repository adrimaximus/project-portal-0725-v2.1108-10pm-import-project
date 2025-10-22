import { Project, Reaction } from "@/types";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { SmilePlus } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProjectReactionsProps {
  project: Project;
  onReactionsChange: (reactions: Reaction[]) => void;
}

const ProjectReactions = ({ project, onReactionsChange }: ProjectReactionsProps) => {
  const { user } = useSession();
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
          user_name: `${user.user_metadata.first_name || ''} ${user.user_metadata.last_name || ''}`.trim() || user.email || 'You',
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

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {Object.entries(groupedReactions).map(([emoji, { users, userIds }]) => {
        const userHasReacted = user ? userIds.includes(user.id) : false;
        return (
          <TooltipProvider key={emoji}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant={userHasReacted ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer",
                    userHasReacted && "bg-[#DCE5DD] text-black border-[#A3BCA7] hover:bg-[#DCE5DD]/90 dark:bg-[#1E2A21] dark:border-[#3A523E] dark:text-white dark:hover:bg-[#1E2A21]/90"
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
            <SmilePlus className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent onClick={e => e.stopPropagation()} className="p-1 w-auto rounded-full bg-background border shadow-lg">
          <div className="flex items-center gap-1">
            {commonEmojis.map(emoji => (
              <button
                key={emoji}
                className="hover:bg-muted rounded-full p-1 transition-transform transform hover:scale-125"
                onClick={() => handleEmojiSelect(emoji)}
              >
                <span className="text-xl">{emoji}</span>
              </button>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <button className="hover:bg-muted rounded-full p-1.5 transition-transform transform hover:scale-125">
                  <SmilePlus className="h-5 w-5 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                onClick={(e) => e.stopPropagation()}
                className="p-0 w-auto border-0"
                side="bottom"
                align="start"
                sideOffset={8}
              >
                <EmojiPicker
                  onEmojiClick={(emojiObject) => handleEmojiSelect(emojiObject.emoji)}
                  emojiSize={20}
                  previewConfig={{ showPreview: false }}
                  width={350}
                  height={400}
                  style={{
                    fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
                    border: 'none',
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ProjectReactions;