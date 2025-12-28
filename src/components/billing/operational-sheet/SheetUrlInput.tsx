import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Loader2 } from "lucide-react";

interface SheetUrlInputProps {
  sheetUrl: string;
  onUrlChange: (url: string) => void;
  onAiExtract: () => void;
  isAiLoading: boolean;
}

export function SheetUrlInput({ sheetUrl, onUrlChange, onAiExtract, isAiLoading }: SheetUrlInputProps) {
  return (
    <div className="flex items-center gap-2 w-full max-w-xl">
      <RefreshCw className="h-4 w-4 text-muted-foreground shrink-0" />
      <Input
        placeholder="Paste Google Sheet URL here..."
        value={sheetUrl}
        onChange={(e) => onUrlChange(e.target.value)}
        className="flex-1 bg-background h-9 text-sm"
      />
      <Button
        variant="default"
        size="sm"
        className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
        onClick={onAiExtract}
        disabled={isAiLoading || !sheetUrl}
      >
        {isAiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        <span className="hidden sm:inline">AI Sync</span>
      </Button>
    </div>
  );
}