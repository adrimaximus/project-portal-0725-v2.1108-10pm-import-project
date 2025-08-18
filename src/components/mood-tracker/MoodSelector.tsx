import { moods, Mood } from '@/data/mood';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MoodSelectorProps {
  selectedMoodId: Mood['id'];
  onSelectMood: (id: Mood['id']) => void;
}

const MoodSelector = ({ selectedMoodId, onSelectMood }: MoodSelectorProps) => {
  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex items-center justify-center gap-2 py-2">
        {moods.map((mood) => {
          const isSelected = selectedMoodId === mood.id;
          return (
            <Tooltip key={mood.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onSelectMood(mood.id)}
                  className={cn(
                    'h-12 w-12 rounded-full transition-all duration-200 ease-in-out',
                    isSelected
                      ? 'scale-110 ring-2 ring-offset-2'
                      : 'hover:scale-105'
                  )}
                  style={{ 
                    backgroundColor: mood.color,
                    ...(isSelected && { ringColor: mood.ringColor })
                  }}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{mood.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default MoodSelector;