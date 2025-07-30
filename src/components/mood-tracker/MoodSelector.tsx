import { moods, Mood } from '@/data/mood';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MoodSelectorProps {
  selectedMoodId: Mood['id'];
  onSelectMood: (id: Mood['id']) => void;
}

const MoodSelector = ({ selectedMoodId, onSelectMood }: MoodSelectorProps) => {
  return (
    <div className="grid grid-cols-1 gap-1">
      {moods.map((mood) => (
        <Button
          key={mood.id}
          variant={selectedMoodId === mood.id ? 'secondary' : 'ghost'}
          onClick={() => onSelectMood(mood.id)}
          className={cn(
            'w-full justify-start h-auto p-2 border flex items-center',
            selectedMoodId === mood.id ? 'border-primary' : 'border-transparent'
          )}
        >
          <div
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center mr-3',
              mood.color
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