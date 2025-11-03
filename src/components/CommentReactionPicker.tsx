import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { SmilePlus, MoreHorizontal, Pencil, X } from 'lucide-react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useTheme } from '@/contexts/ThemeProvider';
import { useQuickReactions } from '@/hooks/useQuickReactions';
import { cn } from '@/lib/utils';

interface CommentReactionPickerProps {
  onSelect: (emoji: string) => void;
}

const CommentReactionPicker = ({ onSelect }: CommentReactionPickerProps) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { quickReactions, addReaction, removeReaction } = useQuickReactions();

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setIsEditing(false);
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

  const handlePickerSelect = (emoji: any) => {
    if (isEditing) {
      addReaction(emoji.native);
    } else {
      onSelect(emoji.native);
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <SmilePlus className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-none" side="top" align="center">
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
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-1 rounded-full hover:bg-muted transition-colors" title={isEditing ? "Add new quick reaction" : "More emojis"}>
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-auto p-0 border-none mb-2" 
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Picker 
                data={data} 
                onEmojiSelect={handlePickerSelect}
                theme={theme === 'dark' ? 'dark' : 'light'}
                previewPosition="none"
              />
            </PopoverContent>
          </Popover>
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
      </PopoverContent>
    </Popover>
  );
};

export default CommentReactionPicker;