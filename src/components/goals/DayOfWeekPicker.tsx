import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const days = [
  { key: 'Su', label: 'Su' },
  { key: 'Mo', label: 'Mo' },
  { key: 'Tu', label: 'Tu' },
  { key: 'We', label: 'We' },
  { key: 'Th', label: 'Th' },
  { key: 'Fr', 'label': 'Fr' },
  { key: 'Sa', label: 'Sa' },
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