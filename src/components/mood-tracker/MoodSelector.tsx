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
            'w-full justify-start h-auto p-2 border',
            selectedMoodId === mood.id ? 'border-primary' : 'border-transparent'
          )}
        >
          <span className="text-2xl mr-3">{mood.emoji}</span>
          <span className="font-semibold">{mood.label}</span>
        </Button>
      ))}
    </div>
  );
};

export default MoodSelector;