import { useState } from 'react';
import React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { goalIcons } from '@/data/icons';

const iconList = goalIcons.map(icon => icon.component);

interface IconPickerProps {
  children: React.ReactNode;
  onSelectIcon: (icon: React.ElementType) => void;
  currentColor: string;
}

const IconPicker = ({ children, onSelectIcon, currentColor }: IconPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (Icon: React.ElementType) => {
    onSelectIcon(Icon);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-2">
        <div className="grid grid-cols-8 gap-1">
          {iconList.map((Icon, index) => (
            <Button
              key={index}
              variant="ghost"
              size="icon"
              onClick={() => handleSelect(Icon)}
              className="rounded-md flex items-center justify-center h-9 w-9"
            >
              <Icon style={{ fontSize: '20px' }} twoToneColor={currentColor} />
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default IconPicker;