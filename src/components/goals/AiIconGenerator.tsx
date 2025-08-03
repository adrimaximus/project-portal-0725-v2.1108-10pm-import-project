import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { generateIconWithDalle } from "@/lib/openai";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

interface AiIconGeneratorProps {
  onIconGenerated: (url: string) => void;
}

const AiIconGenerator = ({ onIconGenerated }: AiIconGeneratorProps) => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) {
      toast.error("Please enter a description for the icon.");
      return;
    }
    setIsLoading(true);
    setGeneratedImageUrl(null);
    try {
      const url = await generateIconWithDalle(prompt);
      setGeneratedImageUrl(url);
      toast.success("Icon generated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate icon.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseIcon = () => {
    if (generatedImageUrl) {
      onIconGenerated(generatedImageUrl);
      toast.info("AI generated icon has been selected.");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="icon-prompt">Describe your icon</Label>
        <p className="text-sm text-muted-foreground mb-2">
          For example: "A rocket launching", "A book with a bookmark", "A growing plant".
        </p>
        <div className="flex gap-2">
          <Input
            id="icon-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A minimalist icon of..."
            disabled={isLoading}
          />
          <Button onClick={handleGenerate} disabled={isLoading || !prompt}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">Generate</span>
          </Button>
        </div>
      </div>

      {generatedImageUrl && (
        <div className="space-y-4 rounded-md border bg-muted/50 p-4">
          <p className="font-medium text-sm">Generated Icon:</p>
          <div className="flex justify-center">
            <img src={generatedImageUrl} alt="Generated goal icon" className="h-32 w-32 rounded-lg object-cover" />
          </div>
          <Button onClick={handleUseIcon} className="w-full">
            Use this Icon
          </Button>
        </div>
      )}
    </div>
  );
};

export default AiIconGenerator;