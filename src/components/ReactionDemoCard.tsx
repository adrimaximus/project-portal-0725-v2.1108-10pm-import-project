import React, { useState } from 'react';
import EmojiReactionPicker from '@/components/EmojiReactionPicker';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

// Mock reaction type for the demo
type Reaction = {
  emoji: string;
  user_id: string;
  user_name: string;
};

const ReactionDemoCard = () => {
  // Mock current user for the demo
  const currentUser = { id: 'user-123', name: 'You' };

  const [reactions, setReactions] = useState<Reaction[]>([
    { emoji: '🎉', user_id: 'user-abc', user_name: 'Dyad' },
  ]);

  const handleSelectReaction = (emoji: string) => {
    // This is the handler function that correctly updates the state.
    setReactions(currentReactions => {
      const existingReactionIndex = currentReactions.findIndex(
        r => r.emoji === emoji && r.user_id === currentUser.id
      );

      if (existingReactionIndex > -1) {
        // If the user has already reacted with this emoji, remove the reaction (toggle off).
        return currentReactions.filter((_, index) => index !== existingReactionIndex);
      } else {
        // Otherwise, add the new reaction.
        const newReaction: Reaction = {
          emoji: emoji,
          user_id: currentUser.id,
          user_name: currentUser.name,
        };
        return [...currentReactions, newReaction];
      }
    });

    // In a real application, you would also call your database function here to save the change.
    // For example: supabase.rpc('toggle_project_reaction', { p_project_id: 'your-item-id', p_emoji: emoji });
    console.log(`Reaction "${emoji}" toggled. This would be saved to the database in a real app.`);
  };

  // Group reactions by emoji for display purposes
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction.user_name);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <p>Ini adalah kartu demo untuk menunjukkan cara kerja reaksi. Saat Anda memilih emoji, logika di dalam komponen kartu ini akan memperbarui tampilan.</p>
      </CardContent>
      <CardFooter className="flex items-center gap-2 p-4 border-t">
        <div className="flex items-center gap-1 flex-wrap">
          {Object.entries(groupedReactions).map(([emoji, users]) => (
            <div key={emoji} className="relative group">
              <button
                onClick={() => handleSelectReaction(emoji)}
                className="bg-muted hover:bg-muted/80 border rounded-full px-2 py-1 text-sm flex items-center gap-1"
              >
                <span>{emoji}</span>
                <span>{users.length}</span>
              </button>
              <div className="absolute bottom-full mb-2 w-max bg-foreground text-background text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {users.join(', ')} bereaksi dengan {emoji}
              </div>
            </div>
          ))}
        </div>
        <EmojiReactionPicker onSelect={handleSelectReaction} />
      </CardFooter>
    </Card>
  );
};

export default ReactionDemoCard;