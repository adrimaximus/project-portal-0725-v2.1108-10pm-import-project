import React, { useState, useMemo } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { allIcons, getIconComponent } from '@/data/icons';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  color: string;
}

const IconPicker = React.memo(({ value, onChange, color }: IconPickerProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const displayedIcons = useMemo(() => {
    // Filter based on search
    const filtered = allIcons.filter((icon) =>
      icon.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Limit initial render to 60 icons to prevent dialog opening lag
    // If searching, we show more results (up to 100)
    const limit = searchTerm ? 100 : 60;
    const sliced = filtered.slice(0, limit);

    // Ensure the currently selected icon is visible even if it's outside the initial slice
    if (value && !searchTerm && !sliced.includes(value) && allIcons.includes(value)) {
      return [value, ...sliced];
    }
    
    return sliced;
  }, [searchTerm, value]);

  return (
    <div className="border rounded-md p-2 space-y-2">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search icons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 h-9 text-sm"
        />
      </div>
      <ScrollArea className="h-[150px]">
        <ToggleGroup
          type="single"
          variant="outline"
          value={value}
          onValueChange={(val) => {
            if (val) onChange(val);
          }}
          className="flex flex-wrap gap-2 justify-start content-start"
        >
          {displayedIcons.map((icon) => {
            const IconComponent = getIconComponent(icon);
            return (
              <ToggleGroupItem
                key={icon}
                value={icon}
                aria-label={icon}
                className="p-2 h-10 w-10 shrink-0 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
              >
                <IconComponent className="h-5 w-5" style={{ color: value === icon ? 'currentColor' : color }} />
              </ToggleGroupItem>
            );
          })}
          {displayedIcons.length === 0 && (
            <p className="w-full text-center text-xs text-muted-foreground py-4">
              No icons found.
            </p>
          )}
        </ToggleGroup>
      </ScrollArea>
    </div>
  );
});

IconPicker.displayName = 'IconPicker';

export default IconPicker;