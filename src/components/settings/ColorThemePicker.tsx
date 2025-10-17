import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export const colorThemes = [
  { name: 'Blue', classes: 'bg-blue-100 text-blue-600' },
  { name: 'Green', classes: 'bg-green-100 text-green-600' },
  { name: 'Purple', classes: 'bg-purple-100 text-purple-600' },
  { name: 'Orange', classes: 'bg-orange-100 text-orange-600' },
  { name: 'Red', classes: 'bg-red-100 text-red-600' },
  { name: 'Gray', classes: 'bg-gray-100 text-gray-600' },
];

interface ColorThemePickerProps {
  value: string;
  onChange: (value: string) => void;
}

const ColorThemePicker = ({ value, onChange }: ColorThemePickerProps) => {
  return (
    <div className="grid grid-cols-6 gap-2">
      {colorThemes.map((theme) => (
        <button
          key={theme.name}
          type="button"
          onClick={() => onChange(theme.classes)}
          className={cn(
            "h-10 w-10 rounded-md flex items-center justify-center transition-all",
            theme.classes.split(' ')[0], // get bg color
            value === theme.classes && "ring-2 ring-primary ring-offset-2"
          )}
          title={theme.name}
        >
          {value === theme.classes && <Check className="h-5 w-5 text-primary" />}
        </button>
      ))}
    </div>
  );
};

export default ColorThemePicker;