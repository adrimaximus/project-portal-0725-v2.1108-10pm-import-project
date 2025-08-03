import { allIcons, getIconComponent } from "@/data/icons";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const IconPicker = ({ value, onChange }: IconPickerProps) => {
  return (
    <div className="grid grid-cols-8 gap-2">
      {allIcons.map((iconName) => {
        const IconComponent = getIconComponent(iconName);
        return (
          <button
            type="button"
            key={iconName}
            onClick={() => onChange(iconName)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-md border transition-colors",
              value === iconName ? "border-primary ring-2 ring-primary" : "border-input"
            )}
          >
            <IconComponent className="h-5 w-5" />
          </button>
        );
      })}
    </div>
  );
};

export default IconPicker;