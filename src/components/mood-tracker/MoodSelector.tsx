import { moods, Mood } from '@/data/mood';
import { cn } from '@/lib/utils';

interface MoodSelectorProps {
  selectedMoodId: Mood['id'];
  onSelectMood: (moodId: Mood['id']) => void;
}

const MoodSelector = ({ selectedMoodId, onSelectMood }: MoodSelectorProps) => {
  return (
    <div className="flex items-center gap-2 sm:gap-4">
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
          <span className="text-4xl sm:text-5xl">{mood.emoji}</span>
        </button>
      ))}
    </div>
  );
};

export default MoodSelector;