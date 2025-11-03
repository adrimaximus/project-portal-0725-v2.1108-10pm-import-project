import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Reaction } from '@/types';
import { Button } from '@/components/ui/button';
import EmojiReactionPicker from '../EmojiReactionPicker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TaskReactionsProps {
  reactions: Reaction[];
  onToggleReaction: (emoji: string) => void;
}

const TaskReactions = ({ reactions: initialReactions, onToggleReaction }: TaskReactionsProps) => {
  const { user } = useAuth();
  const [reactions, setReactions] = useState(initialReactions || []);

  useEffect(() => {
    setReactions(initialReactions || []);
  }, [initialReactions]);

  const handleToggle = (emoji: string) => {
    if (!user) {
      toast.error("You must be logged in to react.");
      return;
    }

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
          user_name: user.name || 'You',
        }
      ];
    }
    
    setReactions(newReactions); // Optimistic update
    onToggleReaction(emoji); // Fire and forget mutation
  };

  const reactionsSummary = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = {
        count: 0,
        users: [],
        userReacted: false,
      };
    }
    acc[reaction.emoji].count++;
    const userName = reaction.user_name || 'A user';
    if (reaction.user_id === user?.id) {
      acc[reaction.emoji].users.unshift('You');
      acc[reaction.emoji].userReacted = true;
    } else {
      acc[reaction.emoji].users.push(userName);
    }
    return acc;
  }, {} as Record<string, { count: number; users: string[]; userReacted: boolean }>);

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {Object.entries(reactionsSummary).map(([emoji, { count, users, userReacted }]) => (
        <TooltipProvider key={emoji} delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={userReacted ? 'secondary' : 'ghost'}
                size="sm"
                className={cn("h-7 px-2 rounded-full", userReacted && "border border-primary/50")}
                onClick={() => handleToggle(emoji)}
              >
                <span className="text-sm">{emoji}</span>
                {count > 1 && <span className="text-xs ml-1 text-muted-foreground">{count}</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs max-w-xs">
                {users.slice(0, 5).join(', ')}
                {users.length > 5 && `, and ${users.length - 5} more`}
                <br />
                reacted with {emoji}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      <EmojiReactionPicker onSelect={handleToggle} />
    </div>
  );
};

export default TaskReactions;