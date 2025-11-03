import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { SmilePlus, Pencil, X } from 'lucide-react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useTheme } from '@/contexts/ThemeProvider';
import { useQuickReactions } from '@/hooks/useQuickReactions';
import { cn } from '@/lib/utils';

interface EmojiReactionPickerProps {
  onSelect: (emoji: string) => void;
}

const EmojiReactionPicker = ({ onSelect }: EmojiReactionPickerProps) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { quickReactions, addReaction, removeReaction } = useQuickReactions();

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setShowFullPicker(false);
      setIsEditing(false);
    }
  };

  const handleSelect = (emoji: string) => {
    if (isEditing) {
      addReaction(emoji);
      setShowFullPicker(false);
    } else {
      onSelect(emoji);
      setIsOpen(false);
    }
  };

  const handleQuickAction = (emoji: string) => {
    if (isEditing) {
      removeReaction(emoji);
    } else {
      onSelect(emoji);
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <SmilePlus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-none" side="top" align="center">
        {showFullPicker ? (
          <Picker 
            data={data} 
            onEmojiSelect={(emoji: any) => handleSelect(emoji.native)}
            theme={theme === 'dark' ? 'dark' : 'light'}
            previewPosition="none"
          />
        ) : (
          <div className="flex items-center gap-1 bg-background border rounded-full p-1 shadow-lg">
            {quickReactions.map(emoji => (
              <div key={emoji} className="relative group">
                <button
                  onClick={() => handleQuickAction(emoji)}
                  className="text-xl p-1 rounded-full hover:bg-muted transition-colors"
                >
                  {emoji}
                </button>
                {isEditing && (
                  <button
                    onClick={() => removeReaction(emoji)}
                    className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            ))}
            <button 
              onClick={() => setShowFullPicker(true)}
              className="p-1 rounded-full hover:bg-muted transition-colors"
              title={isEditing ? "Add new quick reaction" : "More emojis"}
            >
              <SmilePlus className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="border-l h-6 mx-1" />
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={cn(
                "p-1 rounded-full hover:bg-muted transition-colors",
                isEditing && "bg-primary/20"
              )}
              title="Edit quick reactions"
            >
              <Pencil className={cn("h-4 w-4 text-muted-foreground", isEditing && "text-primary")} />
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default EmojiReactionPicker;