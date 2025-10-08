import { Input } from "@/components/ui/input";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Search, Table as TableIcon, Kanban } from "lucide-react";
import { DateRange } from "react-day-picker";

interface BillingToolbarProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  viewMode: 'table' | 'kanban';
  onViewModeChange: (mode: 'table' | 'kanban') => void;
}

const BillingToolbar = ({
  searchTerm,
  onSearchTermChange,
  dateRange,
  onDateRangeChange,
  viewMode,
  onViewModeChange,
}: BillingToolbarProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by invoice #, project, client, PO #, or channel..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <DatePickerWithRange date={dateRange} onDateChange={onDateRangeChange} />
        <ToggleGroup type="single" value={viewMode} onValueChange={(value) => { if (value) onViewModeChange(value as 'table' | 'kanban') }}>
          <ToggleGroupItem value="table" aria-label="Table view"><TableIcon className="h-4 w-4" /></ToggleGroupItem>
          <ToggleGroupItem value="kanban" aria-label="Kanban view"><Kanban className="h-4 w-4" /></ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
};

export default BillingToolbar;