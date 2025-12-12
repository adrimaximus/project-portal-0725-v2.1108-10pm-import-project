"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SmilePlus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArticleReaction } from '@/types';

const EMOJIS = ['👍', '❤️', '😂', '😮', '💡', '🤔'];

type ArticleReactionsProps = {
  articleId: string;
  rawReactions: ArticleReaction[];
  articleSlug: string;
};

const ArticleReactions = ({ articleId, rawReactions = [], articleSlug }: ArticleReactionsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const { mutate: toggleReaction } = useMutation({
    mutationFn: async (emoji: string) => {
      if (!user) {
        toast.error("You must be logged in to react.");
        return;
      }
      const { error } = await supabase.rpc('toggle_kb_article_reaction', {
        p_article_id: articleId,
        p_emoji: emoji,
      });
      if (error) throw error;
    },
    onMutate: async (emoji: string) => {
      await queryClient.cancelQueries({ queryKey: ['kb_article', articleSlug] });
      const previousArticle = queryClient.getQueryData(['kb_article', articleSlug]);
      
      queryClient.setQueryData(['kb_article', articleSlug], (old: any) => {
        if (!old || !user) return old;

        const existingReactionIndex = old.kb_article_reactions.findIndex((r: any) => r.user_id === user.id);
        let newReactions = [...old.kb_article_reactions];

        if (existingReactionIndex > -1) {
          if (newReactions[existingReactionIndex].emoji === emoji) {
            newReactions.splice(existingReactionIndex, 1);
          } else {
            newReactions[existingReactionIndex] = { ...newReactions[existingReactionIndex], emoji };
          }
        } else {
          newReactions.push({
            id: `temp-${Date.now()}`,
            emoji,
            user_id: user.id,
            profiles: { id: user.id, first_name: user.first_name, last_name: user.last_name }
          });
        }
        return { ...old, kb_article_reactions: newReactions };
      });

      return { previousArticle };
    },
    onError: (err, newReaction, context) => {
      queryClient.setQueryData(['kb_article', articleSlug], context?.previousArticle);
      toast.error("Failed to add reaction.");
      console.error(err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['kb_article', articleSlug] });
    },
  });

  const handleEmojiSelect = (emoji: string) => {
    toggleReaction(emoji);
    setIsPickerOpen(false);
  };

  const groupedReactions = rawReactions.reduce((acc, reaction) => {
    acc[reaction.emoji] = acc[reaction.emoji] || [];
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, ArticleReaction[]>);

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      {Object.entries(groupedReactions).map(([emoji, reactionGroup]) => {
        const userHasReacted = reactionGroup.some(r => r.user_id === user?.id);
        const reactorNames = reactionGroup.map(r => 
          `${r.profiles?.first_name || ''} ${r.profiles?.last_name || ''}`.trim() || 'A user'
        ).join(', ');

        return (
          <TooltipProvider key={emoji} delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={userHasReacted ? 'secondary' : 'outline'}
                  size="sm"
                  className="px-2 py-1 h-auto rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEmojiSelect(emoji);
                  }}
                  type="button"
                >
                  <span className="text-base mr-1.5">{emoji}</span>
                  <span className="text-xs font-medium">{reactionGroup.length}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-[200px]">{reactorNames} reacted with {emoji}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
      <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full h-8 w-8" 
            type="button"
            onClick={(e) => {
               e.stopPropagation();
               // PopoverTrigger handles the click, but we ensure no bubbling
            }}
          >
            <SmilePlus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-1">
            {EMOJIS.map(emoji => (
              <Button
                key={emoji}
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEmojiSelect(emoji);
                }}
                className="rounded-full"
                type="button"
              >
                <span className="text-xl">{emoji}</span>
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ArticleReactions;