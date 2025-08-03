import { useState } from 'react';
import { Goal } from '@/data/goals';
import { generateAiIcon } from '@/lib/openai';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GoalIconProps {
  goal: Goal;
  onIconUpdate: (newIconUrl: string) => void;
}

const GoalIcon = ({ goal, onIconUpdate }: GoalIconProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateIcon = async () => {
    setIsGenerating(true);
    const toastId = toast.loading("AI sedang membuat ikon baru...");

    const result = await generateAiIcon(goal.title);

    if (result.startsWith('http')) {
      onIconUpdate(result);
      toast.success("Ikon baru berhasil dibuat!", { id: toastId });
    } else {
      toast.error(result, { id: toastId });
    }
    
    setIsGenerating(false);
  };

  const isUrl = goal.icon.startsWith('http');

  return (
    <div className="relative group">
      <div 
        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl overflow-hidden" 
        style={{ backgroundColor: `${goal.color}30`, color: goal.color }}
      >
        {isUrl ? (
          <img src={goal.icon} alt={goal.title} className="w-full h-full object-cover" />
        ) : (
          <span>{goal.icon}</span>
        )}
      </div>
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-opacity duration-300 rounded-lg">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white hover:bg-white/20 hover:text-white"
                onClick={handleGenerateIcon}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Buat Ikon dengan AI</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default GoalIcon;