import { Reaction } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { groupBy } from 'lodash';

interface MessageReactionsProps {
  reactions: Reaction[];
  onReact: (emoji: string) => void;
}

const MessageReactions = ({ reactions, onReact }: MessageReactionsProps) => {
  const { user: currentUser } = useAuth();

  if (!reactions || reactions.length === 0) {
    return null;
  }

  const groupedReactions = groupBy(reactions, 'emoji');

  return (
    <div className="absolute -bottom-3 right-2 flex items-center gap-1 bg-card p-0.5 rounded-full border shadow-sm">
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
        const reactions = reactionList as Reaction[];
        const userHasReacted = reactions.some(r => r.user_id === currentUser?.id);
        const userNames = reactions.map(r => r.user_id === currentUser?.id ? 'You' : r.user_name).join(', ');

        return (
          <Popover key={emoji}>
            <PopoverTrigger asChild>
              <button
                onClick={() => onReact(emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                  userHasReacted ? 'bg-primary/20' : 'hover:bg-muted'
                }`}
              >
                <span>{emoji}</span>
                <span className="font-medium">{reactions.length}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="text-sm p-2 w-auto">
              <p>{userNames} reacted with {emoji}</p>
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
};

export default MessageReactions;