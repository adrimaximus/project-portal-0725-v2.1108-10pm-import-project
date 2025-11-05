import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { SmilePlus, MoreHorizontal } from 'lucide-react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useTheme } from '@/contexts/ThemeProvider';

interface CommentReactionPickerProps {
  onSelect: (emoji: string) => void;
}

const quickReactions = ['👍', '❤️', '😂', '🎉', '🙏', '😢'];

const CommentReactionPicker = ({ onSelect }: CommentReactionPickerProps) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setShowFullPicker(false);
    }
  };

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setIsOpen(false);
    setShowFullPicker(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange} modal={false}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <SmilePlus className="h-4 w-4 text-muted-foreground" />
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
              <button
                key={emoji}
                onClick={() => handleSelect(emoji)}
                className="text-xl p-1 rounded-full hover:bg-muted transition-colors"
              >
                {emoji}
              </button>
            ))}
            <button 
              onClick={() => setShowFullPicker(true)}
              className="p-1 rounded-full hover:bg-muted transition-colors"
            >
              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default CommentReactionPicker;