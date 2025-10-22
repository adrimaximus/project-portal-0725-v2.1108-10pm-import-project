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

  const handleQuickSelect = (emoji: string) => {
    onSelect(emoji);
    setIsOpen(false);
  };

  const handlePickerSelect = (emoji: any) => {
    onSelect(emoji.native);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <SmilePlus className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-none" side="top" align="center">
        <div className="flex items-center gap-1 bg-background border rounded-full p-1 shadow-lg">
          {quickReactions.map(emoji => (
            <button
              key={emoji}
              onClick={() => handleQuickSelect(emoji)}
              className="text-xl p-1 rounded-full hover:bg-muted transition-colors"
            >
              {emoji}
            </button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-1 rounded-full hover:bg-muted transition-colors">
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
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CommentReactionPicker;