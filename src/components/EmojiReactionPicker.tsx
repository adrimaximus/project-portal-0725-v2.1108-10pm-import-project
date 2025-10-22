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

const EmojiReactionPicker = ({ onSelect }: EmojiReactionPickerProps) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiSelect = (emoji: any) => {
    onSelect(emoji.native);
    // We keep the popover open to allow for quick changes or multiple reactions.
    // The user can click away to close it.
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <SmilePlus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 border-none" 
        side="top" 
        align="center"
      >
        <Picker 
          data={data} 
          onEmojiSelect={handleEmojiSelect}
          theme={theme === 'dark' ? 'dark' : 'light'}
          previewPosition="none"
          searchPosition="none"
          navPosition="bottom"
          perLine={8}
          maxFrequentRows={2}
        />
      </PopoverContent>
    </Popover>
  );
};

export default EmojiReactionPicker;