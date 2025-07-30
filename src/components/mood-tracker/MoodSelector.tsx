import { moods, Mood } from '@/data/mood';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface MoodSelectorProps {
  selectedMoodId: Mood['id'];
  onSelectMood: (id: Mood['id']) => void;
}

const MoodSelector = ({ selectedMoodId, onSelectMood }: MoodSelectorProps) => {
  return (
    <div className="space-y-1">
      {moods.map((mood) => {
        const isSelected = mood.id === selectedMoodId;
        return (
          <button
            key={mood.id}
            onClick={() => onSelectMood(mood.id)}
            className={cn(
              'w-full flex items-center gap-4 p-3 rounded-lg border transition-colors text-left',
              isSelected
                ? 'bg-primary/10 border-primary'
                : 'border-transparent hover:bg-accent'
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center w-5 h-5 rounded-full border-2 shrink-0',
                isSelected
                  ? 'bg-primary border-primary'
                  : 'bg-transparent border-muted-foreground/50'
              )}
            >
              {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
            </div>
            <span className="text-2xl">{mood.emoji}</span>
            <span className="font-medium">{mood.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MoodSelector;