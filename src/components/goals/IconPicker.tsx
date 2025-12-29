import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { allIcons, getIconComponent } from '@/data/icons';
import { ScrollArea } from '@/components/ui/scroll-area';

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  color: string;
}

const IconPicker = React.memo(({ value, onChange, color }: IconPickerProps) => {
  return (
    <ScrollArea className="h-[150px] p-2 border rounded-md">
      <ToggleGroup
        type="single"
        variant="outline"
        value={value}
        onValueChange={(val) => { if (val) onChange(val) }}
        className="flex flex-wrap gap-2"
      >
        {allIcons.map((icon) => {
          const IconComponent = getIconComponent(icon);
          return (
            <ToggleGroupItem key={icon} value={icon} aria-label={icon} className="p-2 h-10 w-10">
              <IconComponent className="h-5 w-5" style={{ color }} />
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </ScrollArea>
  );
});

IconPicker.displayName = 'IconPicker';

export default IconPicker;