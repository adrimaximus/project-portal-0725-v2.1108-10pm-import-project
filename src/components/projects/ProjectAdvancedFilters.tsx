import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, X, ChevronsUpDown, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { PROJECT_STATUS_OPTIONS } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose
} from "@/components/ui/drawer";
import { DateRange } from "react-day-picker";

interface Person {
  id: string;
  name: string;
}

export interface AdvancedFiltersState {
  hiddenStatuses: string[];
  selectedPeopleIds: string[];
  status: string[];
  dueDate: DateRange | null;
}

interface ProjectAdvancedFiltersProps {
  filters: AdvancedFiltersState;
  onFiltersChange: (filters: AdvancedFiltersState) => void;
  allPeople: Person[];
}

const ProjectAdvancedFilters = ({ filters, onFiltersChange, allPeople }: ProjectAdvancedFiltersProps) => {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [hideStatusPopoverOpen, setHideStatusPopoverOpen] = useState(false);
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false);
  const [projectStatusPopoverOpen, setProjectStatusPopoverOpen] = useState(false);

  const handleHideStatusToggle = (statusValue: string) => {
    const isSelected = filters.hiddenStatuses.includes(statusValue);
    const newHiddenStatuses = isSelected
      ? filters.hiddenStatuses.filter(s => s !== statusValue)
      : [...filters.hiddenStatuses, statusValue];
    onFiltersChange({ ...filters, hiddenStatuses: newHiddenStatuses });
  };

  const handleAssigneeToggle = (personId: string) => {
    const isSelected = filters.selectedPeopleIds.includes(personId);
    const newSelectedPeopleIds = isSelected
      ? filters.selectedPeopleIds.filter(id => id !== personId)
      : [...filters.selectedPeopleIds, personId];
    onFiltersChange({ ...filters, selectedPeopleIds: newSelectedPeopleIds });
  };

  const handleProjectStatusToggle = (statusValue: string) => {
    const isSelected = filters.status.includes(statusValue);
    const newStatus = isSelected
      ? filters.status.filter(s => s !== statusValue)
      : [...filters.status, statusValue];
    onFiltersChange({ ...filters, status: newStatus });
  };

  const activeFilterCount = filters.hiddenStatuses.length + filters.selectedPeopleIds.length + filters.status.length;

  const clearFilters = () => {
    onFiltersChange({ hiddenStatuses: [], selectedPeopleIds: [], status: [], dueDate: null });
  };

  const triggerButton = (
    <Button variant="outline" size="icon" className="relative">
      <Filter className="h-4 w-4" />
      {activeFilterCount > 0 && (
        <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">
          {activeFilterCount}
        </Badge>
      )}
      <span className="sr-only">Filter Projects</span>
    </Button>
  );

  const filterContent = (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label>Filter by Assignee</Label>
        <Popover open={assigneePopoverOpen} onOpenChange={setAssigneePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={assigneePopoverOpen}
              className="w-full justify-between font-normal"
            >
              {filters.selectedPeopleIds.length > 0
                ? `${filters.selectedPeopleIds.length} people selected`
                : "Select assignees..."}
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
                      value={person.name}
                      onSelect={() => handleAssigneeToggle(person.id)}
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
        <Label>Filter by Project Status</Label>
        <Popover open={projectStatusPopoverOpen} onOpenChange={setProjectStatusPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={projectStatusPopoverOpen}
              className="w-full justify-between font-normal"
            >
              {filters.status.length > 0
                ? `${filters.status.length} statuses selected`
                : "Select project statuses..."}
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
                      value={status.label}
                      onSelect={() => handleProjectStatusToggle(status.value)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          filters.status.includes(status.value) ? "opacity-100" : "opacity-0"
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

      <div className="space-y-2">
        <Label>Hide Statuses</Label>
        <Popover open={hideStatusPopoverOpen} onOpenChange={setHideStatusPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={hideStatusPopoverOpen}
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
                      value={status.label}
                      onSelect={() => handleHideStatusToggle(status.value)}
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
      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {triggerButton}
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Advanced Filters</h4>
            </div>
            {filterContent}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {triggerButton}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Advanced Filters</DrawerTitle>
        </DrawerHeader>
        <div className="p-4">
          {filterContent}
        </div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default ProjectAdvancedFilters;