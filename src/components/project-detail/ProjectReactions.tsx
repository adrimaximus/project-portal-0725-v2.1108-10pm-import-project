import { Reaction, Project } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import EmojiReactionPicker from '../EmojiReactionPicker';
import { useProjectMutations } from '@/hooks/useProjectMutations';

interface ProjectReactionsProps {
  project: Project;
  onReactionsChange: (reactions: Reaction[]) => void;
}

const ProjectReactions = ({ project }: ProjectReactionsProps) => {
  const { user: currentUser } = useAuth();
  const { toggleProjectReaction } = useProjectMutations(project.slug);

  const handleToggleReaction = (emoji: string) => {
    if (toggleProjectReaction) {
      toggleProjectReaction.mutate({ projectId: project.id, emoji });
    }
  };

  const reactions = project.reactions || [];

  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
        const userHasReacted = reactionList.some(r => r.user_id === currentUser?.id);
        const userNames = reactionList.map(r => r.user_id === currentUser?.id ? 'You' : r.user_name).join(', ');

        return (
          <TooltipProvider key={emoji} delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleReaction(emoji); }}
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-xs flex items-center gap-1 transition-colors border",
                    userHasReacted
                      ? "bg-primary/20 border-primary/50"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <span>{emoji}</span>
                  <span className="font-medium text-xs">{reactionList.length}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{userNames}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
      <div onClick={(e) => e.stopPropagation()}>
        <EmojiReactionPicker onSelect={handleToggleReaction} />
      </div>
    </div>
  );
};

export default ProjectReactions;