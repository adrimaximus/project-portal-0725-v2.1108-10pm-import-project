import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { goalIcons } from '@/data/icons';

const iconList: LucideIcon[] = goalIcons.map(icon => icon.component);

interface IconPickerProps {
  children: React.ReactNode;
  onSelectIcon: (icon: LucideIcon) => void;
  currentColor: string;
}

const IconPicker = ({ children, onSelectIcon, currentColor }: IconPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (Icon: LucideIcon) => {
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
              className="rounded-md flex items-center justify-center"
            >
              <Icon className="h-5 w-5" style={{ color: currentColor }} />
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default IconPicker;