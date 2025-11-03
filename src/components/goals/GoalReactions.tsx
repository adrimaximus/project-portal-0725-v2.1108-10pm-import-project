import { Goal, Reaction } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { SmilePlus } from "lucide-react";
import EmojiPicker, { Categories } from "emoji-picker-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface GoalReactionsProps {
  goal: Goal;
}

const GoalReactions = ({ goal }: GoalReactionsProps) => {
  const { user } = useAuth();
  const [reactions, setReactions] = useState(goal.reactions || []);

  useEffect(() => {
    setReactions(goal.reactions || []);
  }, [goal.reactions]);

  const handleEmojiSelect = async (emoji: string) => {
    if (!user) return;

    const currentReactions = reactions;
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
    
    setReactions(newReactions); // Optimistic update

    const { error } = await supabase.rpc('toggle_goal_reaction', {
      p_goal_id: goal.id,
      p_emoji: emoji,
    });

    if (error) {
      console.error("Error toggling goal reaction:", error);
      toast.error("Failed to save reaction.");
      setReactions(currentReactions); // Revert on error
    }
  };

  const groupedReactions = reactions.reduce((acc, reaction) => {
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
    <div className="flex items-center gap-1" onClick={stopPropagation}>
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
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
            <SmilePlus className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent onClick={stopPropagation} className="p-0 w-auto border-0">
          <EmojiPicker
            onEmojiClick={(emojiObject) => handleEmojiSelect(emojiObject.emoji)}
            lazyLoadEmojis
            searchDisabled
            skinTonesDisabled
            previewConfig={{ showPreview: false }}
            categories={[
              { category: Categories.SUGGESTED, name: "Suggested" },
              { category: Categories.SMILEYS_PEOPLE, name: "Smileys & People" },
            ]}
            height={300}
            width={250}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default GoalReactions;