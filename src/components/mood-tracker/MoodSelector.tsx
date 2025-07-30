import { moods, Mood } from '@/data/mood';
import { cn } from '@/lib/utils';

interface MoodSelectorProps {
  selectedMoodId: Mood['id'];
  onSelectMood: (moodId: Mood['id']) => void;
}

const MoodSelector = ({ selectedMoodId, onSelectMood }: MoodSelectorProps) => {
  return (
    <div className="flex items-center gap-4 sm:gap-8">
      {moods.map((mood) => (
        <button
          key={mood.id}
          onClick={() => onSelectMood(mood.id)}
          className={cn(
            'p-1 rounded-full transition-all duration-200 transform hover:scale-110 focus:outline-none',
            selectedMoodId === mood.id ? `ring-2 ${mood.ringColor} ring-offset-2` : 'ring-0'
          )}
          aria-label={`Select mood: ${mood.label}`}
        >
          <mood.Icon className={cn('h-16 w-16 sm:h-20 sm:w-20', mood.color)} />
        </button>
      ))}
    </div>
  );
};

export default MoodSelector;