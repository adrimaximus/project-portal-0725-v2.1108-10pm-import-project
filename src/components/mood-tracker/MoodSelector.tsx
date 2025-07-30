import { moods, Mood } from '@/data/mood';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MoodSelectorProps {
  selectedMoodId: Mood['id'];
  onSelectMood: (id: Mood['id']) => void;
}

const moodColors: { [key: string]: string } = {
  great: 'bg-green-100',
  good: 'bg-sky-100',
  okay: 'bg-yellow-100',
  bad: 'bg-orange-100',
  awful: 'bg-red-100',
};

const MoodSelector = ({ selectedMoodId, onSelectMood }: MoodSelectorProps) => {
  return (
    <div className="grid grid-cols-1 gap-1">
      {moods.map((mood) => (
        <Button
          key={mood.id}
          variant="ghost"
          onClick={() => onSelectMood(mood.id)}
          className="w-full justify-start h-auto p-2"
        >
          <div
            className={cn(
              'w-10 h-10 flex items-center justify-center rounded-lg mr-3 transition-opacity',
              moodColors[mood.id],
              selectedMoodId !== mood.id && 'opacity-50'
            )}
          >
            <span className="text-2xl">{mood.emoji}</span>
          </div>
          <span className="font-semibold">{mood.label}</span>
        </Button>
      ))}
    </div>
  );
};

export default MoodSelector;