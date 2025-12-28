import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Loader2, FileSpreadsheet, RotateCw } from "lucide-react";

interface SheetUrlInputProps {
  sheetUrl: string;
  onUrlChange: (url: string) => void;
  onAiExtract: () => void;
  onRefresh: () => void;
  isAiLoading: boolean;
}

export function SheetUrlInput({ sheetUrl, onUrlChange, onAiExtract, onRefresh, isAiLoading }: SheetUrlInputProps) {
  return (
    <div className="flex items-center gap-2 w-full max-w-xl">
      <div className="bg-green-100 p-2 rounded-md">
        <FileSpreadsheet className="h-4 w-4 text-green-700 shrink-0" />
      </div>
      <div className="flex-1 flex items-center gap-1">
        <Input
          placeholder="Paste Google Sheet URL here..."
          value={sheetUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          className="flex-1 bg-background h-9 text-sm"
        />
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={onRefresh}
          disabled={!sheetUrl}
          title="Refresh Sheet Preview"
          type="button"
        >
          <RotateCw className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
      <Button
        variant="default"
        size="sm"
        className="bg-purple-600 hover:bg-purple-700 text-white gap-2 min-w-[100px] h-9"
        onClick={onAiExtract}
        disabled={isAiLoading || !sheetUrl}
        type="button"
      >
        {isAiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        <span className="hidden sm:inline">Sync AI</span>
      </Button>
    </div>
  );
}