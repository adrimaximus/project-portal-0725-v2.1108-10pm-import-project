import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, FileSpreadsheet, RotateCw, Bot } from "lucide-react";

interface SheetUrlInputProps {
  sheetUrl: string;
  onUrlChange: (url: string) => void;
  onRefreshEmbed: () => void;
  onSyncData: () => void;
  isAiLoading: boolean;
}

export function SheetUrlInput({ sheetUrl, onUrlChange, onRefreshEmbed, onSyncData, isAiLoading }: SheetUrlInputProps) {
  return (
    <div className="flex items-center gap-2 w-full max-w-xl">
      <div className="bg-green-100 p-2 rounded-md border border-green-200">
        <FileSpreadsheet className="h-4 w-4 text-green-700 shrink-0" />
      </div>
      <div className="flex-1 flex items-center gap-2">
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
          className="h-9 w-9 shrink-0 border-dashed"
          onClick={onRefreshEmbed}
          disabled={!sheetUrl}
          title="Refresh Embed View Only"
          type="button"
        >
          <RotateCw className="h-4 w-4 text-muted-foreground" />
        </Button>

        <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

        <Button
          variant="default"
          size="sm"
          className="h-9 px-4 shrink-0 gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-sm border border-purple-700/20"
          onClick={onSyncData}
          disabled={!sheetUrl || isAiLoading}
          title="Extract data from 'Ajuan' sheet"
          type="button"
        >
          {isAiLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
          <span className="hidden sm:inline font-medium">Sync Agent</span>
        </Button>
      </div>
    </div>
  );
}