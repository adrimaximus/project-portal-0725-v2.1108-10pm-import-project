import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, Users, X, ChevronsUpDown, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PROJECT_STATUS_OPTIONS } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface Person {
  id: string;
  name: string;
}

export interface AdvancedFiltersState {
  showOnlyMultiPerson: boolean;
  hiddenStatuses: string[];
  selectedPeopleIds: string[];
}

interface ProjectAdvancedFiltersProps {
  filters: AdvancedFiltersState;
  onFiltersChange: (filters: AdvancedFiltersState) => void;
  allPeople: Person[];
}

const ProjectAdvancedFilters = ({ filters, onFiltersChange, allPeople }: ProjectAdvancedFiltersProps) => {
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
  const [peoplePopoverOpen, setPeoplePopoverOpen] = useState(false);

  const handleMultiPersonToggle = (checked: boolean) => {
    onFiltersChange({ ...filters, showOnlyMultiPerson: checked });
  };

  const handleStatusToggle = (statusValue: string) => {
    const isSelected = filters.hiddenStatuses.includes(statusValue);
    const newHiddenStatuses = isSelected
      ? filters.hiddenStatuses.filter(s => s !== statusValue)
      : [...filters.hiddenStatuses, statusValue];
    onFiltersChange({ ...filters, hiddenStatuses: newHiddenStatuses });
  };

  const handlePersonToggle = (personId: string) => {
    const isSelected = filters.selectedPeopleIds.includes(personId);
    const newSelectedPeopleIds = isSelected
      ? filters.selectedPeopleIds.filter(id => id !== personId)
      : [...filters.selectedPeopleIds, personId];
    onFiltersChange({ ...filters, selectedPeopleIds: newSelectedPeopleIds });
  };

  const activeFilterCount = (filters.showOnlyMultiPerson ? 1 : 0) + filters.hiddenStatuses.length + filters.selectedPeopleIds.length;

  const clearFilters = () => {
    onFiltersChange({ showOnlyMultiPerson: false, hiddenStatuses: [], selectedPeopleIds: [] });
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
              <Label>Filter by Person</Label>
              <Popover open={peoplePopoverOpen} onOpenChange={setPeoplePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={peoplePopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    {filters.selectedPeopleIds.length > 0
                      ? `${filters.selectedPeopleIds.length} people selected`
                      : "Select people..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search person..." />
                    <CommandList>
                      <CommandEmpty>No person found.</CommandEmpty>
                      <CommandGroup>
                        {allPeople.map((person) => (
                          <CommandItem
                            key={person.id}
                            onSelect={() => handlePersonToggle(person.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filters.selectedPeopleIds.includes(person.id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {person.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Hide Statuses</Label>
              <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={statusPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    {filters.hiddenStatuses.length > 0
                      ? `${filters.hiddenStatuses.length} selected`
                      : "Select statuses to hide..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search status..." />
                    <CommandList>
                      <CommandEmpty>No status found.</CommandEmpty>
                      <CommandGroup>
                        {PROJECT_STATUS_OPTIONS.map((status) => (
                          <CommandItem
                            key={status.value}
                            onSelect={() => handleStatusToggle(status.value)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filters.hiddenStatuses.includes(status.value) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {status.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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