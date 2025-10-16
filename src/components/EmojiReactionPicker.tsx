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

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🎉', '🙏', '😢'];

const EmojiReactionPicker = ({ onSelect }: EmojiReactionPickerProps) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleQuickSelect = (emoji: string) => {
    onSelect(emoji);
  };

  const handlePickerSelect = (emoji: any) => {
    onSelect(emoji.native);
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-1 bg-background border rounded-full p-1 shadow-lg">
      {QUICK_REACTIONS.map(emoji => (
        <button
          key={emoji}
          onClick={() => handleQuickSelect(emoji)}
          className="text-xl p-1 rounded-full hover:bg-muted transition-colors"
        >
          {emoji}
        </button>
      ))}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button className="p-1 rounded-full hover:bg-muted transition-colors">
            <SmilePlus className="h-5 w-5 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-none mb-2">
          <Picker 
            data={data} 
            onEmojiSelect={handlePickerSelect}
            theme={theme === 'dark' ? 'dark' : 'light'}
            previewPosition="none"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default EmojiReactionPicker;