import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { iconList, getIconComponent } from '@/data/icons';

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  color: string;
}

const IconPicker = ({ value, onChange, color }: IconPickerProps) => {
  return (
    <div className="max-h-[150px] overflow-y-auto p-2 border rounded-md">
      <ToggleGroup
        type="single"
        variant="outline"
        value={value}
        onValueChange={(val) => { if (val) onChange(val) }}
        className="flex flex-wrap gap-2"
      >
        {iconList.map((icon) => {
          const IconComponent = getIconComponent(icon.value);
          return (
            <ToggleGroupItem key={icon.value} value={icon.value} aria-label={icon.label} className="p-2 h-10 w-10">
              <IconComponent className="h-5 w-5" style={{ color }} />
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </div>
  );
};

export default IconPicker;