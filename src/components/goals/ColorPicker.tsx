import React from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface ColorPickerProps {
  color: string;
  setColor: (color: string) => void;
}

const pastelColors = [
  '#FFDDC1', '#FFABAB', '#FFC3A0', '#B5EAD7',
  '#C7CEEA', '#E2F0CB', '#A7C7E7', '#F3E5AB',
];

const ColorPicker = React.memo(({ color, setColor }: ColorPickerProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full border"
              style={{ backgroundColor: color }}
            />
            <span>{color}</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          <HexColorPicker color={color} onChange={setColor} className="!w-full" />
          <div className="flex items-center gap-2">
            <Label className="flex-shrink-0">Hex</Label>
            <HexColorInput
              className="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              color={color}
              onChange={setColor}
              prefixed
            />
          </div>
          <div className="space-y-2">
            <Label>Suggestions</Label>
            <div className="grid grid-cols-8 gap-2">
              {pastelColors.map((pastel) => (
                <button
                  key={pastel}
                  className="h-6 w-6 rounded-full border cursor-pointer transition-transform hover:scale-110"
                  style={{ backgroundColor: pastel }}
                  onClick={() => setColor(pastel)}
                  title={pastel}
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

ColorPicker.displayName = 'ColorPicker';

export default ColorPicker;