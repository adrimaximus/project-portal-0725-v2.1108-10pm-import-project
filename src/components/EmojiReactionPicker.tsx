import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { SmilePlus } from 'lucide-react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useTheme } from '@/contexts/ThemeProvider';

interface EmojiReactionPickerProps {
  onSelect: (emoji: string) => void;
}

const quickReactions = ['👍', '❤️', '😂', '🎉', '🙏', '😢'];

const EmojiReactionPicker = ({ onSelect }: EmojiReactionPickerProps) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset to quick reactions view when closing
      setShowFullPicker(false);
    }
  };

  const handleSelect = (emoji: string, e?: React.MouseEvent | any) => {
    // Prevent event bubbling to avoid triggering parent handlers (like closing parent popovers or navigation)
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    onSelect(emoji);
    setIsOpen(false);
    setShowFullPicker(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange} modal={false}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          type="button"
          onClick={(e) => e.stopPropagation()}
        >
          <SmilePlus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" side="top" align="center">
        {showFullPicker ? (
          <div onClick={(e) => e.stopPropagation()}>
            <Picker 
              data={data} 
              onEmojiSelect={(emoji: any) => handleSelect(emoji.native)}
              theme={theme === 'dark' ? 'dark' : 'light'}
              previewPosition="none"
            />
          </div>
        ) : (
          <div 
            className="flex items-center gap-1 bg-background border rounded-full p-1 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {quickReactions.map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={(e) => handleSelect(emoji, e)}
                className="text-xl p-1 rounded-full hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {emoji}
              </button>
            ))}
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowFullPicker(true);
              }}
              className="p-1 rounded-full hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <SmilePlus className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default EmojiReactionPicker;