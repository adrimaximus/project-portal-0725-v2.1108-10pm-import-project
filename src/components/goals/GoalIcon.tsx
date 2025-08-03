import { useState } from 'react';
import { Goal } from '@/data/goals';
import { generateAiIcon } from '@/lib/openai';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getIconComponent } from '@/data/icons';
import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';

interface GoalIconProps {
  goal: Goal;
  onIconUpdate?: (newIconUrl: string) => void;
  className?: string;
}

const GoalIcon = ({ goal, onIconUpdate, className }: GoalIconProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateIcon = async () => {
    if (!onIconUpdate) return;
    setIsGenerating(true);
    const toastId = toast.loading("AI sedang membuat ikon baru...");

    try {
      const result = await generateAiIcon(goal.title);
      onIconUpdate(result);
      toast.success("Ikon baru berhasil dibuat!", { id: toastId });
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    }
    
    setIsGenerating(false);
  };

  const isUrl = goal.iconUrl;
  const IconComponent = getIconComponent(goal.icon) || ImageIcon;

  return (
    <div className={cn("relative group", className)}>
      <div 
        className="w-full h-full rounded-lg flex items-center justify-center text-2xl overflow-hidden" 
        style={{ backgroundColor: `${goal.color}30`, color: goal.color }}
      >
        {isUrl ? (
          <img src={goal.iconUrl} alt={goal.title} className="w-1/2 h-1/2 object-cover rounded-md" />
        ) : (
          <IconComponent className="h-1/2 w-1/2" />
        )}
      </div>
      {onIconUpdate && (
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
      )}
    </div>
  );
};

export default GoalIcon;