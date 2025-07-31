import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { goalIcons } from '@/data/icons';
import { Button } from '@/components/ui/button';

interface IconPickerProps {
  children: React.ReactNode;
  onSelectIcon: (icon: React.ElementType) => void;
  currentColor: string;
}

const IconPicker = ({ children, onSelectIcon, currentColor }: IconPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIcons = goalIcons.filter(icon =>
    icon.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (iconComponent: React.ElementType) => {
    onSelectIcon(iconComponent);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Select an Icon</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <Input
            placeholder="Search for an icon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <ScrollArea className="h-[300px] mt-2 pr-3">
          <div className="grid grid-cols-6 gap-2">
            {filteredIcons.map(icon => (
              <Button
                key={icon.name}
                variant="outline"
                className="h-16 w-16 flex flex-col items-center justify-center gap-1"
                onClick={() => handleSelect(icon.component)}
              >
                <icon.component className="h-6 w-6" style={{ color: currentColor }} />
                <span className="text-xs text-muted-foreground truncate">{icon.name}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default IconPicker;