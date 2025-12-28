import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, FileSpreadsheet, RotateCw } from "lucide-react";

interface SheetUrlInputProps {
  sheetUrl: string;
  onUrlChange: (url: string) => void;
  onRefresh: () => void;
  isAiLoading: boolean;
}

export function SheetUrlInput({ sheetUrl, onUrlChange, onRefresh, isAiLoading }: SheetUrlInputProps) {
  return (
    <div className="flex items-center gap-2 w-full max-w-xl">
      <div className="bg-green-100 p-2 rounded-md">
        <FileSpreadsheet className="h-4 w-4 text-green-700 shrink-0" />
      </div>
      <div className="flex-1 flex items-center gap-1">
        <div className="relative flex-1">
          <Input
            placeholder="Paste Google Sheet URL here..."
            value={sheetUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            className="w-full bg-background h-9 text-sm pr-8"
            disabled={isAiLoading}
          />
          {isAiLoading && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={onRefresh}
          disabled={!sheetUrl || isAiLoading}
          title="Refresh Sheet & Re-sync"
          type="button"
        >
          <RotateCw className={`h-4 w-4 text-muted-foreground ${isAiLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
}