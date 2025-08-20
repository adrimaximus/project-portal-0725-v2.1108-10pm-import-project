import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { generateAiIcon } from '@/lib/openai';
import { toast } from 'sonner';

interface AiIconGeneratorProps {
  onIconGenerated: (url: string) => void;
}

const AiIconGenerator = ({ onIconGenerated }: AiIconGeneratorProps) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt for the icon.");
      return;
    }
    setIsLoading(true);
    try {
      const url = await generateAiIcon(prompt);
      onIconGenerated(url);
      toast.success("Icon generated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate icon.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Describe the icon you want to generate.</p>
      <div className="flex gap-2">
        <Input
          placeholder="e.g., A rocket launching to the moon"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
        />
        <Button onClick={handleGenerate} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          <span className="sr-only">Generate</span>
        </Button>
      </div>
    </div>
  );
};

export default AiIconGenerator;