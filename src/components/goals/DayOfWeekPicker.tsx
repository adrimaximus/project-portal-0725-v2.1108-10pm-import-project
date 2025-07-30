import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const days = [
  { key: 'Su', label: 'S' },
  { key: 'Mo', label: 'M' },
  { key: 'Tu', label: 'T' },
  { key: 'We', label: 'W' },
  { key: 'Th', label: 'T' },
  { key: 'Fr', label: 'F' },
  { key: 'Sa', label: 'S' },
];

interface DayOfWeekPickerProps {
  selectedDays: string[];
  onDayToggle: (dayKey: string) => void;
}

const DayOfWeekPicker = ({ selectedDays, onDayToggle }: DayOfWeekPickerProps) => {
  return (
    <div className="flex justify-center gap-1">
      {days.map(day => (
        <Button
          key={day.key}
          variant={selectedDays.includes(day.key) ? 'default' : 'outline'}
          size="icon"
          className={cn(
            "h-8 w-8 rounded-full",
            selectedDays.includes(day.key) && "text-white"
          )}
          onClick={() => onDayToggle(day.key)}
        >
          {day.label}
        </Button>
      ))}
    </div>
  );
};

export default DayOfWeekPicker;