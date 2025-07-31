import { HexColorPicker } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

const ColorPicker = ({ color, onChange, className }: ColorPickerProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", className)}>
          <div className="flex items-center gap-2">
            <div
              className="h-5 w-5 rounded-full border"
              style={{ backgroundColor: color }}
            />
            <div className="flex-1 truncate">{color.toUpperCase()}</div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-2">
          <HexColorPicker color={color} onChange={onChange} />
        </div>
        <div className="p-2 border-t border-input">
            <div className="flex items-center gap-2">
                <div
                    className="h-5 w-5 rounded-full border"
                    style={{ backgroundColor: color }}
                />
                <Input
                    className="flex-1 h-8"
                    value={color.toUpperCase()}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColorPicker;