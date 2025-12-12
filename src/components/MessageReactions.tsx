import { Reaction } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface MessageReactionsProps {
  reactions: Reaction[];
  onToggleReaction: (emoji: string) => void;
}

const MessageReactions = ({ reactions, onToggleReaction }: MessageReactionsProps) => {
  const { user: currentUser } = useAuth();

  if (!reactions || reactions.length === 0) {
    return null;
  }

  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>);

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
        const userHasReacted = reactionList.some(r => r.user_id === currentUser?.id);
        const userNames = reactionList.map(r => r.user_id === currentUser?.id ? 'You' : r.user_name).join(', ');

        return (
          <TooltipProvider key={emoji} delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onToggleReaction(emoji); 
                  }}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-colors",
                    userHasReacted
                      ? "bg-primary/20 border border-primary/50"
                      : "bg-muted hover:bg-muted/80 border"
                  )}
                >
                  <span>{emoji}</span>
                  <span className="font-medium">{reactionList.length}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{userNames}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};

export default MessageReactions;