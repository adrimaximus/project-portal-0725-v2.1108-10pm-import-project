import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, Users, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { PROJECT_STATUS_OPTIONS } from "@/types";
import { Badge } from "@/components/ui/badge";

export interface AdvancedFiltersState {
  showOnlyMultiPerson: boolean;
  hiddenStatuses: string[];
}

interface ProjectAdvancedFiltersProps {
  filters: AdvancedFiltersState;
  onFiltersChange: (filters: AdvancedFiltersState) => void;
}

const ProjectAdvancedFilters = ({ filters, onFiltersChange }: ProjectAdvancedFiltersProps) => {
  const handleMultiPersonToggle = (checked: boolean) => {
    onFiltersChange({ ...filters, showOnlyMultiPerson: checked });
  };

  const handleStatusToggle = (statusValue: string, checked: boolean) => {
    const newHiddenStatuses = checked
      ? [...filters.hiddenStatuses, statusValue]
      : filters.hiddenStatuses.filter(s => s !== statusValue);
    onFiltersChange({ ...filters, hiddenStatuses: newHiddenStatuses });
  };

  const activeFilterCount = (filters.showOnlyMultiPerson ? 1 : 0) + filters.hiddenStatuses.length;

  const clearFilters = () => {
    onFiltersChange({ showOnlyMultiPerson: false, hiddenStatuses: [] });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Filter
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Advanced Filters</h4>
            <p className="text-sm text-muted-foreground">
              Refine your project view.
            </p>
          </div>
          <div className="grid gap-4">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="multi-person-filter" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Multi-person projects only</span>
              </Label>
              <Switch
                id="multi-person-filter"
                checked={filters.showOnlyMultiPerson}
                onCheckedChange={handleMultiPersonToggle}
              />
            </div>
            <div className="space-y-2">
              <Label>Hide Statuses</Label>
              <div className="space-y-2">
                {PROJECT_STATUS_OPTIONS.map(status => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status.value}`}
                      checked={filters.hiddenStatuses.includes(status.value)}
                      onCheckedChange={(checked) => handleStatusToggle(status.value, !!checked)}
                    />
                    <Label htmlFor={`status-${status.value}`} className="text-sm font-normal">
                      {status.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ProjectAdvancedFilters;